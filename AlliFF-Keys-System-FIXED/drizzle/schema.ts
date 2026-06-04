import { pgTable, serial, text, varchar, timestamp, integer, boolean, numeric, jsonb } from "drizzle-orm/pg-core";

/**
 * Users Table
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openid: varchar("openid", { length: 255 }),
  name: text("name"),
  email: varchar("email", { length: 255 }),
  loginmethod: varchar("loginmethod", { length: 50 }),
  role: varchar("role", { length: 50 }),
  passwordhash: text("passwordhash"),
  telegramid: varchar("telegramid", { length: 255 }),
  userid: integer("userid"),
  welcomesent: boolean("welcomesent").default(false),
  isbanned: boolean("isbanned").default(false),
  deleteattempts: integer("deleteattempts").default(3),
  createdat: timestamp("createdat").defaultNow(),
  updatedat: timestamp("updatedat").defaultNow(),
  lastsignedin: timestamp("lastsignedin"),
});

/**
 * Sessions Table
 */
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionToken: text("sessiontoken").notNull(),
  userId: integer("userid").notNull(),
  expiresAt: timestamp("expiresat").notNull(),
});

/**
 * Site Settings Table
 */
export const siteSettings = pgTable("sitesettings", {
  id: serial("id").primaryKey(),
  settingKey: text("settingkey").notNull().unique(),
  settingValue: text("settingvalue").notNull(),
});

/**
 * Gems Table (conceptual mapping or actual table)
 */
export const gems = pgTable("gems", {
  id: serial("id").primaryKey(),
  userid: integer("userid").notNull(),
  amount: integer("amount").default(0).notNull(),
  createdat: timestamp("createdat").defaultNow(),
  updatedat: timestamp("updatedat").defaultNow(),
});

/**
 * Key Packages Table
 */
export const keyPackages = pgTable("keypackages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  durationdays: integer("durationdays").notNull(),
  botcount: integer("botcount").notNull(),
  gemsprice: integer("gemsprice").notNull(),
  cashprice: numeric("cashprice"),
  description: text("description"),
  isactive: boolean("isactive").default(true),
  usedcount: integer("usedcount").default(0),
  createdat: timestamp("createdat").defaultNow(),
});

/**
 * Link Usage Table
 */
export const linkUsage = pgTable("linkusage", {
  id: serial("id").primaryKey(),
  userid: integer("userid").notNull(),
  linkid: integer("linkid").notNull(),
  usedat: timestamp("usedat").defaultNow(),
});

/**
 * Notifications Table
 */
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userid: integer("userid").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  type: varchar("type", { length: 50 }),
  relateddata: jsonb("relateddata"),
  isread: boolean("isread").default(false),
  createdat: timestamp("createdat").defaultNow(),
});

/**
 * Payment Requests Table
 */
export const paymentRequests = pgTable("paymentrequests", {
  id: serial("id").primaryKey(),
  userid: integer("userid").notNull(),
  purchaseid: integer("purchaseid"),
  proofimageurl: text("proofimageurl"),
  status: varchar("status", { length: 50 }),
  rejectionreason: text("rejectionreason"),
  rejectioncount: integer("rejectioncount").default(0),
  createdat: timestamp("createdat").defaultNow(),
  updatedat: timestamp("updatedat").defaultNow(),
});

/**
 * Purchases Table
 */
export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  userid: integer("userid").notNull(),
  packageid: integer("packageid").notNull(),
  paymentmethod: varchar("paymentmethod", { length: 50 }),
  status: varchar("status", { length: 50 }),
  generatedkey: varchar("generatedkey", { length: 255 }),
  generatedusername: varchar("generatedusername", { length: 255 }),
  generatedpassword: varchar("generatedpassword", { length: 255 }),
  createdat: timestamp("createdat").defaultNow(),
  updatedat: timestamp("updatedat").defaultNow(),
});

/**
 * Short Links Table
 */
export const shortlinks = pgTable("shortlinks", {
  id: serial("id").primaryKey(),
  linkid: varchar("linkid", { length: 255 }).notNull(),
  gemsperuse: integer("gemsperuse").notNull(),
  maxusers: integer("maxusers").notNull(),
  usedcount: integer("usedcount").default(0),
  isactive: boolean("isactive").default(true),
  createdby: integer("createdby"),
  createdat: timestamp("createdat").defaultNow(),
  updatedat: timestamp("updatedat").defaultNow(),
});

/**
 * Telegram Users Table
 */
export const telegramUsers = pgTable("telegramusers", {
  id: serial("id").primaryKey(),
  userid: integer("userid").notNull(),
  telegramid: varchar("telegramid", { length: 255 }),
  telegramusername: varchar("telegramusername", { length: 255 }),
  createdat: timestamp("createdat").defaultNow(),
});

/**
 * User Bans Table
 */
export const userBans = pgTable("userbans", {
  id: serial("id").primaryKey(),
  userid: integer("userid").notNull(),
  reason: text("reason"),
  bannedat: timestamp("bannedat").defaultNow(),
});
