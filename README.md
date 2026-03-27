# lighthouse-sitemap

Tool to automate Lighthouse scores for each URL in your sitemap. Supports both standard sitemaps and sitemap index files (with `.gz` compressed sub-sitemaps).

## Requirements

- Chrome
- Node.js

## Installation

```bash
npm install
```

## Usage

```bash
node index.js <sitemap-url> [concurrency]
```

The optional `concurrency` parameter controls how many Lighthouse tests run in parallel (default: 3). Each worker launches its own Chrome instance on a separate debugging port. Lower this if your machine is resource-constrained, or raise it if you have headroom:

```bash
node index.js https://example.com/sitemap.xml 5
```

### Standard sitemap

Pass a direct URL to a `sitemap.xml`:

```bash
node index.js https://example.com/sitemap.xml
```

### Sitemap index (multiple compressed sitemaps)

Pass a URL to a sitemap index file. The tool will automatically detect the index format, download and decompress each `.gz` sub-sitemap, and test all URLs:

```bash
node index.js https://example.com/sitemap/sitemap-index.xml
```

Example sitemap index structure:

```xml
<sitemapindex>
  <sitemap><loc>https://example.com/sitemap/sitemap.gz</loc></sitemap>
  <sitemap><loc>https://example.com/sitemap/sitemap-2.gz</loc></sitemap>
</sitemapindex>
```

## Output

Results are written to `output.csv` with the following columns:

- URL
- Page title
- Performance score
- Accessibility score
- Best practices score
- SEO score

The CSV is updated after each URL is tested, so you can monitor progress in real time.
