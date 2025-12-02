const { createClient } = require('@supabase/supabase-js');

// Используем ваши ключи напрямую
const supabase = createClient(
  'https://bnqyvdiqvbywwuxjsdft.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJucXl2ZGlxdmJ5d3d1eGpzZGZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NzM2MjQsImV4cCI6MjA4MDI0OTYyNH0._0kbYCJBX3Tq_Y5sy5XqQ6CducZjVG-XbDwJSuHb2L4'
);

console.log('🔧 Supabase клиент инициализирован');
console.log('URL:', 'https://bnqyvdiqvbywwuxjsdft.supabase.co');

module.exports = supabase;
