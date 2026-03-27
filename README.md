# lighthouse-sitemap

Tool to automate Lighthouse scores for each URL in your sitemap. Supports both standard sitemaps and sitemap index files (with `.gz` compressed sub-sitemaps). Uses concurrent worker threads with `chrome-launcher` for fast, parallel testing.

## Requirements

- [Chrome](https://www.google.com/chrome/) installed on your system
- Node.js

The tool auto-detects Chrome from standard install locations. You can also set the `CHROME_PATH` environment variable to specify a custom path.

## Installation

```bash
npm install
```

## Usage

```bash
node index.js <sitemap-url> [concurrency]
```

The optional `concurrency` parameter controls how many Lighthouse tests run in parallel (default: 3). Each worker runs in its own thread with a dedicated Chrome instance. Start with 3-5 and increase based on your system resources:

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

## Resuming after interruption

The tool automatically resumes where it left off. On startup, it reads the existing `output.csv` and skips any URLs that have already been tested. This means you can safely stop the process at any time (Ctrl+C, internet outage, etc.) and re-run the same command to continue:

```bash
# First run — tests 500 URLs, stops at 200 due to an outage
node index.js https://example.com/sitemap/sitemap-index.xml 5

# Second run — picks up at URL 201, skipping the 200 already in output.csv
node index.js https://example.com/sitemap/sitemap-index.xml 5
```

To start fresh, delete `output.csv` before running.
