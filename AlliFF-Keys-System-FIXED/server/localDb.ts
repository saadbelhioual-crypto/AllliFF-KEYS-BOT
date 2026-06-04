/**
 * قاعدة بيانات PostgreSQL (Supabase) - تخزين دائم خارجي
 * تم استبدال SQLite بـ PostgreSQL لحل مشكلة فقدان البيانات في Hugging Face Spaces
 */

import { db } from './db';
import { 
  users, shortlinks, linkUsage, 
  keyPackages, notifications, gems,
  sessions, siteSettings
} from '../drizzle/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// واجهات البيانات (Interfaces)
export interface LocalUser {
  id: number;
  username: string;
  passwordHash: string;
  telegramId?: string;
  userId?: number;
  points: number;
  isAdmin: boolean;
  isBanned: boolean;
  deleteAttempts: number;
  welcomeSent: boolean;
  createdAt: string;
}

export interface RewardLink {
  id: number;
  linkId: string;
  pointsPerUse: number;
  maxUsers: number;
  usedCount: number;
  isActive: boolean;
  externalUrl?: string;
  expiresAt?: string;
  createdAt: string;
  isUsed?: boolean;
}

// دوال التحويل (Mappers)
function mapUser(row: any): LocalUser {
  const username = (row.name || row.email || `user_${row.id}`).toLowerCase();
  const isHardcodedAdmin = username === 'alliff112233';
  return {
    id: row.id,
    username: username,
    passwordHash: row.passwordhash || '',
    telegramId: row.telegramid || undefined,
    userId: row.userid || undefined,
    points: row.points || 0,
    isAdmin: isHardcodedAdmin || (row.role === 'admin'),
    isBanned: row.isbanned || false,
    deleteAttempts: row.deleteattempts || 3,
    welcomeSent: row.welcomesent || false,
    createdAt: row.createdat?.toISOString() || new Date().toISOString(),
  };
}

function mapLink(row: any): RewardLink {
  return {
    id: row.id,
    linkId: row.linkid,
    pointsPerUse: row.gemsperuse || 0,
    maxUsers: row.maxusers || 0,
    usedCount: row.usedcount || 0,
    isActive: row.isactive || false,
    externalUrl: undefined,
    expiresAt: undefined,
    createdAt: row.createdat?.toISOString() || new Date().toISOString(),
    isUsed: row.isUsed === true,
  };
}

// العمليات على المستخدمين
export async function createUser(username: string, passwordPlain: string, telegramId?: string): Promise<LocalUser | null> {
  const hash = bcrypt.hashSync(passwordPlain, 10);
  try {
    const [newUser] = await db.insert(users).values({
      name: username.toLowerCase(),
      email: `${username.toLowerCase()}@example.com`,
      role: 'user',
      passwordhash: hash,
      telegramid: telegramId || null,
      createdat: new Date(),
      updatedat: new Date(),
    } as any).returning();
    
    return mapUser(newUser);
  } catch (e) {
    console.error("Error creating user:", e);
    return null;
  }
}

export async function getUserById(id: number): Promise<LocalUser | null> {
  const [row] = await db.select().from(users).where(eq(users.id, id));
  return row ? mapUser(row) : null;
}

export async function getUserByUsername(username: string): Promise<LocalUser | null> {
  const [row] = await db.select().from(users).where(eq(users.name, username.toLowerCase()));
  return row ? mapUser(row) : null;
}

export async function getUserByTelegramId(telegramId: string): Promise<LocalUser | null> {
  const [row] = await db.select().from(users).where(eq(users.telegramid, telegramId));
  return row ? mapUser(row) : null;
}

export async function getUserByCustomUserId(uid: number): Promise<LocalUser | null> {
  const [row] = await db.select().from(users).where(eq(users.userid, uid));
  return row ? mapUser(row) : null;
}

export async function verifyPassword(username: string, passwordPlain: string): Promise<LocalUser | null> {
  const user = await getUserByUsername(username);
  if (!user || !user.passwordHash) return null;
  if (bcrypt.compareSync(passwordPlain, user.passwordHash)) return user;
  return null;
}

export async function assignUserIdToUser(id: number): Promise<number> {
  const customId = 10000000 + id;
  await db.update(users).set({ userid: customId }).where(eq(users.id, id));
  return customId;
}

// الجلسات
export async function createSession(userId: number, token: string, expiresAt: Date) {
  await db.insert(sessions).values({
    userId,
    sessionToken: token,
    expiresAt,
  });
}

export async function getSessionUser(token: string): Promise<LocalUser | null> {
  const rows = await db.select({
    user: users
  })
  .from(sessions)
  .innerJoin(users, eq(sessions.userId, users.id))
  .where(and(
    eq(sessions.sessionToken, token),
    sql`${sessions.expiresAt} > now()`
  ));
  
  return rows.length > 0 ? mapUser(rows[0].user) : null;
}

export async function deleteSession(token: string) {
  await db.delete(sessions).where(eq(sessions.sessionToken, token));
}

// روابط المكافآت
export async function createRewardLink(linkId: string, points: number, maxUsers: number): Promise<RewardLink | null> {
  try {
    const [newLink] = await db.insert(shortlinks).values({
      linkid: linkId,
      gemsperuse: points,
      maxusers: maxUsers,
      isactive: true,
      usedcount: 0,
      createdat: new Date(),
    } as any).returning();
    return mapLink(newLink);
  } catch (e) {
    console.error("Error creating reward link:", e);
    return null;
  }
}

export async function getAllRewardLinks(userId?: number): Promise<RewardLink[]> {
  if (userId) {
    const rows = await db.select({
      link: shortlinks,
      isUsed: sql<boolean>`EXISTS(SELECT 1 FROM ${linkUsage} WHERE ${linkUsage.userid} = ${userId} AND ${linkUsage.linkid} = ${shortlinks.id})`
    })
    .from(shortlinks)
    .orderBy(desc(shortlinks.createdat));
    
    return rows.map(r => ({ ...mapLink(r.link), isUsed: r.isUsed }));
  } else {
    const rows = await db.select().from(shortlinks).orderBy(desc(shortlinks.createdat));
    return rows.map(mapLink);
  }
}

export async function deactivateRewardLink(linkId: string): Promise<boolean> {
  try {
    await db.update(shortlinks).set({ isactive: false }).where(eq(shortlinks.linkid, linkId));
    return true;
  } catch (e) {
    return false;
  }
}

export async function claimRewardLink(userId: number, linkId: string): Promise<{ success: boolean; error?: string; pointsAdded?: number }> {
  try {
    const [link] = await db.select().from(shortlinks).where(eq(shortlinks.linkid, linkId));
    if (!link || !link.isactive) return { success: false, error: "الرابط غير متاح" };
    
    await db.insert(linkUsage).values({ userid: userId, linkid: link.id });
    await db.update(shortlinks).set({ usedcount: (link.usedcount || 0) + 1 }).where(eq(shortlinks.id, link.id));
    await addPointsToUser(userId, link.gemsperuse);

    return { success: true, pointsAdded: link.gemsperuse };
  } catch (e) {
    return { success: false, error: "حدث خطأ أثناء معالجة الطلب" };
  }
}

// باقات المفاتيح
export async function createKeyPackage(data: any): Promise<any> {
  const [pkg] = await db.insert(keyPackages).values({
    name: data.name,
    durationdays: data.durationDays,
    botcount: data.botCount,
    gemsprice: data.pointsPrice,
    isactive: true,
    createdat: new Date(),
  } as any).returning();
  return pkg;
}

export async function getAllKeyPackages(): Promise<any[]> {
  return await db.select().from(keyPackages).where(eq(keyPackages.isactive, true));
}

export async function getKeyPackageById(id: number): Promise<any> {
  const [pkg] = await db.select().from(keyPackages).where(eq(keyPackages.id, id));
  return pkg;
}

export async function deactivateKeyPackage(id: number): Promise<boolean> {
  await db.update(keyPackages).set({ isactive: false }).where(eq(keyPackages.id, id));
  return true;
}

export async function incrementKeyPackageUsage(id: number) {
  await db.update(keyPackages).set({ usedcount: sql`${keyPackages.usedcount} + 1` }).where(eq(keyPackages.id, id));
}

// إدارة النقاط والمستخدمين
export async function addPointsToUser(userId: number, points: number) {
  const [existing] = await db.select().from(gems).where(eq(gems.userid, userId));
  if (existing) {
    await db.update(gems).set({ amount: sql`${gems.amount} + ${points}`, updatedat: new Date() }).where(eq(gems.userid, userId));
  } else {
    await db.insert(gems).values({ userid: userId, amount: points, createdat: new Date(), updatedat: new Date() });
  }
}

export async function setUserPoints(userId: number, points: number): Promise<boolean> {
  const [existing] = await db.select().from(gems).where(eq(gems.userid, userId));
  if (existing) {
    await db.update(gems).set({ amount: points, updatedat: new Date() }).where(eq(gems.userid, userId));
  } else {
    await db.insert(gems).values({ userid: userId, amount: points, createdat: new Date(), updatedat: new Date() });
  }
  return true;
}

export async function getAllUsers(): Promise<LocalUser[]> {
  const rows = await db.select().from(users).orderBy(desc(users.createdat));
  return rows.map(mapUser);
}

// الإشعارات
export async function createNotification(userId: number, title: string, message: string) {
  await db.insert(notifications).values({ userid: userId, title, content: message, isread: false, createdat: new Date() } as any);
}

export async function getUserNotifications(userId: number) {
  return await db.select().from(notifications).where(eq(notifications.userid, userId)).orderBy(desc(notifications.createdat));
}

export async function markNotificationAsRead(id: number) {
  await db.update(notifications).set({ isread: true }).where(eq(notifications.id, id));
}

export async function deleteNotification(id: number) {
  await db.delete(notifications).where(eq(notifications.id, id));
}

// إعدادات الموقع
export async function getSetting(key: string): Promise<string | null> {
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, key));
  return row ? row.settingValue : null;
}

export async function setSetting(key: string, value: string) {
  const [existing] = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, key));
  if (existing) {
    await db.update(siteSettings).set({ settingValue: value }).where(eq(siteSettings.settingKey, key));
  } else {
    await db.insert(siteSettings).values({ settingKey: key, settingValue: value });
  }
}

// وظائف إضافية للتوافق مع SDK
export async function getUserByOpenId(openid: string): Promise<LocalUser | null> {
  const [row] = await db.select().from(users).where(eq(users.openid, openid));
  return row ? mapUser(row) : null;
}

export async function upsertUser(data: any): Promise<LocalUser | null> {
  try {
    const [existing] = await db.select().from(users).where(eq(users.openid, data.openid));
    if (existing) {
      const [updated] = await db.update(users).set({
        name: data.name,
        email: data.email,
        updatedat: new Date(),
      } as any).where(eq(users.openid, data.openid)).returning();
      return mapUser(updated);
    } else {
      const [inserted] = await db.insert(users).values({
        openid: data.openid,
        name: data.name,
        email: data.email,
        role: 'user',
        createdat: new Date(),
        updatedat: new Date(),
      } as any).returning();
      return mapUser(inserted);
    }
  } catch (e) {
    return null;
  }
}
