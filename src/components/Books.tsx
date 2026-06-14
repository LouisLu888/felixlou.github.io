import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Star, 
  ExternalLink, 
  Calendar, 
  Target, 
  Lightbulb,
  Tag,
  Filter,
  Clock,
  CheckCircle,
  Eye
} from 'lucide-react';
import { 
  books, 
  getBooksByCategory, 
  getAllCategories, 
  formatRating, 
  getBooksByStatus,
  type Book 
} from '../utils/bookUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { EMAIL } from '../config/siteProfile';

const Books: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const categories = getAllCategories();
  const { t } = useLanguage();

  const getFilteredBooks = (): Book[] => {
    let filteredBooks = books;

    if (selectedCategory !== 'all') {
      filteredBooks = filteredBooks.filter(book => book.category === selectedCategory);
    }

    if (selectedStatus !== 'all') {
      filteredBooks = filteredBooks.filter(book => book.status === selectedStatus);
    }

    return filteredBooks;
  };

  const filteredBooks = getFilteredBooks();

  const getStatusColor = (status: Book['status']) => {
    switch (status) {
      case 'read':
        return 'bg-green-100 text-green-800';
      case 'reading':
        return 'bg-blue-100 text-blue-800';
      case 'want-to-read':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Book['status']) => {
    switch (status) {
      case 'read':
        return <CheckCircle className="w-3 h-3" />;
      case 'reading':
        return <Eye className="w-3 h-3" />;
      case 'want-to-read':
        return <Clock className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: Book['status']) => {
    switch (status) {
      case 'read':
        return t('books.read');
      case 'reading':
        return t('books.reading');
      case 'want-to-read':
        return t('books.wantToRead');
      default:
        return status;
    }
  };

  const getCategoryStats = () => {
    const stats: Record<string, number> = {};
    books.forEach(book => {
      stats[book.category] = (stats[book.category] || 0) + 1;
    });
    return stats;
  };

  const categoryStats = getCategoryStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6">
            {t('books.title')}
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            {t('books.subtitle')}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-slate-800 mb-1">
              {books.filter(b => b.status === 'read').length}
            </div>
            <div className="text-sm text-slate-600">{t('books.booksRead')}</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-slate-800 mb-1">
              {books.filter(b => b.status === 'reading').length}
            </div>
            <div className="text-sm text-slate-600">{t('books.currentlyReading')}</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-slate-800 mb-1">
              {books.filter(b => b.rating >= 4 && b.rating > 0).length}
            </div>
            <div className="text-sm text-slate-600">{t('books.highlyRated')}</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-slate-800 mb-1">
              {categories.length}
            </div>
            <div className="text-sm text-slate-600">{t('books.categories')}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-12">
          <div className="flex items-center mb-4">
            <Filter className="w-5 h-5 mr-2 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-800">{t('books.filterBooks')}</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Category Filter */}
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-3">{t('books.byCategory')}</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-amber-500 text-white'
                      : 'bg-white text-slate-600 hover:bg-amber-50 hover:text-amber-600'
                  }`}
                >
                  {t('common.all')} ({books.length})
                </button>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-amber-500 text-white'
                        : 'bg-white text-slate-600 hover:bg-amber-50 hover:text-amber-600'
                    }`}
                  >
                    {category} ({categoryStats[category] || 0})
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-3">{t('books.byStatus')}</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedStatus('all')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedStatus === 'all'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  {t('common.all')}
                </button>
                {['read', 'reading', 'want-to-read'].map(status => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedStatus === status
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    {getStatusText(status as Book['status'])} ({books.filter(b => b.status === status).length})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Books Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
            >
              {/* Book Cover */}
              <div className="h-48 bg-gradient-to-br from-amber-400 to-orange-500 relative overflow-hidden">
                {book.coverUrl ? (
                  <img 
                    src={book.coverUrl} 
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-white p-4">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-80" />
                      <p className="text-sm font-semibold line-clamp-2">{book.title}</p>
                    </div>
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(book.status)}`}>
                    {getStatusIcon(book.status)}
                    <span className="ml-1">{getStatusText(book.status)}</span>
                  </span>
                </div>

                {/* Rating */}
                {book.rating > 0 && (
                  <div className="absolute top-3 left-3">
                    <div className="bg-white bg-opacity-90 px-2 py-1 rounded-full text-xs font-medium text-amber-600">
                      {formatRating(book.rating)}
                    </div>
                  </div>
                )}
              </div>

              {/* Book Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    {book.category}
                  </span>
                  {book.dateRead && (
                    <div className="flex items-center text-xs text-slate-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(book.dateRead).getFullYear()}
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-slate-800 mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors">
                  {book.title}
                </h3>

                <p className="text-sm text-slate-600 mb-3">
                  {t('books.by')} {book.author}
                </p>

                <p className="text-sm text-slate-600 leading-relaxed mb-4 line-clamp-3">
                  {book.description}
                </p>

                {/* Key Takeaways Preview */}
                {book.keyTakeaways.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <Lightbulb className="w-3 h-3 mr-1 text-amber-500" />
                      <span className="text-xs font-medium text-slate-700">{t('books.keyInsightsLabel')}</span>
                    </div>
                    <div className="text-xs text-slate-600 line-clamp-2">
                      {book.keyTakeaways[0]}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {book.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {book.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {book.tags.length > 3 && (
                      <span className="text-xs text-slate-500">
                        +{book.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  {book.amazonUrl && (
                    <a
                      href={book.amazonUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-amber-600 hover:text-amber-700 font-medium"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      {t('books.viewOnAmazon')}
                    </a>
                  )}
                  
                  {book.keyTakeaways.length > 1 && (
                    <span className="text-xs text-slate-500">
                      {book.keyTakeaways.length} {t('books.insights')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredBooks.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">{t('books.noBooksFound')}</h3>
            <p className="text-slate-600 mb-4">{t('books.noBooksDescription')}</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedStatus('all');
              }}
              className="text-amber-600 hover:text-amber-700 font-medium"
            >
              {t('books.clearFilters')}
            </button>
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <Target className="w-12 h-12 mx-auto mb-4 text-amber-500" />
            <h3 className="text-2xl font-semibold text-slate-800 mb-4">
              {t('books.bookRecommendations')}
            </h3>
            <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
              {t('books.bookRecommendationsDescription')}
            </p>
            <a
              href={`mailto:${EMAIL}`}
              className="inline-flex items-center bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 transition-colors font-medium"
            >
              {t('books.shareRecommendations')}
            </a>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link
            to="/"
            className="inline-flex items-center text-slate-600 hover:text-amber-600 transition-colors"
          >
            {t('common.backToHome')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Books;
