/**
 * تم إلغاء الربط بـ Hugging Face Dataset نهائياً.
 * النظام الآن يعتمد كلياً على Supabase (PostgreSQL) كقاعدة بيانات دائمة.
 */

export async function performBackup(isInitial = false) {
  // لا يوجد نسخ احتياطي لـ Hugging Face Dataset
  return;
}

export async function restoreBackup() {
  // لا يوجد استعادة بيانات من Hugging Face Dataset
  return;
}

export function startBackupInterval() {
  // لا يوجد جدولة نسخ احتياطي
  return;
}
