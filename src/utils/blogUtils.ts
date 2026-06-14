import matter from 'gray-matter';
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

export async function getAllBlogPosts(): Promise<BlogPostMeta[]> {
  const posts: BlogPostMeta[] = [];
  
  for (const fileName of BLOG_POST_FILES) {
    try {
      console.log(`Attempting to fetch: /blog-posts/${fileName}`);
      const response = await fetch(`/blog-posts/${fileName}`);
      console.log(`Response status for ${fileName}:`, response.status);
      
      if (response.ok) {
        const markdown = await response.text();
        const { data } = matter(markdown);
        
        const id = fileName.replace('.md', '');
        posts.push({
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
        });
        console.log(`Successfully loaded blog post: ${id}`);
      } else {
        console.error(`Failed to load ${fileName}: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error loading blog post ${fileName}:`, error);
    }
  }
  
  console.log(`Total posts loaded: ${posts.length}`);
  // Sort by date (newest first)
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getBlogPost(id: string): Promise<BlogPost | null> {
  try {
    const fileName = `${id}.md`;
    const response = await fetch(`/blog-posts/${fileName}`);
    
    if (!response.ok) {
      return null;
    }
    
    const markdown = await response.text();
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
