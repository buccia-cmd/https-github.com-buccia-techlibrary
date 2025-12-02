const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Ваши ключи (уже вижу их в коде)
const SUPABASE_URL = 'https://bnqyvdiqvbywwuxjsdft.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJucXl2ZGlxdmJ5d3d1eGpzZGZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NzM2MjQsImV4cCI6MjA4MDI0OTYyNH0._0kbYCJBX3Tq_Y5sy5XqQ6CducZjVG-XbDwJSuHb2L4';

// Прямая инициализация для теста
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Тестовый запрос
async function testConnection() {
  console.log('🔍 Тестирую подключение к Supabase...');
  console.log('URL:', SUPABASE_URL);
  
  try {
    // Простой запрос к таблице books
    const { data, error } = await supabase
      .from('books')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Ошибка Supabase:', error);
      
      if (error.code === 'PGRST301') {
        console.log('⚠️  Таблица "books" не существует!');
        console.log('Создайте таблицу в SQL Editor Supabase:');
        console.log(`
          CREATE TABLE books (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            year INTEGER NOT NULL,
            pages INTEGER,
            description TEXT,
            category TEXT NOT NULL,
            tags TEXT[] DEFAULT '{}',
            language TEXT DEFAULT 'ru',
            views INTEGER DEFAULT 0,
            download_url TEXT,
            cover_color TEXT DEFAULT '#2563eb',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
          );
        `);
      } else if (error.code === '42501') {
        console.log('⚠️  Нет прав доступа к таблице!');
        console.log('Включите RLS или добавьте политики в Supabase:');
        console.log('1. Откройте Authentication > Policies');
        console.log('2. Создайте новую политику для таблицы books');
        console.log('3. Выберите "Enable read access to everyone"');
      } else {
        console.log('Полная ошибка:', JSON.stringify(error, null, 2));
      }
    } else {
      console.log('✅ Подключение успешно!');
      console.log('Таблица books существует');
    }
  } catch (err) {
    console.error('❌ Ошибка при тестировании:', err.message);
  }
}

testConnection();

module.exports = supabase;
