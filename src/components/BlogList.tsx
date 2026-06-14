import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, ChevronRight, Rss, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAllBlogPosts, getPublishedPosts, formatDate, type BlogPostMeta } from '../utils/blogUtils';
import { useLanguage } from '../contexts/LanguageContext';

type FilterChipProps = {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
};

const FilterChip: React.FC<FilterChipProps> = ({ label, count, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
      active
        ? 'bg-amber-500 text-white'
        : 'bg-white text-slate-600 hover:bg-amber-50 hover:text-amber-700 border border-slate-200'
    }`}
  >
    <span>{label}</span>
    <span className={`text-xs ${active ? 'text-amber-100' : 'text-slate-400'}`}>({count})</span>
  </button>
);

function getPostCategories(category: string): string[] {
  return category.split(',').map((c) => c.trim()).filter(Boolean);
}

const BlogList: React.FC = () => {
  const [blogPosts, setBlogPosts] = useState<BlogPostMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedSeries, setSelectedSeries] = useState('all');
  const { t } = useLanguage();

  useEffect(() => {
    async function loadPosts() {
      try {
        const allPosts = await getAllBlogPosts();
        const postsToShow = process.env.NODE_ENV === 'development' ? allPosts : getPublishedPosts(allPosts);
        setBlogPosts(postsToShow);
      } catch (error) {
        console.error('Error loading blog posts:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPosts();
  }, []);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of blogPosts) {
      for (const cat of getPostCategories(post.category)) {
        counts.set(cat, (counts.get(cat) || 0) + 1);
      }
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [blogPosts]);

  const years = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of blogPosts) {
      const year = post.date.slice(0, 4);
      counts.set(year, (counts.get(year) || 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [blogPosts]);

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return blogPosts.filter((post) => {
      if (query) {
        const matchesSearch =
          post.title.toLowerCase().includes(query) ||
          post.excerpt.toLowerCase().includes(query) ||
          post.category.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      if (selectedCategory !== 'all') {
        const cats = getPostCategories(post.category);
        if (!cats.includes(selectedCategory)) return false;
      }

      if (selectedYear !== 'all' && !post.date.startsWith(selectedYear)) {
        return false;
      }

      if (selectedSource === 'wechat' && !post.source) return false;
      if (selectedSource === 'original' && post.source) return false;

      if (selectedSeries !== 'all' && post.series !== selectedSeries) return false;

      return true;
    });
  }, [blogPosts, searchQuery, selectedCategory, selectedYear, selectedSource, selectedSeries]);

  const sourceCounts = useMemo(() => ({
    original: blogPosts.filter((p) => !p.source).length,
    wechat: blogPosts.filter((p) => p.source).length,
  }), [blogPosts]);

  const seriesCounts = useMemo(() => ({
    'value-stack': blogPosts.filter((p) => p.series === 'value-stack').length,
  }), [blogPosts]);

  const postsByYear = useMemo(() => {
    const groups = new Map<string, BlogPostMeta[]>();
    for (const post of filteredPosts) {
      const year = post.date.slice(0, 4);
      const existing = groups.get(year) || [];
      existing.push(post);
      groups.set(year, existing);
    }
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredPosts]);

  const renderPostCard = (post: BlogPostMeta) => (
    <Link key={post.id} to={`/blog/${post.id}`} className="group">
      <article className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
        <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            <span>{formatDate(post.date)}</span>
            {!post.published && process.env.NODE_ENV === 'development' && (
              <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                {t('blog.draft')}
              </span>
            )}
          </div>
          <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-medium">
            {post.category}
          </span>
        </div>

        <h3 className="text-xl font-semibold text-slate-800 mb-3 group-hover:text-amber-600 transition-colors">
          {post.title}
        </h3>

        <p className="text-slate-600 mb-4 leading-relaxed line-clamp-3">
          {post.excerpt}
        </p>

        <div className="flex items-center text-amber-600 font-medium">
          <span>{t('blog.readMore')}</span>
          <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </article>
    </Link>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6">
              {t('blog.title')}
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {t('blog.loading')}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                <div className="h-4 bg-slate-200 rounded mb-3"></div>
                <div className="h-6 bg-slate-200 rounded mb-3"></div>
                <div className="h-16 bg-slate-200 rounded mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6">
            {t('blog.title')}
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t('blog.subtitle')}
          </p>
          <div className="mt-6">
            <a
              href="/rss.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 transition-colors"
              title="Subscribe to RSS Feed"
            >
              <Rss className="w-5 h-5" />
              <span className="font-medium">RSS Feed</span>
            </a>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 mb-10 space-y-5">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('blog.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-slate-700 placeholder:text-slate-400"
            />
          </div>

          {/* Category filter */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              {t('blog.filterCategory')}
            </p>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                label={t('blog.filterAll')}
                count={blogPosts.length}
                active={selectedCategory === 'all'}
                onClick={() => setSelectedCategory('all')}
              />
              {categories.map(([category, count]) => (
                <FilterChip
                  key={category}
                  label={category}
                  count={count}
                  active={selectedCategory === category}
                  onClick={() => setSelectedCategory(category)}
                />
              ))}
            </div>
          </div>

          {/* Year filter */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              {t('blog.filterYear')}
            </p>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                label={t('blog.filterAll')}
                count={blogPosts.length}
                active={selectedYear === 'all'}
                onClick={() => setSelectedYear('all')}
              />
              {years.map(([year, count]) => (
                <FilterChip
                  key={year}
                  label={year}
                  count={count}
                  active={selectedYear === year}
                  onClick={() => setSelectedYear(year)}
                />
              ))}
            </div>
          </div>

          {/* Source filter */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              {t('blog.filterSource')}
            </p>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                label={t('blog.filterAll')}
                count={blogPosts.length}
                active={selectedSource === 'all'}
                onClick={() => setSelectedSource('all')}
              />
              <FilterChip
                label={t('blog.sourceOriginal')}
                count={sourceCounts.original}
                active={selectedSource === 'original'}
                onClick={() => setSelectedSource('original')}
              />
              <FilterChip
                label={t('blog.sourceWechat')}
                count={sourceCounts.wechat}
                active={selectedSource === 'wechat'}
                onClick={() => setSelectedSource('wechat')}
              />
            </div>
          </div>

          {/* Series filter */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              {t('blog.filterSeries')}
            </p>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                label={t('blog.filterAll')}
                count={blogPosts.length}
                active={selectedSeries === 'all'}
                onClick={() => setSelectedSeries('all')}
              />
              <FilterChip
                label={t('blog.seriesValueStack')}
                count={seriesCounts['value-stack']}
                active={selectedSeries === 'value-stack'}
                onClick={() => setSelectedSeries('value-stack')}
              />
            </div>
          </div>

          {/* Result count */}
          <p className="text-sm text-slate-500">
            {t('blog.filterResultCount')
              .replace('{filtered}', String(filteredPosts.length))
              .replace('{total}', String(blogPosts.length))}
          </p>
        </div>

        {/* Posts grouped by year */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500 text-lg">{t('blog.noResults')}</p>
          </div>
        ) : (
          <div className="space-y-12">
            {postsByYear.map(([year, posts]) => (
              <section key={year}>
                <h2 className="text-2xl font-bold text-slate-800 mb-6 pb-2 border-b border-slate-200">
                  {year}
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {posts.map(renderPostCard)}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center mt-16">
          <p className="text-slate-600 mb-4">{t('blog.moreArticles')}</p>
          <div className="flex justify-center space-x-4">
            <a
              href="https://www.linkedin.com/in/jiabinlu/"
              className="text-amber-600 hover:text-amber-700 font-medium transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
            <a
              href="https://x.com/jiabinlu123"
              className="text-amber-600 hover:text-amber-700 font-medium transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              X.com
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

export default BlogList;
