import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { getBlogPost, formatDate, getAdjacentPosts, getSeriesAdjacentPosts, type BlogPost as BlogPostType, type BlogPostMeta } from '../utils/blogUtils';
import { useLanguage } from '../contexts/LanguageContext';
import BlogImage from './BlogImage';
import SubscribeCTA from './SubscribeCTA';

const BlogPost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [adjacentPosts, setAdjacentPosts] = useState<{ prev: BlogPostMeta | null; next: BlogPostMeta | null }>({ prev: null, next: null });
  const [seriesPosts, setSeriesPosts] = useState<{ prev: BlogPostMeta | null; next: BlogPostMeta | null }>({ prev: null, next: null });
  const { t } = useLanguage();
  
  // Comment state
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState({
    author: '',
    email: '',
    website: '',
    content: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadPost() {
      if (!id) {
        setError(true);
        setLoading(false);
        return;
      }

      try {
        const blogPost = await getBlogPost(id);
        setPost(blogPost);
        setError(!blogPost);
        
        if (blogPost) {
          const adjacent = await getAdjacentPosts(id);
          setAdjacentPosts(adjacent);

          if (blogPost.series) {
            const seriesAdjacent = await getSeriesAdjacentPosts(id, blogPost.series, blogPost.seriesPart);
            setSeriesPosts(seriesAdjacent);
          } else {
            setSeriesPosts({ prev: null, next: null });
          }
        }
      } catch (err) {
        setError(true);
        console.error('Error loading blog post:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPost();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded mb-4"></div>
            <div className="h-12 bg-slate-200 rounded mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-slate-200 rounded"></div>
              <div className="h-4 bg-slate-200 rounded"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">{t('blog.postNotFound')}</h1>
          <p className="text-slate-600 mb-8">{t('blog.postNotFoundDesc')}</p>
          <Link 
            to="/blog" 
            className="inline-flex items-center text-amber-600 hover:text-amber-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('blog.backToBlog')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-32 pb-20">
      <article className="max-w-4xl mx-auto px-6">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link 
            to="/blog" 
            className="inline-flex items-center text-slate-600 hover:text-amber-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('blog.backToBlog')}
          </Link>
        </div>

        {/* Article Header */}
        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 mb-4">
            <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-medium">
              {post.category}
            </span>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>{formatDate(post.date)}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span>{post.readTime}</span>
            </div>
            {post.source && (
              <span className="text-slate-400">来源：{post.source}</span>
            )}
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 leading-tight">
            {post.title}
          </h1>
        </header>

        {/* Article Content */}
        <div className="prose prose-lg prose-slate max-w-none
                       prose-headings:text-slate-800 prose-headings:font-bold
                       prose-p:text-slate-600 prose-p:leading-relaxed
                       prose-ul:text-slate-600 prose-li:text-slate-600
                       prose-a:text-amber-600 prose-a:no-underline hover:prose-a:text-amber-700
                       prose-code:text-amber-600 prose-code:bg-amber-50 prose-code:px-1 prose-code:rounded
                       prose-pre:bg-slate-50 prose-pre:border
                       prose-strong:text-slate-800 prose-strong:font-bold">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              img: ({ src, alt, title, ...props }) => {
                if (!src) return null;
                
                // Check if the image has a caption (title attribute)
                const caption = title || '';
                
                return (
                  <BlogImage
                    src={src}
                    alt={alt || ''}
                    caption={caption}
                    {...props}
                  />
                );
              }
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        <SubscribeCTA className="mt-16 pt-8 border-t border-slate-100" />

        {/* Author Note */}
        <div className="mt-16 p-6 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-lg">
              <img 
                src="/profile.jpg" 
                alt="Jiabin Lu Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">Jiabin Lu</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {t('blog.author.description')}
              </p>
              <div className="flex space-x-4 mt-3">
                <a 
                  href="https://www.linkedin.com/in/jiabinlu/" 
                  className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </a>
                <a 
                  href="https://x.com/jiabinlu123" 
                  className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  X.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Series Navigation */}
        {post.series && (
          <div className="mt-12 p-5 border border-amber-200 bg-amber-50/50 rounded-xl">
            <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-3">
              {t('blog.seriesNav')}
              {post.seriesTitle && ` · ${post.seriesTitle}`}
              {post.seriesPart != null && (
                <span className="normal-case ml-1">
                  ({t('blog.seriesPart').replace('{part}', String(post.seriesPart))})
                </span>
              )}
            </p>
            <div className="flex justify-between items-start gap-4 text-sm">
              {seriesPosts.prev ? (
                <Link to={`/blog/${seriesPosts.prev.id}`} className="flex-1 text-slate-700 hover:text-amber-700 transition-colors">
                  ← {seriesPosts.prev.title}
                </Link>
              ) : (
                <span className="flex-1 text-slate-400">—</span>
              )}
              {seriesPosts.next ? (
                <Link to={`/blog/${seriesPosts.next.id}`} className="flex-1 text-right text-slate-700 hover:text-amber-700 transition-colors">
                  {seriesPosts.next.title} →
                </Link>
              ) : (
                <span className="flex-1 text-right text-slate-400">—</span>
              )}
            </div>
          </div>
        )}

        {/* Post Navigation */}
        <div className="mt-16 border-t pt-8">
          <div className="flex justify-between items-start gap-4">
            {/* Previous Post */}
            {adjacentPosts.prev ? (
              <Link
                to={`/blog/${adjacentPosts.prev.id}`}
                className="flex-1 group flex items-start space-x-3 p-4 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-amber-600 transition-colors mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">{t('blog.previousPost')}</p>
                  <p className="font-medium text-slate-800 group-hover:text-amber-600 transition-colors line-clamp-2">
                    {adjacentPosts.prev.title}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="flex-1"></div>
            )}

            {/* Next Post */}
            {adjacentPosts.next ? (
              <Link
                to={`/blog/${adjacentPosts.next.id}`}
                className="flex-1 group flex items-start space-x-3 p-4 rounded-lg hover:bg-slate-50 transition-colors text-right"
              >
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">{t('blog.nextPost')}</p>
                  <p className="font-medium text-slate-800 group-hover:text-amber-600 transition-colors line-clamp-2">
                    {adjacentPosts.next.title}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 transition-colors mt-1 flex-shrink-0" />
              </Link>
            ) : (
              <div className="flex-1"></div>
            )}
          </div>
        </div>

        {/* Back to Blog */}
        <div className="mt-12 text-center">
          <Link 
            to="/blog" 
            className="inline-flex items-center bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('blog.readMoreArticles')}
          </Link>
        </div>
      </article>
    </div>
  );
};

export default BlogPost; 