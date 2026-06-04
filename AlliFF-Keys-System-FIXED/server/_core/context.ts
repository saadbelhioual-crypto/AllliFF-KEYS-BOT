import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { COOKIE_NAME } from "@shared/const";
import { getSessionUser } from "../localDb";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: LocalUserCtx | null;
};

export type LocalUserCtx = {
  id: number;
  username: string;
  points: number;
  isAdmin: boolean;
  openId: string;
  name: string;
  role: 'user' | 'admin';
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: LocalUserCtx | null = null;

  try {
    const cookieHeader = opts.req.headers.cookie || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c: string) => {
        const [k, ...v] = c.trim().split('=');
        return [k?.trim(), v.join('=')];
      }).filter(([k]: [string]) => k)
    );
    const token = cookies['alliff_session'] || cookies[COOKIE_NAME];
    if (token) {
      // تم إضافة await هنا لأن getSessionUser أصبحت async مع Supabase
      const localUser = await getSessionUser(token);
      if (localUser) {
        user = {
          id: localUser.id,
          username: localUser.username,
          points: localUser.points,
          isAdmin: localUser.isAdmin,
          openId: `local_${localUser.id}`,
          name: localUser.username,
          role: localUser.isAdmin ? 'admin' : 'user',
        };
      }
    }
  } catch (error) {
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
