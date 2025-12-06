// src/app/admin-panel/AddBookForm.tsx
'use client';

import { useState } from 'react';
import { NewBook } from '@/lib/types';
import './admin-panel.css';

interface AddBookFormProps {
  onSubmit: (book: NewBook, pdfFile?: File) => Promise<{
    success: boolean;
    message: string;
  }>;
  uploadingPDF: boolean;
  storageReady?: boolean;
}

export default function AddBookForm({ onSubmit, uploadingPDF, storageReady = true }: AddBookFormProps) {
  // Используем правильные начальные значения
  const [formData, setFormData] = useState<Omit<NewBook, 'id'>>({
    title: '',
    author: '',
    description: '',
    year: new Date().getFullYear(),
    pages: 0,
    category: 'programming',
    tags: [],
    pdf_url: null, // null вместо пустой строки
  });
  
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      if (name === 'tags') {
        // Фильтруем пустые теги
        const tagsArray = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        return { ...prev, tags: tagsArray };
      }
      
      if (name === 'year' || name === 'pages') {
        const numValue = parseInt(value);
        return { ...prev, [name]: isNaN(numValue) ? 0 : numValue };
      }
      
      if (name === 'pdf_url') {
        // Если URL очищается, устанавливаем null
        return { ...prev, [name]: value.trim() === '' ? null : value.trim() };
      }
      
      return { ...prev, [name]: value };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setMessage({ 
          type: 'error', 
          text: 'Пожалуйста, выберите PDF файл' 
        });
        return;
      }
      
      if (file.size > 50 * 1024 * 1024) { // 50MB лимит
        setMessage({ 
          type: 'error', 
          text: 'Файл слишком большой. Максимум 50MB' 
        });
        return;
      }
      
      setPdfFile(file);
      setMessage(null);
      
      // Очищаем URL если загружаем файл
      setFormData(prev => ({ ...prev, pdf_url: null }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация
    if (!formData.title.trim()) {
      setMessage({ 
        type: 'error', 
        text: 'Введите название книги' 
      });
      return;
    }
    
    if (!formData.author.trim()) {
      setMessage({ 
        type: 'error', 
        text: 'Введите автора книги' 
      });
      return;
    }
    
    // Проверяем что есть либо файл, либо URL
    if (!pdfFile && !formData.pdf_url) {
      setMessage({ 
        type: 'error', 
        text: 'Загрузите PDF файл или укажите ссылку на PDF' 
      });
      return;
    }
    
    setLoading(true);
    setMessage(null);

    try {
      // Подготавливаем данные для отправки
      const bookToSubmit: NewBook = {
        ...formData,
        // Убедимся что year и pages числа
        year: typeof formData.year === 'number' ? formData.year : parseInt(String(formData.year)) || new Date().getFullYear(),
        pages: typeof formData.pages === 'number' ? formData.pages : parseInt(String(formData.pages)) || 0,
        // Убедимся что tags это массив строк
        tags: Array.isArray(formData.tags) ? formData.tags : [],
        // pdf_url уже обработан в handleInputChange
      };
      
      const result = await onSubmit(bookToSubmit, pdfFile || undefined);
      
      setMessage({ 
        type: result.success ? 'success' : 'error', 
        text: result.message 
      });
      
      if (result.success) {
        // Сброс формы только при успехе
        setFormData({
          title: '',
          author: '',
          description: '',
          year: new Date().getFullYear(),
          pages: 0,
          category: 'programming',
          tags: [],
          pdf_url: null,
        });
        setPdfFile(null);
        
        // Сброс input файла
        const fileInput = document.getElementById('pdf') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setMessage({ 
        type: 'error', 
        text: `Ошибка: ${errorMessage}` 
      });
      console.error('Form submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="book-form">
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="title">Название книги *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            placeholder="Введите название книги"
            disabled={loading || uploadingPDF}
          />
        </div>

        <div className="form-group">
          <label htmlFor="author">Автор *</label>
          <input
            type="text"
            id="author"
            name="author"
            value={formData.author}
            onChange={handleInputChange}
            required
            placeholder="Введите имя автора"
            disabled={loading || uploadingPDF}
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Категория</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            disabled={loading || uploadingPDF}
          >
            <option value="programming">Программирование</option>
            <option value="design">Дизайн</option>
            <option value="business">Бизнес</option>
            <option value="science">Наука</option>
            <option value="fiction">Художественная литература</option>
            <option value="other">Другое</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="year">Год издания</label>
          <input
            type="number"
            id="year"
            name="year"
            value={formData.year}
            onChange={handleInputChange}
            min="1900"
            max={new Date().getFullYear()}
            placeholder="2024"
            disabled={loading || uploadingPDF}
          />
        </div>

        <div className="form-group">
          <label htmlFor="pages">Количество страниц</label>
          <input
            type="number"
            id="pages"
            name="pages"
            value={formData.pages}
            onChange={handleInputChange}
            min="0"
            placeholder="0"
            disabled={loading || uploadingPDF}
          />
        </div>

        <div className="form-group">
          <label htmlFor="tags">Теги (через запятую)</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags?.join(', ') || ''}
            onChange={handleInputChange}
            placeholder="javascript, react, programming"
            disabled={loading || uploadingPDF}
          />
        </div>

        <div className="form-group full-width">
          <label htmlFor="description">Описание</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            placeholder="Введите описание книги..."
            disabled={loading || uploadingPDF}
          />
        </div>

        <div className="form-group">
          <label htmlFor="pdf">
            PDF файл книги *
            {!storageReady && <span className="warning-text"> (Создайте bucket pdf-books)</span>}
          </label>
          <input
            type="file"
            id="pdf"
            name="pdf"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            disabled={loading || uploadingPDF || !storageReady}
            required={!formData.pdf_url} // Обязательно если нет URL
          />
          {pdfFile && (
            <div className="file-info">
              <span>📄 {pdfFile.name}</span>
              <span className="file-size">
                ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
          )}
          {uploadingPDF && <p className="uploading-text">Загрузка PDF...</p>}
          {!storageReady && (
            <p className="warning-text">
              ⚠️ Создайте bucket <strong>pdf-books</strong> в Supabase Dashboard
            </p>
          )}
        </div>

        <div className="form-group full-width">
          <label htmlFor="pdf_url">
            ИЛИ ссылка на PDF (URL)
            <small style={{ marginLeft: '8px', color: '#666' }}>
              (если нет файла для загрузки)
            </small>
          </label>
          <input
            type="url"
            id="pdf_url"
            name="pdf_url"
            value={formData.pdf_url || ''}
            onChange={handleInputChange}
            placeholder="https://example.com/book.pdf"
            disabled={loading || uploadingPDF || !!pdfFile}
          />
          {pdfFile && (
            <p className="info-text">
              ⓘ При загрузке файла ссылка будет проигнорирована
            </p>
          )}
        </div>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      <div className="form-actions">
        <button 
          type="submit" 
          disabled={loading || uploadingPDF || (!pdfFile && !formData.pdf_url)}
          className={`submit-btn ${loading ? 'loading' : ''}`}
        >
          {loading ? '⏳ Добавление...' : 
           uploadingPDF ? '📤 Загрузка файла...' : '➕ Добавить книгу'}
        </button>
      </div>
    </form>
  );
}
