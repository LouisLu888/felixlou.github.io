# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Common Development Commands

### Development Server
```bash
npm run dev        # Start Vite development server on http://localhost:5173
```

### Build and Production
```bash
npm run build      # Build for production (outputs to 'docs' folder for GitHub Pages)
npm run preview    # Preview production build locally
```

### Code Quality
```bash
npm run lint       # Run ESLint for code quality checks
```

## Project Architecture

This is a personal website/blog built with React, TypeScript, and Tailwind CSS, deployed via GitHub Pages.

### Key Architecture Patterns

**Blog System**: Uses markdown files in `public/blog-posts/` with frontmatter parsing via gray-matter. Posts are fetched client-side and rendered with react-markdown.

**Blog Post Management**: 
- Blog post files must be manually added to the `BLOG_POST_FILES` array in `src/utils/blogUtils.ts:25-32` when creating new posts
- Posts support frontmatter with: title, date, readTime, category, excerpt, published
- Development shows all posts; production filters to published only

**Routing Structure**:
- `/` - Home page with personal introduction
- `/blog` - Blog post listing 
- `/blog/:id` - Individual blog post (id matches filename without .md)

### File Structure
```
src/
├── components/           # React components
│   ├── Navigation.tsx    # Main navigation bar
│   ├── Home.tsx         # Homepage content
│   ├── BlogList.tsx     # Blog listing page
│   └── BlogPost.tsx     # Individual blog post viewer
├── utils/
│   └── blogUtils.ts     # Blog post fetching and utilities
└── styles/
    └── highlight.css    # Syntax highlighting styles
```

### Styling
- Uses Tailwind CSS with typography plugin for markdown rendering
- Custom highlight.css for code syntax highlighting via rehype-highlight
- Responsive design with mobile-first approach

### GitHub Pages Deployment
- Builds to `docs/` folder (configured in vite.config.ts)
- Base URL set to `/` for user GitHub Pages sites
- Manual deployment: build then push docs folder

## Git Workflow Notes

**Important**: This project has specific git workflow rules defined in .cursorrules:
- Do NOT automatically commit or push changes
- Always ask user before git operations  
- Let user handle git operations manually
- Only suggest commit messages, don't execute them

## Development Notes

- TypeScript configuration includes strict mode
- ESLint configured for React hooks and TypeScript
- Vite optimizations exclude lucide-react from pre-bundling
- Uses client-side routing with React Router DOM