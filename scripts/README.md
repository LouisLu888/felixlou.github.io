# Blog Publishing Scripts

## Medium Publisher

A command-line tool to publish your blog posts from this site to Medium.

### Setup

1. **Get your Medium Integration Token:**
   - Go to [Medium Settings](https://medium.com/me/settings)
   - Navigate to "Security and apps"
   - Scroll down to "Integration tokens"
   - Generate a new token

2. **Set up the token (optional):**
   ```bash
   export MEDIUM_TOKEN="your-token-here"
   ```
   
   Or you can enter it when prompted by the script.

### Usage

Run the script from the project root:

```bash
node scripts/publish-to-medium.js
```

The script will:
1. Authenticate with your Medium account
2. Show all available blog posts from `public/blog-posts/`
3. Let you select which post to publish
4. Ask for publishing options:
   - Draft or Public status
   - Canonical URL (optional - use if post is originally from your site)
   - Tags (up to 5, comma-separated)
5. Publish to Medium and provide the URL

### Features

- **Interactive CLI**: Easy-to-use command line interface
- **Draft/Public modes**: Choose whether to publish publicly or as a draft
- **Canonical URL support**: Maintain SEO when cross-posting
- **Tag support**: Add up to 5 tags to your Medium post
- **Batch publishing**: Publish multiple posts in one session
- **Automatic attribution**: Adds a link back to your original post if no canonical URL is provided

### Notes

- Medium API only supports creating new posts, not updating existing ones
- Posts are published in Markdown format
- Images should use absolute URLs to work properly on Medium
- The script preserves your original markdown formatting

### Troubleshooting

If you encounter authentication issues:
1. Verify your token is correct
2. Check that your token hasn't expired
3. Ensure you have internet connectivity

For API errors, the script will display detailed error messages to help diagnose the issue.

## Newsletter (Buttondown)

Automatically notify subscribers when a new blog post is published.

### Setup

1. **Get your Buttondown API key**
   - Open [Buttondown Settings → API](https://buttondown.com/settings/api)
   - Create a key with **email** (write) and **sending** permissions

2. **Add GitHub secret** (for CI automation)
   - Repository → Settings → Environments → **github-pages** → Environment secrets
   - Name: `BUTTONDOWN_API_KEY`
   - Value: your API token
   - (Alternatively: Repository → Settings → Secrets and variables → Actions → Repository secrets)

   The workflow uses `environment: github-pages`, so the key must live in that environment (or in repository secrets).

   **Important:** Re-running an old failed job does not pick up workflow fixes. After changing the workflow, use **Actions → Send Newsletter → Run workflow** (manual dispatch) or push a new blog post change.

3. **Manual test in GitHub Actions**
   - Actions → **Send Newsletter** → **Run workflow**
   - Leave **Dry run** checked first to verify the secret is wired correctly
   - Uncheck **Dry run** and run again to send for posts changed in the latest commit

4. **Local testing**
   ```bash
   export BUTTONDOWN_API_KEY="your-token-here"
   npm run send:newsletter -- --dry-run --post whole-engineer
   ```

### Usage

```bash
# Preview what would be sent
npm run send:newsletter -- --dry-run --post my-post-slug

# Send one post manually
npm run send:newsletter -- --post my-post-slug

# List unsent published posts
npm run send:newsletter -- --list

# Resend (ignore sent state)
npm run send:newsletter -- --force --post my-post-slug
```

### Automation

The GitHub Action `.github/workflows/send-newsletter.yml` runs on push to `master` when files under `public/blog-posts/` change. It:

1. Detects which posts changed in the commit
2. Sends a Buttondown email for each new published post (`published: false` is skipped)
3. Records sent slugs in `scripts/.newsletter-sent.json` to avoid duplicates

Subscribe form on the homepage: [buttondown.com/325louis](https://buttondown.com/325louis)