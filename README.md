# Jiabin Lu - Personal Website

A thoughtful tech leader's personal website built with React, TypeScript, and Tailwind CSS.

## Features

- Personal introduction and journey
- Core beliefs and philosophy
- Favorite books with insights
- 1:1 consultation booking system
- Responsive design with modern aesthetics

## Publishing a Blog Post

Add the markdown file to `public/blog-posts/`, register it in `src/config/blogPosts.js`, run
`npm run build`, then commit and push.

**Pushing a change under `public/blog-posts/` emails all newsletter subscribers automatically**
(GitHub Action `.github/workflows/send-newsletter.yml` → Buttondown). To publish silently, put
`[skip-newsletter]` in the commit message:

```bash
git commit -m "Add post: my new post [skip-newsletter]"
```

Full newsletter docs: [`scripts/README.md`](scripts/README.md#newsletter-buttondown).

## GitHub Pages Deployment

This project is configured for easy deployment to GitHub Pages:

### Option 1: Automatic Deployment (Recommended)

1. Fork or clone this repository to your GitHub account
2. Go to your repository settings
3. Navigate to "Pages" in the left sidebar
4. Under "Source", select "GitHub Actions"
5. Push any changes to the `main` branch - the site will automatically build and deploy

### Option 2: Manual Deployment

1. Clone the repository locally
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the project
4. The built files will be in the `docs` folder
5. Push the `docs` folder to your repository
6. In GitHub repository settings > Pages, set source to "Deploy from a branch" and select `main` branch with `/docs` folder

### Important: Preserve the `.nojekyll` File

**⚠️ DO NOT DELETE the `.nojekyll` file!** 

The `.nojekyll` file in the `docs` folder is essential for GitHub Pages to work correctly with this React SPA setup. This file tells GitHub Pages:

- **Not to process the site with Jekyll** (GitHub's default static site generator)
- **To serve files with underscores** (like `_next`, `_app`, etc.)
- **To handle client-side routing properly** with the 404.html redirect

If you delete this file, you may experience:
- 404 errors on direct URL access
- Broken asset loading
- Routing issues with React Router

The `.nojekyll` file is automatically created during the build process and should be preserved in your repository.

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Customization

To customize this website for your own use:

1. Update the content in `src/App.tsx`:
   - Change the name, title, and description
   - Update the journey/about section
   - Modify the core beliefs
   - Replace the favorite books
   - Update contact information and social links

2. Update the HTML title and meta description in `index.html`

3. Replace the avatar initials or add your own profile image

## Technologies Used

- React 18
- TypeScript
- Tailwind CSS
- Vite
- Lucide React (for icons)

## License

This project is open source and available under the MIT License.