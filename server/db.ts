import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, fintechs, identityRecords, customers, bankAccounts, transactions, transactionStatuses, Fintech, Customer, BankAccount, Transaction, IdentityRecord } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ FINTECH OPERATIONS ============

export async function getOrCreateFintech(name: string, email: string): Promise<Fintech | null> {
  const db = await getDb();
  if (!db) return null;

  const existing = await db.select().from(fintechs).where(eq(fintechs.email, email)).limit(1);
  if (existing.length > 0) {
    return existing[0];
  }

  return null;
}

export async function updateFintechCredentials(fintechId: number, apiKey: string, apiSecret: string, bankCode: string, bankName: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(fintechs)
    .set({ apiKey, apiSecret, bankCode, bankName })
    .where(eq(fintechs.id, fintechId));
}

export async function updateFintechToken(fintechId: number, jwtToken: string, expiresAt: Date): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(fintechs)
    .set({ jwtToken, tokenExpiresAt: expiresAt })
    .where(eq(fintechs.id, fintechId));
}

export async function getFintechByEmail(email: string): Promise<Fintech | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(fintechs).where(eq(fintechs.email, email)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getFintechById(id: number): Promise<Fintech | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(fintechs).where(eq(fintechs.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ============ IDENTITY OPERATIONS ============

export async function createIdentityRecord(identityType: "BVN" | "NIN", identityNumber: string, firstName: string, lastName: string, dateOfBirth: string, phone?: string): Promise<IdentityRecord | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    await db.insert(identityRecords).values({
      identityType,
      identityNumber,
      firstName,
      lastName,
      dateOfBirth,
      phone,
      isVerified: true,
    });

    const result = await db.select().from(identityRecords)
      .where(eq(identityRecords.identityNumber, identityNumber))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Error creating identity record:", error);
    return null;
  }
}

export async function getIdentityRecord(identityType: "BVN" | "NIN", identityNumber: string): Promise<IdentityRecord | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(identityRecords)
    .where(and(
      eq(identityRecords.identityType, identityType),
      eq(identityRecords.identityNumber, identityNumber)
    ))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// ============ CUSTOMER OPERATIONS ============

export async function createCustomer(fintechId: number, kycType: "BVN" | "NIN", kycId: string, firstName: string, lastName: string, dateOfBirth: string, phone?: string, email?: string): Promise<Customer | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Check if customer already exists with this KYC ID
    const existing = await db.select().from(customers)
      .where(and(
        eq(customers.fintechId, fintechId),
        eq(customers.kycId, kycId)
      ))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    await db.insert(customers).values({
      fintechId,
      kycType,
      kycId,
      firstName,
      lastName,
      dateOfBirth,
      phone,
      email,
      isVerified: false,
      verificationStatus: "PENDING",
    });

    const result = await db.select().from(customers)
      .where(and(
        eq(customers.fintechId, fintechId),
        eq(customers.kycId, kycId)
      ))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Error creating customer:", error);
    return null;
  }
}

export async function updateCustomerVerification(customerId: number, isVerified: boolean, status: "VERIFIED" | "FAILED" = "VERIFIED"): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(customers)
    .set({ isVerified, verificationStatus: status })
    .where(eq(customers.id, customerId));
}

export async function getCustomerById(id: number): Promise<Customer | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getCustomerByKycId(fintechId: number, kycId: string): Promise<Customer | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(customers)
    .where(and(
      eq(customers.fintechId, fintechId),
      eq(customers.kycId, kycId)
    ))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// ============ BANK ACCOUNT OPERATIONS ============

export async function createBankAccount(customerId: number, fintechId: number, accountNumber: string, accountName: string, bankCode: string, bankName: string, kycType: "BVN" | "NIN", kycId: string): Promise<BankAccount | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Check if customer already has an account
    const existing = await db.select().from(bankAccounts)
      .where(eq(bankAccounts.customerId, customerId))
      .limit(1);

    if (existing.length > 0) {
      throw new Error("Customer already has a bank account");
    }

    await db.insert(bankAccounts).values({
      customerId,
      fintechId,
      accountNumber,
      accountName,
      bankCode,
      bankName,
      balance: "15000",
      kycType,
      kycId,
      isActive: true,
    });

    const result = await db.select().from(bankAccounts)
      .where(eq(bankAccounts.accountNumber, accountNumber))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Error creating bank account:", error);
    throw error;
  }
}

export async function getBankAccountByNumber(accountNumber: string): Promise<BankAccount | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(bankAccounts).where(eq(bankAccounts.accountNumber, accountNumber)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getBankAccountById(id: number): Promise<BankAccount | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(bankAccounts).where(eq(bankAccounts.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getBankAccountsByFintech(fintechId: number): Promise<BankAccount[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(bankAccounts).where(eq(bankAccounts.fintechId, fintechId));
}

export async function updateAccountBalance(accountId: number, newBalance: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(bankAccounts)
    .set({ balance: newBalance })
    .where(eq(bankAccounts.id, accountId));
}

// ============ TRANSACTION OPERATIONS ============

export async function createTransaction(transactionId: string, fintechId: number, fromAccountId: number, toAccountId: number | null, fromAccountNumber: string, toAccountNumber: string, toAccountName: string, toBankCode: string | null, toBankName: string | null, amount: string, transactionType: "INTRA_BANK" | "INTER_BANK", status: "PENDING" | "SUCCESS" | "FAILED" = "PENDING", description?: string): Promise<Transaction | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    await db.insert(transactions).values({
      transactionId,
      fintechId,
      fromAccountId,
      toAccountId,
      fromAccountNumber,
      toAccountNumber,
      toAccountName,
      toBankCode,
      toBankName,
      amount,
      transactionType,
      status,
      description,
    });

    const result = await db.select().from(transactions)
      .where(eq(transactions.transactionId, transactionId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Error creating transaction:", error);
    return null;
  }
}

export async function getTransactionById(transactionId: string): Promise<Transaction | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(transactions).where(eq(transactions.transactionId, transactionId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getTransactionsByAccount(accountId: number): Promise<Transaction[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(transactions).where(eq(transactions.fromAccountId, accountId));
}

export async function updateTransactionStatus(transactionId: string, status: "PENDING" | "SUCCESS" | "FAILED"): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(transactions)
    .set({ status })
    .where(eq(transactions.transactionId, transactionId));
}

// ============ TRANSACTION STATUS OPERATIONS ============

export async function createTransactionStatus(transactionId: string, nibssTransactionId?: string, status: "PENDING" | "SUCCESS" | "FAILED" = "PENDING"): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(transactionStatuses).values({
    transactionId,
    nibssTransactionId,
    status,
  });
}

export async function getTransactionStatus(transactionId: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(transactionStatuses).where(eq(transactionStatuses.transactionId, transactionId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateTransactionStatusRecord(transactionId: string, status: "PENDING" | "SUCCESS" | "FAILED", statusMessage?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(transactionStatuses)
    .set({ status, statusMessage, lastCheckedAt: new Date() })
    .where(eq(transactionStatuses.transactionId, transactionId));
}
