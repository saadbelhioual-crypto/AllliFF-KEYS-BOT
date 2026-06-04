import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import {
  verifyPassword,
  createSession,
  getSessionUser,
  deleteSession,
  getAllRewardLinks,
  claimRewardLink,
  getUserById,
  createRewardLink,
  deactivateRewardLink,
  deactivateKeyPackage,
  getUserNotifications,
  markNotificationAsRead,
  deleteNotification,
  getAllKeyPackages,
  getKeyPackageById,
  addPointsToUser,
  incrementKeyPackageUsage,
  assignUserIdToUser,
  createNotification,
  getAllUsers,
  createUser, // تأكد من استيرادها
} from "./localDb";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

const BOT_MANAGER_URL = "https://alliff-alliff-bot-manager.hf.space";
const BOT_MANAGER_SECRET = "alliff_bot_api_secret_2026";

function generateRandom6(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function createBotManagerAccount(username: string, password: string, durationDays: number, botCount: number): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${BOT_MANAGER_URL}/api/admin/users/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bot-secret': BOT_MANAGER_SECRET,
      },
      body: JSON.stringify({
        username,
        password,
        max_bots: botCount,
        days: durationDays,
      }),
      signal: AbortSignal.timeout(30000),
    });

    const data = await response.json() as any;
    if (data.success || data.error === "المستخدم موجود بالفعل") {
      return { success: true };
    }
    return { success: false, error: data.error || data.message || `HTTP ${response.status}` };
  } catch (err: any) {
    return { success: false, error: err.message || 'فشل الاتصال بالسيرفر' };
  }
}

async function getSessionFromCtx(ctx: any) {
  const cookieHeader = ctx.req.headers.cookie || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c: string) => {
      const [k, ...v] = c.trim().split('=');
      return [k?.trim(), v.join('=')];
    }).filter(([k]: [string]) => k)
  );
  const token = cookies['alliff_session'] || cookies[COOKIE_NAME];
  if (!token) return null;
  return await getSessionUser(token);
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(async (opts) => {
      const user = await getSessionFromCtx(opts.ctx);
      if (!user) return null;
      let customUserId = user.userId;
      if (!customUserId) {
        customUserId = await assignUserIdToUser(user.id);
      }
      return {
        id: customUserId || user.id,
        internalId: user.id,
        name: user.username,
        openId: `local_${user.id}`,
        role: user.isAdmin ? 'admin' : 'user',
        isAdmin: user.isAdmin,
        points: user.points,
        telegramId: user.telegramId,
      };
    }),

    logout: publicProcedure.mutation(async ({ ctx }) => {
      const cookieHeader = ctx.req.headers.cookie || '';
      const cookies = Object.fromEntries(
        cookieHeader.split(';').map((c: string) => {
          const [k, ...v] = c.trim().split('=');
          return [k?.trim(), v.join('=')];
        }).filter(([k]: [string]) => k)
      );
      const token = cookies['alliff_session'] || cookies[COOKIE_NAME];
      if (token) await deleteSession(token);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie('alliff_session', { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    loginWithCredentials: publicProcedure
      .input((val: any) => ({
        username: val.username as string,
        password: val.password as string,
      }))
      .mutation(async ({ ctx, input }) => {
        const username = input.username.trim().toLowerCase();
        const password = input.password.trim();
        
        let user = await verifyPassword(username, password);
        
        // تسجيل دخول افتراضي للأدمن لأول مرة
        if (!user && username === 'alliff112233' && password === '123123123') {
          user = await createUser(username, password);
        }

        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "اسم المستخدم أو كلمة المرور غير صحيحة",
          });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + ONE_YEAR_MS);
        await createSession(user.id, token, expiresAt);

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie('alliff_session', token, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
          httpOnly: true,
        });

        return {
          success: true,
          message: "تم تسجيل الدخول بنجاح",
          user: {
            id: user.id,
            username: user.username,
            points: user.points,
            isAdmin: user.isAdmin,
          },
        };
      }),
  }),

  gems: router({
    getBalance: publicProcedure.query(async ({ ctx }) => {
      const user = await getSessionFromCtx(ctx);
      if (!user) return 0;
      return user.points;
    }),

    addGemsFromLink: publicProcedure
      .input((val: any) => ({
        linkId: val.linkId as string,
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await getSessionFromCtx(ctx);
        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "يجب تسجيل الدخول أولاً" });
        }

        const result = await claimRewardLink(user.id, input.linkId);
        if (!result.success) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: result.error || "فشل استخدام الرابط",
          });
        }

        const updatedUser = await getUserById(user.id);
        return {
          success: true,
          gemsAdded: result.pointsAdded,
          newBalance: updatedUser?.points || 0,
        };
      }),
  }),

  shortLinks: router({
    getAll: publicProcedure.query(async ({ ctx }) => {
      const user = await getSessionFromCtx(ctx);
      const links = await getAllRewardLinks(user?.id);
      return links.map(l => ({
        id: l.id,
        linkId: l.linkId,
        gemsPerUse: l.pointsPerUse,
        maxUsers: l.maxUsers,
        usedCount: l.usedCount,
        isActive: l.isActive,
        createdAt: l.createdAt,
        externalUrl: l.externalUrl,
        expiresAt: l.expiresAt,
        remaining: l.maxUsers === -1 ? -1 : l.maxUsers - l.usedCount,
        isUsed: l.isUsed,
      }));
    }),
    deleteLink: publicProcedure
      .input((val: any) => ({
        linkId: val.linkId as string,
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await getSessionFromCtx(ctx);
        if (!user || !user.isAdmin) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "ليس لديك صلاحيات كافية" });
        }
        const success = await deactivateRewardLink(input.linkId);
        if (!success) {
          throw new TRPCError({ code: "NOT_FOUND", message: "الرابط غير موجود" });
        }
        return { success: true };
      }),
  }),

  keyPackages: router({
    getAll: publicProcedure.query(async () => {
      const packages = await getAllKeyPackages();
      return packages.map((pkg: any) => ({
        id: pkg.id,
        name: pkg.name,
        durationDays: pkg.durationDays,
        botCount: pkg.botCount,
        gemsPrice: pkg.pointsPrice,
        maxUsers: pkg.maxUsers,
        usedCount: pkg.usedCount,
        isActive: pkg.isActive,
        isSpecial: pkg.isSpecial,
        expiresAt: pkg.expiresAt,
        remaining: pkg.maxUsers === -1 ? -1 : pkg.maxUsers - pkg.usedCount,
      }));
    }),
    deletePackage: publicProcedure
      .input((val: any) => ({
        packageId: val.packageId as number,
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await getSessionFromCtx(ctx);
        if (!user || !user.isAdmin) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "ليس لديك صلاحيات كافية" });
        }
        const success = await deactivateKeyPackage(input.packageId);
        if (!success) {
          throw new TRPCError({ code: "NOT_FOUND", message: "العرض غير موجود" });
        }
        return { success: true };
      }),
  }),

  purchases: router({
    purchaseWithGems: publicProcedure
      .input((val: any) => ({
        packageId: val.packageId as number,
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await getSessionFromCtx(ctx);
        if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
        
        const pkg = await getKeyPackageById(input.packageId);
        
        if (!pkg || !pkg.isActive) {
          throw new TRPCError({ code: "NOT_FOUND", message: "العرض غير متاح حالياً" });
        }
        
        if (pkg.maxUsers !== -1 && pkg.usedCount >= pkg.maxUsers) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "وصل هذا العرض للحد الأقصى من المستخدمين" });
        }
        
        if (user.points < pkg.pointsPrice) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "رصيدك غير كافٍ" });
        }
        
        await addPointsToUser(user.id, -pkg.pointsPrice);
        await incrementKeyPackageUsage(pkg.id);
        
        const randomUsername = generateRandom6();
        const newPassword = generateRandom6();
        
        setImmediate(async () => {
          const result = await createBotManagerAccount(randomUsername, newPassword, pkg.durationDays, pkg.botCount);
          if (result.success) {
            await createNotification(user.id, "🎉 تم شراء مفتاح بنجاح", `بيانات حسابك في AlliFF Bot Manager:\nاسم المستخدم: ${randomUsername}\nكلمة المرور: ${newPassword}\nالمدة: ${pkg.durationDays} يوم\nعدد البوتات: ${pkg.botCount}`);
          } else {
            await addPointsToUser(user.id, pkg.pointsPrice);
            await createNotification(user.id, "❌ فشل شراء المفتاح", `نعتذر، حدث خطأ أثناء إنشاء الحساب: ${result.error}. تم استرداد نقاطك.`);
          }
        });
        
        return { success: true, message: "جاري معالجة طلبك، ستصلك رسالة في قسم الإشعارات قريباً" };
      }),
  }),

  notifications: router({
    getAll: publicProcedure.query(async ({ ctx }) => {
      const user = await getSessionFromCtx(ctx);
      if (!user) return [];
      return await getUserNotifications(user.id);
    }),
    markAsRead: publicProcedure
      .input((val: any) => ({ id: val.id as number }))
      .mutation(async ({ ctx, input }) => {
        const user = await getSessionFromCtx(ctx);
        if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
        await markNotificationAsRead(input.id);
        return { success: true };
      }),
    delete: publicProcedure
      .input((val: any) => ({ id: val.id as number }))
      .mutation(async ({ ctx, input }) => {
        const user = await getSessionFromCtx(ctx);
        if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
        await deleteNotification(input.id);
        return { success: true };
      }),
  }),

  admin: router({
    getStats: publicProcedure.query(async ({ ctx }) => {
      const user = await getSessionFromCtx(ctx);
      if (!user || !user.isAdmin) throw new TRPCError({ code: "UNAUTHORIZED" });
      
      const users = await getAllUsers();
      const links = await getAllRewardLinks();
      const packages = await getAllKeyPackages();
      
      return {
        totalUsers: users.length,
        totalLinks: links.length,
        activeLinks: links.filter(l => l.isActive).length,
        totalPackages: packages.length,
      };
    }),
    getAllUsers: publicProcedure.query(async ({ ctx }) => {
      const user = await getSessionFromCtx(ctx);
      if (!user || !user.isAdmin) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await getAllUsers();
    }),
    addRewardLink: publicProcedure
      .input((val: any) => ({
        points: val.points as number,
        maxUsers: val.maxUsers as number,
        externalUrl: val.externalUrl as string,
        expiresHours: val.expiresHours as number,
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await getSessionFromCtx(ctx);
        if (!user || !user.isAdmin) throw new TRPCError({ code: "UNAUTHORIZED" });
        const linkId = crypto.randomBytes(16).toString('hex');
        const link = await createRewardLink(linkId, input.points, input.maxUsers, input.externalUrl, input.expiresHours);
        return { success: !!link, link };
      }),
  }),
});
