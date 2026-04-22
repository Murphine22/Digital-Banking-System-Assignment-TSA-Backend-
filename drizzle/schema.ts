import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Fintech Institution Table - Stores registered fintech/bank details
 */
export const fintechs = mysqlTable("fintechs", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  apiKey: varchar("apiKey", { length: 255 }).notNull(),
  apiSecret: varchar("apiSecret", { length: 255 }).notNull(),
  bankCode: varchar("bankCode", { length: 10 }),
  bankName: varchar("bankName", { length: 255 }),
  jwtToken: text("jwtToken"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Fintech = typeof fintechs.$inferSelect;
export type InsertFintech = typeof fintechs.$inferInsert;

/**
 * BVN/NIN Identity Records Table - Stores identity verification data
 */
export const identityRecords = mysqlTable("identityRecords", {
  id: int("id").autoincrement().primaryKey(),
  identityType: mysqlEnum("identityType", ["BVN", "NIN"]).notNull(),
  identityNumber: varchar("identityNumber", { length: 20 }).notNull().unique(),
  firstName: varchar("firstName", { length: 255 }).notNull(),
  lastName: varchar("lastName", { length: 255 }).notNull(),
  dateOfBirth: varchar("dateOfBirth", { length: 10 }).notNull(), // YYYY-MM-DD format
  phone: varchar("phone", { length: 20 }),
  isVerified: boolean("isVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IdentityRecord = typeof identityRecords.$inferSelect;
export type InsertIdentityRecord = typeof identityRecords.$inferInsert;

/**
 * Customer KYC Table - Stores customer onboarding data
 */
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  fintechId: int("fintechId").notNull(),
  kycType: mysqlEnum("kycType", ["BVN", "NIN"]).notNull(),
  kycId: varchar("kycId", { length: 20 }).notNull(),
  firstName: varchar("firstName", { length: 255 }).notNull(),
  lastName: varchar("lastName", { length: 255 }).notNull(),
  dateOfBirth: varchar("dateOfBirth", { length: 10 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  isVerified: boolean("isVerified").default(false).notNull(),
  verificationStatus: mysqlEnum("verificationStatus", ["PENDING", "VERIFIED", "FAILED"]).default("PENDING").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

/**
 * Bank Accounts Table - Stores customer bank accounts
 */
export const bankAccounts = mysqlTable("bankAccounts", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  fintechId: int("fintechId").notNull(),
  accountNumber: varchar("accountNumber", { length: 20 }).notNull().unique(),
  accountName: varchar("accountName", { length: 255 }).notNull(),
  bankCode: varchar("bankCode", { length: 10 }).notNull(),
  bankName: varchar("bankName", { length: 255 }).notNull(),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("15000").notNull(),
  kycType: mysqlEnum("kycType", ["BVN", "NIN"]).notNull(),
  kycId: varchar("kycId", { length: 20 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = typeof bankAccounts.$inferInsert;

/**
 * Transactions Table - Stores all fund transfer transactions
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  transactionId: varchar("transactionId", { length: 50 }).notNull().unique(),
  fintechId: int("fintechId").notNull(),
  fromAccountId: int("fromAccountId").notNull(),
  toAccountId: int("toAccountId"),
  fromAccountNumber: varchar("fromAccountNumber", { length: 20 }).notNull(),
  toAccountNumber: varchar("toAccountNumber", { length: 20 }).notNull(),
  toAccountName: varchar("toAccountName", { length: 255 }),
  toBankCode: varchar("toBankCode", { length: 10 }),
  toBankName: varchar("toBankName", { length: 255 }),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  transactionType: mysqlEnum("transactionType", ["INTRA_BANK", "INTER_BANK"]).notNull(),
  status: mysqlEnum("status", ["PENDING", "SUCCESS", "FAILED"]).default("PENDING").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Transaction Status Query (TSQ) Tracking Table
 */
export const transactionStatuses = mysqlTable("transactionStatuses", {
  id: int("id").autoincrement().primaryKey(),
  transactionId: varchar("transactionId", { length: 50 }).notNull().unique(),
  nibssTransactionId: varchar("nibssTransactionId", { length: 50 }),
  status: mysqlEnum("status", ["PENDING", "SUCCESS", "FAILED"]).default("PENDING").notNull(),
  statusMessage: text("statusMessage"),
  lastCheckedAt: timestamp("lastCheckedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TransactionStatus = typeof transactionStatuses.$inferSelect;
export type InsertTransactionStatus = typeof transactionStatuses.$inferInsert;
