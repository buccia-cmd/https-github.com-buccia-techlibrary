const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Проверяем наличие необходимых переменных окружения
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ Отсутствуют переменные окружения Supabase');
  console.log('Создайте файл .env в папке server и добавьте:');
  console.log('SUPABASE_URL=ваш_url_от_supabase');
  console.log('SUPABASE_ANON_KEY=ваш_anon_key_от_supabase');
  process.exit(1);
}

// Создаем клиент Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = supabase;