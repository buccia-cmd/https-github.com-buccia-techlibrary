const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();

// Render автоматически устанавливает PORT, используем его или 3000 для локальной разработки
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Обслуживаем статические файлы из папки client
app.use(express.static(path.join(__dirname, '../client')));

// Подключаем Supabase
const supabaseClient = require('./supabase');

// Проверка подключения к Supabase
async function checkSupabaseConnection() {
  console.log('🔗 Проверка подключения к Supabase...');
  
  try {
    const { data, error } = await supabaseClient
      .from('books')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Ошибка Supabase:', error.message);
      
      if (error.code === 'PGRST301') {
        console.log('⚠️  Таблица "books" не существует!');
        console.log('Создайте ее в SQL Editor Supabase:');
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
      }
      return false;
    }
    
    console.log('✅ Supabase подключен успешно!');
    return true;
  } catch (err) {
    console.error('❌ Ошибка при проверке подключения:', err.message);
    return false;
  }
}

// API Routes (оставьте ваши существующие роуты без изменений)
app.get('/api/books', async (req, res) => {
  try {
    const { search, categories, tags, year, language, page = 1, limit = 9 } = req.query;
    
    let query = supabaseClient
      .from('books')
      .select('*', { count: 'exact' });

    // Применяем фильтры
    if (search) {
      query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (categories) {
      const categoriesArray = categories.split(',');
      query = query.in('category', categoriesArray);
    }

    if (tags) {
      const tagsArray = tags.split(',');
      query = query.contains('tags', tagsArray);
    }

    if (year) {
      if (year === '2025') {
        query = query.eq('year', 2025);
      } else if (year === '2024') {
        query = query.eq('year', 2024);
      } else if (year === '2023-2021') {
        query = query.in('year', [2021, 2022, 2023]);
      } else if (year === 'old') {
        query = query.lt('year', 2021);
      }
    }

    if (language) {
      const languageArray = language.split(',');
      query = query.in('language', languageArray);
    }

    // Пагинация
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Ошибка Supabase:', error);
      
      // Возвращаем демо-данные если Supabase не доступен
      if (error.code === 'PGRST301' || error.code === '42P01') {
        const demoBooks = getDemoBooks();
        return res.json({
          success: true,
          books: demoBooks.slice(from, to + 1),
          pagination: {
            total: demoBooks.length,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(demoBooks.length / limit)
          },
          note: 'Используются демо-данные (таблица books не найдена в Supabase)'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      books: data,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching books:', error);
    
    // Всегда возвращаем хотя бы демо-данные
    const demoBooks = getDemoBooks();
    res.json({
      success: true,
      books: demoBooks.slice(0, 9),
      pagination: {
        total: demoBooks.length,
        page: 1,
        limit: 9,
        totalPages: Math.ceil(demoBooks.length / 9)
      },
      note: 'Используются демо-данные из-за ошибки сервера'
    });
  }
});

// Демо-данные для fallback
function getDemoBooks() {
  return [
    {
      id: '1',
      title: "Современный JavaScript 2025",
      author: "Алексей Петров",
      year: 2025,
      pages: 450,
      description: "Полное руководство по современному JavaScript с примерами и лучшими практиками.",
      category: "Программирование",
      tags: ["JavaScript", "ES2025", "Frontend"],
      language: "ru",
      views: 150,
      cover_color: "#2563eb",
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      title: "PostgreSQL для разработчиков",
      author: "Мария Сидорова",
      year: 2024,
      pages: 320,
      description: "Практическое руководство по работе с PostgreSQL от основ до продвинутых техник.",
      category: "Базы данных",
      tags: ["PostgreSQL", "SQL", "Базы данных"],
      language: "ru",
      views: 89,
      cover_color: "#10b981",
      created_at: new Date().toISOString()
    },
    {
      id: '3',
      title: "React 19 и экосистема",
      author: "Дмитрий Иванов",
      year: 2025,
      pages: 380,
      description: "Новые возможности React 19 и лучшие практики разработки современных приложений.",
      category: "Программирование",
      tags: ["React", "TypeScript", "Frontend"],
      language: "ru",
      views: 210,
      cover_color: "#61dafb",
      created_at: new Date().toISOString()
    },
    {
      id: '4',
      title: "Python для анализа данных",
      author: "Иван Смирнов",
      year: 2023,
      pages: 520,
      description: "Комплексное руководство по анализу данных с использованием Python и библиотек.",
      category: "Искусственный интеллект",
      tags: ["Python", "Data Science", "AI"],
      language: "ru",
      views: 120,
      cover_color: "#f7df1e",
      created_at: new Date().toISOString()
    },
    {
      id: '5',
      title: "Docker и Kubernetes для начинающих",
      author: "Ольга Кузнецова",
      year: 2024,
      pages: 280,
      description: "Основы работы с контейнеризацией и оркестрацией контейнеров.",
      category: "Программирование",
      tags: ["Docker", "Kubernetes", "DevOps"],
      language: "ru",
      views: 95,
      cover_color: "#2496ed",
      created_at: new Date().toISOString()
    }
  ];
}

// Другие роуты (сохраните ваши существующие)
app.get('/api/stats', async (req, res) => {
  try {
    const { count, error: countError } = await supabaseClient
      .from('books')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      // Возвращаем демо-статистику
      return res.json({
        success: true,
        stats: {
          totalBooks: 5,
          categories: {
            'Программирование': 3,
            'Базы данных': 1,
            'Искусственный интеллект': 1
          },
          lastUpdated: new Date().toISOString(),
          note: 'Демо-статистика'
        }
      });
    }

    const { data: categoriesData, error: categoriesError } = await supabaseClient
      .from('books')
      .select('category');

    const categoryStats = {};
    if (!categoriesError && categoriesData) {
      categoriesData.forEach(book => {
        categoryStats[book.category] = (categoryStats[book.category] || 0) + 1;
      });
    }

    res.json({
      success: true,
      stats: {
        totalBooks: count || 0,
        categories: categoryStats,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.json({
      success: true,
      stats: {
        totalBooks: 5,
        categories: {
          'Программирование': 3,
          'Базы данных': 1,
          'Искусственный интеллект': 1
        },
        lastUpdated: new Date().toISOString(),
        note: 'Демо-статистика (ошибка подключения к Supabase)'
      }
    });
  }
});

// Обслуживаем статические файлы
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'index.html'));
});

// Запуск сервера
async function startServer() {
  // Проверяем подключение к Supabase
  await checkSupabaseConnection();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Сервер запущен на порту ${PORT}`);
    console.log(`🌐 Откройте в браузере: http://localhost:${PORT}`);
    console.log(`📡 API доступен по: http://localhost:${PORT}/api/books`);
  });
}

// Обработка ошибок сервера
app.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Порт ${PORT} уже используется!`);
    console.log('Попробуйте:');
    console.log('1. Закрыть другие приложения, использующие порт', PORT);
    console.log('2. Использовать другой порт (измените PORT в .env)');
    console.log('3. На Render оставьте PORT как есть, Render сам управляет портами');
  } else {
    console.error('❌ Ошибка сервера:', error);
  }
});

// Запускаем сервер
startServer().catch(console.error);
