# استخدام صورة Node.js كقاعدة للموقع
FROM node:22-slim

# تعيين مجلد العمل
WORKDIR /app

# تثبيت المكتبات النظامية المطلوبة
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# تثبيت pnpm
RUN npm install -g pnpm

# نسخ ملفات الموقع
COPY AlliFF-Keys-System-FIXED/ .

# تثبيت متطلبات الموقع
RUN pnpm install

# تعيين متغيرات البيئة المطلوبة للبناء
ENV NODE_ENV=production
ENV PORT=7860

# بناء الموقع بشكل نهائي (Production Build)
RUN pnpm run build

# نسخ سكريبت البدء المحدث
COPY start_website.sh .
RUN chmod +x start_website.sh

# تعريض منفذ Hugging Face (7860)
EXPOSE 7860

# تشغيل السكريبت (الموقع فقط)
CMD ["./start_website.sh"]
