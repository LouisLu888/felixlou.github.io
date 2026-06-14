import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Linkedin, Twitter, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getAllBlogPosts, getPublishedPosts, formatDate, type BlogPostMeta } from '../utils/blogUtils';
import { careerTimeline, EMAIL, FEATURED_POST_SLUGS, BUTTONDOWN } from '../config/siteProfile';

const Home: React.FC = () => {
  const { language, t } = useLanguage();
  const [posts, setPosts] = useState<BlogPostMeta[]>([]);

  useEffect(() => {
    async function load() {
      const all = await getAllBlogPosts();
      const visible = import.meta.env.MODE === 'production' ? getPublishedPosts(all) : all;
      setPosts(visible);
    }
    load();
  }, []);

  const contentStats = useMemo(() => {
    if (posts.length === 0) return null;
    const years = posts.map((p) => p.date.slice(0, 4));
    const minYear = Math.min(...years.map(Number));
    const maxYear = Math.max(...years.map(Number));
    const wechatCount = posts.filter((p) => p.source).length;
    const originalCount = posts.length - wechatCount;
    return { total: posts.length, wechatCount, originalCount, minYear, maxYear };
  }, [posts]);

  const latestPosts = posts.slice(0, 3);

  const featuredPosts = FEATURED_POST_SLUGS
    .map((slug) => posts.find((p) => p.id === slug))
    .filter((post): post is BlogPostMeta => Boolean(post));

  const pick = <T,>(item: { zh: T; en: T }): T => item[language];

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <div className="max-w-2xl mx-auto px-6 pt-28 pb-20 space-y-14">

        {/* Hero */}
        <header className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">{t('home.hero.name')}</h1>
          <p className="text-slate-500">{t('home.hero.location')}</p>
          <p className="text-lg text-slate-700 leading-relaxed">
            {t('home.hero.descriptionBefore')}
            <a
              href="https://gtm-pod.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 hover:text-amber-700 underline underline-offset-2"
            >
              gtm-pod.com
            </a>
            {t('home.hero.descriptionAfter')}
          </p>
          <div className="flex items-center gap-4 pt-1">
            <a href={`mailto:${EMAIL}`} className="text-slate-500 hover:text-amber-600 transition-colors" aria-label="Email">
              <Mail className="w-5 h-5" />
            </a>
            <a href="https://www.linkedin.com/in/jiabinlu/" className="text-slate-500 hover:text-amber-600 transition-colors" aria-label="LinkedIn">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="https://x.com/jiabinlu123" className="text-slate-500 hover:text-amber-600 transition-colors" aria-label="X">
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </header>

        {/* Content archive + subscribe */}
        <section className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-5 space-y-2">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
              {t('home.contentArchive.title')}
            </h2>
            {contentStats && (
              <p className="text-slate-600 text-sm leading-relaxed">
                {t('home.contentArchive.stats')
                  .replace('{total}', String(contentStats.total))
                  .replace('{original}', String(contentStats.originalCount))
                  .replace('{wechat}', String(contentStats.wechatCount))
                  .replace('{start}', String(contentStats.minYear))
                  .replace('{end}', String(contentStats.maxYear))}
              </p>
            )}
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-amber-600 hover:text-amber-700 font-medium text-sm"
            >
              {t('home.contentArchive.viewAll')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-amber-50 border-t border-amber-100 p-5 space-y-3">
            <p className="text-base font-semibold text-slate-800">{t('home.subscribe.headline')}</p>
            <p className="text-sm text-slate-600 -mt-1">{t('home.subscribe.note')}</p>
            <form
              action={BUTTONDOWN.embedAction}
              method="post"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col sm:flex-row gap-2 pt-1"
            >
              <input
                type="email"
                name="email"
                required
                placeholder={t('home.subscribe.placeholder')}
                className="flex-1 px-3 py-2.5 text-sm border border-amber-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-slate-800 placeholder:text-slate-400"
              />
              <input type="hidden" name="embed" value="1" />
              <button
                type="submit"
                className="px-5 py-2.5 text-sm font-semibold bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shrink-0 shadow-sm"
              >
                {t('home.subscribe.button')}
              </button>
            </form>
          </div>
        </section>

        {/* Experience timeline */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            {t('home.experience.title')}
          </h2>
          <ul className="space-y-5">
            {careerTimeline.map((entry) => (
              <li key={`${entry.period}-${entry.company}`} className="text-sm">
                <div className="flex gap-4">
                  <span className="text-slate-400 tabular-nums shrink-0 w-24">{entry.period}</span>
                  <div>
                    <p className="text-slate-800">
                      {entry.role}
                      {' @ '}
                      {entry.href ? (
                        <a href={entry.href} target="_blank" rel="noopener noreferrer" className="hover:text-amber-600 transition-colors">
                          {entry.company}
                        </a>
                      ) : (
                        entry.company
                      )}
                    </p>
                    {entry.note && (
                      <p className="text-slate-500 mt-0.5">{pick(entry.note)}</p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Latest posts */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            {t('home.latest.title')}
          </h2>
          <ul className="space-y-5">
            {latestPosts.map((post) => (
              <li key={post.id}>
                <Link to={`/blog/${post.id}`} className="group block">
                  <p className="text-xs text-slate-400 mb-1">{formatDate(post.date)}</p>
                  <p className="font-medium text-slate-800 group-hover:text-amber-600 transition-colors leading-snug">
                    {post.title}
                  </p>
                  {post.excerpt && (
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{post.excerpt}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/blog" className="text-sm text-amber-600 hover:text-amber-700 font-medium inline-flex items-center gap-1">
            {t('home.latest.viewAll')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        {/* Featured posts */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            {t('home.series.title')}
          </h2>
          <ul className="space-y-5">
            {featuredPosts.map((post) => (
              <li key={post.id}>
                <Link to={`/blog/${post.id}`} className="group block">
                  <p className="text-xs text-slate-400 mb-1">{formatDate(post.date)}</p>
                  <p className="font-medium text-slate-800 group-hover:text-amber-600 transition-colors leading-snug">
                    {post.title}
                  </p>
                  {post.excerpt && (
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{post.excerpt}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <footer className="text-xs text-slate-400 pt-4">
          {t('home.footer.copyright')}
        </footer>
      </div>
    </div>
  );
};

export default Home;
