const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Проверяем наличие необходимых переменных окружения
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ Отсутствуют переменные окружения Supabase');
  console.log('Создайте файл .env в папке server и добавьте:');
  console.log('SUPABASE_URL=https://bnqyvdiqvbywwuxjsdft.supabase.co');
  console.log('SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJucXl2ZGlxdmJ5d3d1eGpzZGZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NzM2MjQsImV4cCI6MjA4MDI0OTYyNH0._0kbYCJBX3Tq_Y5sy5XqQ6CducZjVG-XbDwJSuHb2L4');
  process.exit(1);
}

// Создаем клиент Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = supabase;
