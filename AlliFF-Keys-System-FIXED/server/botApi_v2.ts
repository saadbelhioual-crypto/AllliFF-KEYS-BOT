/**
 * Bot API - نقاط النهاية الخاصة ببوت التلجرام (الإصدار المحدث)
 */
import type { Express, Request, Response } from 'express';
import * as crypto from 'crypto';
import {
  createUser,
  getUserByTelegramId,
  getUserByUsername,
  createRewardLink,
  getRewardLink,
  getAllRewardLinks,
  deactivateRewardLink,
  claimRewardLink,
  getUserById,
  createKeyPackage,
  getAllKeyPackages,
  deactivateKeyPackage,
  getAllUsers,
  banUser,
  unbanUser,
  deleteUser,
  setUserPoints,
  createNotification,
  assignUserIdToUser,
  getUserByCustomUserId,
  getUserNotifications,
} from './localDb';

const BOT_API_SECRET = process.env.BOT_API_SECRET || 'alliff_bot_api_secret_2026';

function verifyBotSecret(req: Request, res: Response): boolean {
  const secret = req.headers['x-bot-secret'] || req.body?.bot_secret || req.query?.bot_secret;
  if (!secret || secret !== BOT_API_SECRET) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return false;
  }
  return true;
}

export function registerBotApiRoutes(app: Express) {
  
  // إنشاء مستخدم جديد
  app.post('/api/bot/register', (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    const { username, password, telegram_id } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, error: 'Missing data' });
    
    const user = createUser(username, password, telegram_id ? String(telegram_id) : undefined);
    if (!user) return res.status(500).json({ success: false, error: 'Failed to create user' });
    
    res.json({ success: true, user: getUserById(user.id) });
  });

  // التحقق من مستخدم تيليجرام
  app.get('/api/bot/user/:telegram_id', (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    const user = getUserByTelegramId(req.params.telegram_id);
    if (!user) return res.status(404).json({ success: false, error: 'not_found' });
    res.json({ success: true, user });
  });

  // إنشاء رابط مكافأة (منع التكرار)
  app.post('/api/bot/links', (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    const { points_per_use, max_users, external_url } = req.body;
    
    // منع التكرار: إذا كان الرابط الخارجي موجوداً بالفعل، نرجعه بدلاً من إنشاء واحد جديد
    if (external_url) {
      const existing = getAllRewardLinks().find(l => l.externalUrl === external_url && l.isActive);
      if (existing) return res.json({ success: true, link: existing, link_id: existing.linkId });
    }

    const linkId = crypto.randomBytes(16).toString('hex');
    const link = createRewardLink(linkId, Number(points_per_use), Number(max_users), external_url);
    
    if (!link) return res.status(500).json({ success: false, error: 'Failed to create link' });
    res.json({ success: true, link, link_id: link.linkId });
  });

  // الحصول على جميع الروابط
  app.get('/api/bot/links', (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    res.json({ success: true, links: getAllRewardLinks() });
  });

  // حذف رابط
  app.delete('/api/bot/links/:link_id', (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    res.json({ success: deactivateRewardLink(req.params.link_id) });
  });

  // استخدام رابط
  app.post('/api/bot/links/:link_id/claim', (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    const { telegram_id } = req.body;
    const user = getUserByTelegramId(String(telegram_id));
    if (!user) return res.status(404).json({ success: false, error: 'user_not_found' });
    
    const result = claimRewardLink(user.id, req.params.link_id);
    if (!result.success) return res.status(400).json({ success: false, error: result.error });
    
    res.json({ success: true, points_added: result.pointsAdded, new_balance: getUserById(user.id)?.points });
  });

  // إدارة العروض
  app.post('/api/bot/packages', (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    const { name, duration_days, bot_count, points_price, max_users } = req.body;
    const pkg = createKeyPackage(name, Number(duration_days), Number(bot_count), Number(points_price), Number(max_users || -1));
    res.json({ success: !!pkg, package: pkg });
  });

  app.get('/api/bot/packages', (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    res.json({ success: true, packages: getAllKeyPackages() });
  });

  app.delete('/api/bot/packages/:id', (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    res.json({ success: deactivateKeyPackage(Number(req.params.id)) });
  });

  // الحصول على جميع المستخدمين
  app.get('/api/bot/users', (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    res.json({ success: true, users: getAllUsers() });
  });

  // البحث عن مستخدم بالاسم
  app.get('/api/bot/users/search/:username', (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    const user = getUserByUsername(req.params.username);
    if (!user) return res.status(404).json({ success: false, error: 'not_found' });
    res.json({ success: true, user });
  });

  // تعديل نقاط مستخدم
  app.post('/api/bot/users/:id/points', (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    const { points } = req.body;
    const success = setUserPoints(Number(req.params.id), Number(points));
    res.json({ success });
  });

  // حظر مستخدم
  app.post('/api/bot/users/:id/ban', (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    const success = banUser(Number(req.params.id));
    res.json({ success });
  });

  // إلغاء حظر مستخدم
  app.post('/api/bot/users/:id/unban', (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    const success = unbanUser(Number(req.params.id));
    res.json({ success });
  });

  // حذف مستخدم
  app.delete('/api/bot/users/:id', (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    const success = deleteUser(Number(req.params.id));
    res.json({ success });
  });

  // بحث عن مستخدم بالاسم
  app.get('/api/bot/users/search/:username', (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    const user = getUserByUsername(req.params.username);
    if (user) {
      res.json({ success: true, user });
    } else {
      res.json({ success: false, error: 'user_not_found' });
    }
  });

  // إحصائيات عامة
  app.get('/api/bot/stats', (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    const users = getAllUsers();
    const links = getAllRewardLinks();
    const pkgs = getAllKeyPackages();
    res.json({
      success: true,
      stats: {
        total_users: users.length,
        total_links: links.length,
        total_packages: pkgs.length,
        active_links: links.filter(l => l.isActive).length
      }
    });
  });

  // إرسال رسالة لمستخدم معين (بالـ userId المخصص للموقع)
  app.post('/api/bot/users/custom/:custom_id/send-message', (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    const { title, message } = req.body;
    const customId = Number(req.params.custom_id);
    
    if (!title || !message) return res.status(400).json({ success: false, error: 'title and message required' });
    
    const user = getUserByCustomUserId(customId);
    if (!user) return res.status(404).json({ success: false, error: 'user_not_found' });
    
    const notifId = createNotification(user.id, title, message);
    console.log(`[BotAPI] Notification created for user ${user.id}: ${notifId}`);
    res.json({ success: true, message: 'تم إرسال الرسالة بنجاح', notificationId: notifId });
  });

  // إذاعة رسالة لجميع المستخدمين
  app.post('/api/bot/broadcast', (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    const { title, message } = req.body;
    if (!title || !message) return res.status(400).json({ success: false, error: 'title and message required' });
    
    const users = getAllUsers();
    let count = 0;
    users.forEach(u => {
      const notifId = createNotification(u.id, title, message);
      console.log(`[BotAPI] Broadcast notification created for user ${u.id}: ${notifId}`);
      count++;
    });
    console.log(`[BotAPI] Broadcast completed: ${count} notifications created`);
    res.json({ success: true, message: `تم إرسال الرسالة لـ ${count} مستخدم بنجاح` });
  });

  // نقطة نهاية للتحقق من الإشعارات (للاختبار)
  app.get('/api/bot/notifications/:user_id', (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    const userId = Number(req.params.user_id);
    const user = getUserById(userId);
    if (!user) return res.status(404).json({ success: false, error: 'user_not_found' });
    
    const notifications = getUserNotifications(userId);
    res.json({ success: true, notifications, count: notifications.length });
  });
}
