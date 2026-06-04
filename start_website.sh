#!/bin/bash

# بدء تشغيل النظام بالاعتماد الكلي على Supabase (PostgreSQL)
echo "🚀 بدء تشغيل نظام AlliFF (Supabase Only Mode)..."

# 1. الدخول لمجلد التطبيق
cd /app

# 2. تشغيل الموقع والسيرفر
echo "🚀 جاري تشغيل الموقع والسيرفر..."
NODE_ENV=production node dist/index.js
