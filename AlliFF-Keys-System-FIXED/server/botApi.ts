/**
 * Bot API - نقاط النهاية الخاصة ببوت التلجرام
 * تم تحديثه ليدعم العمليات غير المتزامنة (Async) لـ PostgreSQL (Supabase)
 */
import type { Express, Request, Response } from 'express';
import crypto from 'crypto';
import {
  createUser,
  getUserByTelegramId,
  getUserByUsername,
  createRewardLink,
  getAllRewardLinks,
  deactivateRewardLink,
  claimRewardLink,
  getUserById,
  createKeyPackage,
  getAllKeyPackages,
  deactivateKeyPackage,
  getAllUsers,
  setUserPoints,
  createNotification,
  getUserByCustomUserId,
} from './localDb';

const BOT_API_SECRET = process.env.BOT_API_SECRET || 'alliff_bot_api_secret_2026';

function verifyBotSecret(req: Request, res: Response): boolean {
  const secret = req.headers['x-bot-secret'] || req.body?.bot_secret || req.query?.bot_secret;
  
  if (!secret || secret !== BOT_API_SECRET) {
    // السماح إذا لم يكن هناك سر في البيئة (للتطوير)
    if (!process.env.BOT_API_SECRET) {
       return true;
    }
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return false;
  }
  return true;
}

export function registerBotApiRoutes(app: Express) {
  // ===== إنشاء مستخدم جديد =====
  app.post('/api/bot/register', async (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    
    const { username, password, telegram_id } = req.body;
    
    if (!username || !password) {
      res.status(400).json({ success: false, error: 'username and password required' });
      return;
    }
    
    try {
      const existing = await getUserByUsername(username);
      if (existing) {
        res.status(409).json({ success: false, error: 'username_taken' });
        return;
      }
      
      if (telegram_id) {
        const existingTg = await getUserByTelegramId(String(telegram_id));
        if (existingTg) {
          res.status(409).json({ success: false, error: 'telegram_already_registered', user: existingTg });
          return;
        }
      }
      
      const user = await createUser(username, password, telegram_id ? String(telegram_id) : undefined);
      if (!user) {
        res.status(500).json({ success: false, error: 'Failed to create user' });
        return;
      }
      
      res.json({ success: true, user });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ===== التحقق من مستخدم تيليجرام =====
  app.get('/api/bot/user/:telegram_id', async (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    
    try {
      const user = await getUserByTelegramId(req.params.telegram_id);
      if (!user) {
        res.status(404).json({ success: false, error: 'not_found' });
        return;
      }
      res.json({ success: true, user });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ===== إنشاء رابط مكافأة =====
  app.post('/api/bot/links', async (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    
    const points_per_use = Number(req.body.points_per_use);
    const max_users = Number(req.body.max_users);
    const external_url = req.body.external_url;
    const expires_hours = req.body.expires_hours ? Number(req.body.expires_hours) : undefined;
    
    if (isNaN(points_per_use) || isNaN(max_users)) {
      res.status(400).json({ success: false, error: 'points_per_use and max_users must be numbers' });
      return;
    }
    
    try {
      const linkId = crypto.randomBytes(16).toString('hex');
      const link = await createRewardLink(linkId, points_per_use, max_users, external_url, expires_hours);
      
      if (!link) {
        res.status(500).json({ success: false, error: 'Failed to create link in database' });
        return;
      }
      
      res.json({ success: true, link, link_id: linkId });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ===== الحصول على جميع الروابط =====
  app.get('/api/bot/links', async (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    
    try {
      const links = await getAllRewardLinks();
      res.json({ success: true, links });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ===== حذف/تعطيل رابط =====
  app.delete('/api/bot/links/:link_id', async (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    
    try {
      const success = await deactivateRewardLink(req.params.link_id);
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ===== استخدام رابط مكافأة (من البوت) =====
  app.post('/api/bot/links/:link_id/claim', async (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    
    const { telegram_id } = req.body;
    if (!telegram_id) {
      res.status(400).json({ success: false, error: 'telegram_id required' });
      return;
    }
    
    try {
      const user = await getUserByTelegramId(String(telegram_id));
      if (!user) {
        res.status(404).json({ success: false, error: 'user_not_found' });
        return;
      }
      
      const result = await claimRewardLink(user.id, req.params.link_id);
      if (!result.success) {
        res.status(400).json({ success: false, error: result.error });
        return;
      }
      
      const updatedUser = await getUserById(user.id);
      res.json({ 
        success: true, 
        points_added: result.pointsAdded,
        new_balance: updatedUser?.points || 0
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ===== إدارة العروض (المفاتيح) من البوت =====
  app.post('/api/bot/packages', async (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    
    const { name, duration_days, bot_count, points_price, max_users, is_special, expires_hours } = req.body;
    
    if (!duration_days || !bot_count || !points_price) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }
    
    try {
      const pkg = await createKeyPackage(
        name || `${duration_days} يوم - ${bot_count} بوت`,
        Number(duration_days),
        Number(bot_count),
        Number(points_price),
        max_users ? Number(max_users) : -1,
        is_special === true || is_special === 1,
        expires_hours ? Number(expires_hours) : 0
      );
      
      if (!pkg) {
        res.status(500).json({ success: false, error: 'Failed to create package' });
        return;
      }
      
      res.json({ success: true, package: pkg });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/bot/packages', async (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    
    try {
      const packages = await getAllKeyPackages();
      res.json({ success: true, packages });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.delete('/api/bot/packages/:id', async (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    
    try {
      const success = await deactivateKeyPackage(Number(req.params.id));
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ===== إدارة المستخدمين من البوت =====
  app.get('/api/bot/users', async (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    try {
      const users = await getAllUsers();
      res.json({ success: true, users });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/bot/users/search/:username', async (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    try {
      const user = await getUserByUsername(req.params.username);
      if (!user) return res.status(404).json({ success: false, error: 'User not found' });
      res.json({ success: true, user });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/bot/users/:id/points', async (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    const { points } = req.body;
    if (points === undefined) return res.status(400).json({ success: false, error: 'Points required' });
    try {
      const success = await setUserPoints(Number(req.params.id), Number(points));
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // إحصائيات عامة للوحة التحكم
  app.get('/api/bot/stats', async (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    try {
      const users = await getAllUsers();
      const links = await getAllRewardLinks();
      const packages = await getAllKeyPackages();
      
      const websiteLinks = links.filter(l => l.externalUrl);
      const pointLinks = links.filter(l => !l.externalUrl);
      
      res.json({
        success: true,
        stats: {
          total_users: users.length,
          total_links: links.length,
          active_links: links.filter(l => l.isActive).length,
          website_links: websiteLinks.length,
          website_links_active: websiteLinks.filter(l => l.isActive).length,
          point_links: pointLinks.length,
          point_links_active: pointLinks.filter(l => l.isActive).length,
          total_packages: packages.length
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/bot/broadcast', async (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    const { title, message } = req.body;
    try {
      const users = await getAllUsers();
      for (const u of users) {
        await createNotification(u.id, title, message);
      }
      res.json({ success: true, message: `Sent to ${users.length} users` });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/bot/users/custom/:uid/send-message', async (req: Request, res: Response) => {
    if (!verifyBotSecret(req, res)) return;
    const { title, message } = req.body;
    try {
      const user = await getUserByCustomUserId(Number(req.params.uid));
      if (!user) return res.status(404).json({ success: false, error: 'User not found' });
      await createNotification(user.id, title, message);
      res.json({ success: true, message: 'Message sent' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}
