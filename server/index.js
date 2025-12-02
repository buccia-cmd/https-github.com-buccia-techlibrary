const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
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
app.use(express.static(path.join(__dirname, '../client')));

// Подключаем Supabase
const supabaseClient = require('./supabase');
const { supabase, testConnection } = require('./supabase');

// Проверка подключения при запуске
app.listen(PORT, async () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  
  // Проверяем подключение к Supabase
  const isConnected = await testConnection();
  if (!isConnected) {
    console.log('⚠️  Supabase не подключен, но сервер работает');
    console.log('📚 Будут использоваться демо-данные');
  }
  
  console.log(`🌐 Откройте: http://localhost:${PORT}`);
});

// API Routes
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

    if (error) throw error;

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
    res.status(500).json({
      success: false,
      error: 'Не удалось загрузить книги'
    });
  }
});

app.get('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabaseClient
      .from('books')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Книга не найдена'
      });
    }

    res.json({
      success: true,
      book: data
    });

  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({
      success: false,
      error: 'Не удалось загрузить книгу'
    });
  }
});

app.post('/api/books/view/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabaseClient
      .from('books')
      .update({ views: supabaseClient.raw('views + 1') })
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Счетчик просмотров обновлен'
    });

  } catch (error) {
    console.error('Error updating view count:', error);
    res.status(500).json({
      success: false,
      error: 'Не удалось обновить счетчик просмотров'
    });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    // Получаем общую статистику
    const { count, error: countError } = await supabaseClient
      .from('books')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // Получаем книги по категориям
    const { data: categoriesData, error: categoriesError } = await supabaseClient
      .from('books')
      .select('category');

    if (categoriesError) throw categoriesError;

    const categoryStats = {};
    categoriesData.forEach(book => {
      categoryStats[book.category] = (categoryStats[book.category] || 0) + 1;
    });

    res.json({
      success: true,
      stats: {
        totalBooks: count,
        categories: categoryStats,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Не удалось загрузить статистику'
    });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const { data, error } = await supabaseClient
      .from('books')
      .select('category')
      .order('category');

    if (error) throw error;

    const uniqueCategories = [...new Set(data.map(book => book.category))];
    
    res.json({
      success: true,
      categories: uniqueCategories
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Не удалось загрузить категории'
    });
  }
});

app.get('/api/tags', async (req, res) => {
  try {
    const { data, error } = await supabaseClient
      .from('books')
      .select('tags');

    if (error) throw error;

    const allTags = data.flatMap(book => book.tags);
    const tagCounts = {};
    
    allTags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });

    // Сортируем по популярности
    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));

    res.json({
      success: true,
      tags: sortedTags
    });

  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({
      success: false,
      error: 'Не удалось загрузить теги'
    });
  }
});

// Обслуживаем статические файлы
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
  console.log(`🌐 Откройте в браузере: http://localhost:${PORT}`);
});
