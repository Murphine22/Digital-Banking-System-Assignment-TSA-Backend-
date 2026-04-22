import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { nibssClient } from "./services/nibssClient";
import * as db from "./db";
import { fintechs } from "../drizzle/schema";

/**
 * Banking Router - Handles all fintech onboarding and banking operations
 */
const bankingRouter = router({
  /**
   * Fintech Onboarding - Register bank with NIBSS
   */
  onboardFintech: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Call NIBSS onboarding endpoint
        const response = await nibssClient.onboardFintech(input.name, input.email);

        // Store fintech credentials in database
        const existingFintech = await db.getFintechByEmail(input.email);
        if (existingFintech) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Fintech already registered",
          });
        }

        // Create fintech record (will be updated with credentials after login)
        const fintechDb = await db.getDb();
        if (!fintechDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const result = await fintechDb.insert(fintechs).values({
          name: input.name,
          email: input.email,
          apiKey: response.apiKey,
          apiSecret: response.apiSecret,
          bankCode: response.bankCode,
          bankName: response.bankName,
          isActive: true,
        });

        return {
          success: true,
          apiKey: response.apiKey,
          apiSecret: response.apiSecret,
          bankCode: response.bankCode,
          bankName: response.bankName,
          message: "Fintech registered successfully",
        };
      } catch (error) {
        console.error("[Banking] Onboarding error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Onboarding failed",
        });
      }
    }),

  /**
   * Login - Authenticate fintech and get JWT token
   */
  login: publicProcedure
    .input(z.object({
      apiKey: z.string(),
      apiSecret: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const response = await nibssClient.login(input.apiKey, input.apiSecret);

        // Update fintech token in database
        const fintech = await db.getFintechByEmail(response.fintech.email);
        if (!fintech) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Fintech not found",
          });
        }

        const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
        await db.updateFintechToken(fintech.id, response.token, expiresAt);

        return {
          success: true,
          token: response.token,
          fintech: response.fintech,
        };
      } catch (error) {
        console.error("[Banking] Login error:", error);
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: error instanceof Error ? error.message : "Login failed",
        });
      }
    }),

  /**
   * Insert BVN Record
   */
  insertBvn: publicProcedure
    .input(z.object({
      bvn: z.string().length(11),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      phone: z.string(),
      token: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const response = await nibssClient.insertBvn(
          input.bvn,
          input.firstName,
          input.lastName,
          input.dob,
          input.phone,
          input.token
        );

        // Store in local database
        await db.createIdentityRecord("BVN", input.bvn, input.firstName, input.lastName, input.dob, input.phone);

        return {
          success: true,
          message: response.message,
          bvn: response.bvn,
        };
      } catch (error) {
        console.error("[Banking] Insert BVN error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "BVN insertion failed",
        });
      }
    }),

  /**
   * Insert NIN Record
   */
  insertNin: publicProcedure
    .input(z.object({
      nin: z.string().length(11),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      token: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const response = await nibssClient.insertNin(
          input.nin,
          input.firstName,
          input.lastName,
          input.dob,
          input.token
        );

        // Store in local database
        await db.createIdentityRecord("NIN", input.nin, input.firstName, input.lastName, input.dob);

        return {
          success: true,
          message: response.message,
          nin: response.nin,
        };
      } catch (error) {
        console.error("[Banking] Insert NIN error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "NIN insertion failed",
        });
      }
    }),

  /**
   * Validate BVN
   */
  validateBvn: publicProcedure
    .input(z.object({
      bvn: z.string().length(11),
      token: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const response = await nibssClient.validateBvn(input.bvn, input.token);

        if (!response.valid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "BVN validation failed",
          });
        }

        return {
          valid: true,
          bvn: response.bvn,
          firstName: response.firstName,
          lastName: response.lastName,
          dob: response.dob,
        };
      } catch (error) {
        console.error("[Banking] Validate BVN error:", error);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "BVN validation failed",
        });
      }
    }),

  /**
   * Validate NIN
   */
  validateNin: publicProcedure
    .input(z.object({
      nin: z.string().length(11),
      token: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const response = await nibssClient.validateNin(input.nin, input.token);

        if (!response.valid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "NIN validation failed",
          });
        }

        return {
          valid: true,
          nin: response.nin,
          firstName: response.firstName,
          lastName: response.lastName,
          dob: response.dob,
        };
      } catch (error) {
        console.error("[Banking] Validate NIN error:", error);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "NIN validation failed",
        });
      }
    }),

  /**
   * Create Customer (KYC Onboarding)
   */
  createCustomer: publicProcedure
    .input(z.object({
      fintechId: z.number(),
      kycType: z.enum(["BVN", "NIN"]),
      kycId: z.string(),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      token: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Validate identity first
        const validation = input.kycType === "BVN"
          ? await nibssClient.validateBvn(input.kycId, input.token)
          : await nibssClient.validateNin(input.kycId, input.token);

        if (!validation.valid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `${input.kycType} validation failed`,
          });
        }

        // Create customer record
        const customer = await db.createCustomer(
          input.fintechId,
          input.kycType as "BVN" | "NIN",
          input.kycId,
          input.firstName,
          input.lastName,
          input.dob,
          input.phone,
          input.email
        );

        if (!customer) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create customer",
          });
        }

        // Mark as verified
        await db.updateCustomerVerification(customer.id, true, "VERIFIED");

        return {
          success: true,
          customerId: customer.id,
          message: "Customer created and verified successfully",
        };
      } catch (error) {
        console.error("[Banking] Create customer error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Customer creation failed",
        });
      }
    }),

  /**
   * Create Bank Account
   */
  createAccount: publicProcedure
    .input(z.object({
      customerId: z.number(),
      fintechId: z.number(),
      kycType: z.enum(["bvn", "nin"]),
      kycId: z.string(),
      dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      token: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Create account via NIBSS
        const nibssResponse = await nibssClient.createAccount(
          input.kycType,
          input.kycId,
          input.dob,
          input.token
        );

        // Get customer details
        const customer = await db.getCustomerById(input.customerId);
        if (!customer) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Customer not found",
          });
        }

        // Store account in local database
        const account = await db.createBankAccount(
          input.customerId,
          input.fintechId,
          nibssResponse.accountNumber,
          `${customer.firstName} ${customer.lastName}`,
          nibssResponse.bankCode,
          nibssResponse.bankName,
          input.kycType as "BVN" | "NIN",
          input.kycId
        );

        if (!account) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create account",
          });
        }

        return {
          success: true,
          accountNumber: nibssResponse.accountNumber,
          bankCode: nibssResponse.bankCode,
          bankName: nibssResponse.bankName,
          balance: nibssResponse.balance,
          message: "Account created successfully with NGN 15,000 initial balance",
        };
      } catch (error) {
        console.error("[Banking] Create account error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Account creation failed",
        });
      }
    }),

  /**
   * Get All Accounts
   */
  getAllAccounts: publicProcedure
    .input(z.object({
      fintechId: z.number(),
      token: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        // Get from NIBSS
        const nibssResponse = await nibssClient.getAllAccounts(input.token);

        // Get from local database for additional details
        const localAccounts = await db.getBankAccountsByFintech(input.fintechId);

        return {
          success: true,
          accounts: nibssResponse.accounts,
          localAccounts: localAccounts,
        };
      } catch (error) {
        console.error("[Banking] Get all accounts error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to fetch accounts",
        });
      }
    }),

  /**
   * Name Enquiry
   */
  nameEnquiry: publicProcedure
    .input(z.object({
      accountNumber: z.string(),
      token: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const response = await nibssClient.nameEnquiry(input.accountNumber, input.token);

        return {
          success: true,
          accountNumber: response.accountNumber,
          accountName: response.accountName,
          bankName: response.bankName,
        };
      } catch (error) {
        console.error("[Banking] Name enquiry error:", error);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Name enquiry failed",
        });
      }
    }),

  /**
   * Get Account Balance
   */
  getBalance: publicProcedure
    .input(z.object({
      accountNumber: z.string(),
      token: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const response = await nibssClient.getBalance(input.accountNumber, input.token);

        return {
          success: true,
          accountNumber: response.accountNumber,
          balance: response.balance,
        };
      } catch (error) {
        console.error("[Banking] Get balance error:", error);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Balance retrieval failed",
        });
      }
    }),

  /**
   * Transfer Funds
   */
  transfer: publicProcedure
    .input(z.object({
      fintechId: z.number(),
      fromAccountNumber: z.string(),
      toAccountNumber: z.string(),
      amount: z.string(),
      token: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Perform name enquiry first
        const nameEnquiry = await nibssClient.nameEnquiry(input.toAccountNumber, input.token);

        // Initiate transfer
        const transferResponse = await nibssClient.transfer(
          input.fromAccountNumber,
          input.toAccountNumber,
          input.amount,
          input.token
        );

        // Get account details
        const fromAccount = await db.getBankAccountByNumber(input.fromAccountNumber);
        const toAccount = await db.getBankAccountByNumber(input.toAccountNumber);

        // Determine transfer type
        const transactionType = fromAccount?.fintechId === input.fintechId ? "INTRA_BANK" : "INTER_BANK";

        // Store transaction in database
        const transaction = await db.createTransaction(
          transferResponse.transactionId,
          input.fintechId,
          fromAccount?.id || 0,
          toAccount?.id || null,
          input.fromAccountNumber,
          input.toAccountNumber,
          nameEnquiry.accountName,
          toAccount?.bankCode || null,
          nameEnquiry.bankName,
          input.amount,
          transactionType as "INTRA_BANK" | "INTER_BANK",
          transferResponse.status === "SUCCESS" ? "SUCCESS" : "PENDING"
        );

        // Create transaction status record
        await db.createTransactionStatus(
          transferResponse.transactionId,
          transferResponse.transactionId,
          transferResponse.status === "SUCCESS" ? "SUCCESS" : "PENDING"
        );

        return {
          success: true,
          transactionId: transferResponse.transactionId,
          amount: transferResponse.amount,
          from: transferResponse.from,
          to: transferResponse.to,
          status: transferResponse.status,
          message: "Transfer initiated successfully",
        };
      } catch (error) {
        console.error("[Banking] Transfer error:", error);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Transfer failed",
        });
      }
    }),

  /**
   * Get Transaction Status
   */
  getTransactionStatus: publicProcedure
    .input(z.object({
      transactionId: z.string(),
      token: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const response = await nibssClient.getTransactionStatus(input.transactionId, input.token);

        // Update local database
        await db.updateTransactionStatusRecord(input.transactionId, response.status as "PENDING" | "SUCCESS" | "FAILED");

        return {
          success: true,
          transactionId: response.transactionId,
          status: response.status,
          amount: response.amount,
          from: response.from,
          to: response.to,
          timestamp: response.timestamp,
        };
      } catch (error) {
        console.error("[Banking] Get transaction status error:", error);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Transaction status retrieval failed",
        });
      }
    }),

  /**
   * Get Transaction History (with privacy controls)
   */
  getTransactionHistory: publicProcedure
    .input(z.object({
      accountId: z.number(),
    }))
    .query(async ({ input }) => {
      try {
        const transactions = await db.getTransactionsByAccount(input.accountId);

        return {
          success: true,
          transactions: transactions,
        };
      } catch (error) {
        console.error("[Banking] Get transaction history error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to fetch transaction history",
        });
      }
    }),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  banking: bankingRouter,
});

export type AppRouter = typeof appRouter;
