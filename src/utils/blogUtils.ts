import { BLOG_POST_FILES } from '../config/blogPosts';

export interface BlogPost {
  id: string;
  title: string;
  date: string;
  readTime: string;
  category: string;
  excerpt: string;
  published: boolean;
  source?: string;
  series?: string;
  seriesPart?: number;
  seriesTitle?: string;
  content: string;
}

export interface BlogPostMeta {
  id: string;
  title: string;
  date: string;
  readTime: string;
  category: string;
  excerpt: string;
  published: boolean;
  source?: string;
  series?: string;
  seriesPart?: number;
  seriesTitle?: string;
}

const BLOG_INDEX_PATH = '/blog-posts/index.json';
let blogPostMetaCache: BlogPostMeta[] | null = null;

function sortPostsByDateDesc(posts: BlogPostMeta[]): BlogPostMeta[] {
  return [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function metaFromFrontmatter(fileName: string, data: Record<string, unknown>): BlogPostMeta {
  return {
    id: fileName.replace('.md', ''),
    title: typeof data.title === 'string' ? data.title : 'Untitled',
    date: typeof data.date === 'string' ? data.date : new Date().toISOString().split('T')[0],
    readTime: typeof data.readTime === 'string' ? data.readTime : '5 min read',
    category: typeof data.category === 'string' ? data.category : 'General',
    excerpt: typeof data.excerpt === 'string' ? data.excerpt : '',
    published: typeof data.published === 'boolean' ? data.published : false,
    source: typeof data.source === 'string' ? data.source : undefined,
    series: typeof data.series === 'string' ? data.series : undefined,
    seriesPart: data.seriesPart != null ? Number(data.seriesPart) : undefined,
    seriesTitle: typeof data.seriesTitle === 'string' ? data.seriesTitle : undefined,
  };
}

export async function getAllBlogPosts(): Promise<BlogPostMeta[]> {
  if (blogPostMetaCache) {
    return blogPostMetaCache;
  }

  if (import.meta.env.MODE === 'production') {
    try {
      const response = await fetch(BLOG_INDEX_PATH);
      if (response.ok) {
        const posts = (await response.json()) as BlogPostMeta[];
        blogPostMetaCache = sortPostsByDateDesc(posts);
        return blogPostMetaCache;
      }
    } catch (error) {
      console.warn('Falling back to markdown blog metadata loading:', error);
    }
  }

  const posts: BlogPostMeta[] = [];
  const matter = (await import('gray-matter')).default;
  
  for (const fileName of BLOG_POST_FILES) {
    try {
      const response = await fetch(`/blog-posts/${fileName}`);
      
      if (response.ok) {
        const markdown = await response.text();
        const { data } = matter(markdown);
        posts.push(metaFromFrontmatter(fileName, data));
      } else {
        console.error(`Failed to load ${fileName}: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error loading blog post ${fileName}:`, error);
    }
  }
  
  blogPostMetaCache = sortPostsByDateDesc(posts);
  return blogPostMetaCache;
}

export async function getBlogPost(id: string): Promise<BlogPost | null> {
  try {
    const fileName = `${id}.md`;
    const response = await fetch(`/blog-posts/${fileName}`);
    
    if (!response.ok) {
      return null;
    }
    
    const markdown = await response.text();
    const matter = (await import('gray-matter')).default;
    const { data, content } = matter(markdown);
    
    return {
      id,
      title: data.title || 'Untitled',
      date: data.date || new Date().toISOString().split('T')[0],
      readTime: data.readTime || '5 min read',
      category: data.category || 'General',
      excerpt: data.excerpt || '',
      published: data.published ?? false,
      source: data.source,
      series: data.series,
      seriesPart: data.seriesPart ? Number(data.seriesPart) : undefined,
      seriesTitle: data.seriesTitle,
      content
    };
  } catch (error) {
    console.error(`Error loading blog post ${id}:`, error);
    return null;
  }
}

export function getPublishedPosts(posts: BlogPostMeta[]): BlogPostMeta[] {
  return posts.filter(post => post.published);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export async function getAdjacentPosts(currentId: string): Promise<{ prev: BlogPostMeta | null; next: BlogPostMeta | null }> {
  const allPosts = await getAllBlogPosts();
  const publishedPosts = import.meta.env.MODE === 'production' 
    ? getPublishedPosts(allPosts)
    : allPosts;
  
  const sortedPosts = publishedPosts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const currentIndex = sortedPosts.findIndex(post => post.id === currentId);
  
  if (currentIndex === -1) {
    return { prev: null, next: null };
  }
  
  const prevPost = currentIndex > 0 ? sortedPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < sortedPosts.length - 1 ? sortedPosts[currentIndex + 1] : null;
  
  return { prev: prevPost, next: nextPost };
}

export async function getSeriesAdjacentPosts(
  currentId: string,
  seriesId: string,
  seriesPart?: number
): Promise<{ prev: BlogPostMeta | null; next: BlogPostMeta | null }> {
  const allPosts = await getAllBlogPosts();
  const publishedPosts = import.meta.env.MODE === 'production'
    ? getPublishedPosts(allPosts)
    : allPosts;

  const seriesPosts = publishedPosts
    .filter((post) => post.series === seriesId)
    .sort((a, b) => (a.seriesPart ?? 0) - (b.seriesPart ?? 0));

  if (seriesPosts.length === 0) {
    return { prev: null, next: null };
  }

  const currentIndex = seriesPart != null
    ? seriesPosts.findIndex((post) => post.seriesPart === seriesPart)
    : seriesPosts.findIndex((post) => post.id === currentId);

  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: currentIndex > 0 ? seriesPosts[currentIndex - 1] : null,
    next: currentIndex < seriesPosts.length - 1 ? seriesPosts[currentIndex + 1] : null,
  };
}
