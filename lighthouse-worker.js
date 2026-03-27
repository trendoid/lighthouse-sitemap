import { parentPort, workerData } from 'node:worker_threads';
import lighthouse from 'lighthouse';
import puppeteer from 'puppeteer';

const { urls } = workerData;

const browser = await puppeteer.launch({
    headless: true,
    args: ['--log-level=3', '--silent-debugger-extension-api']
});

try {
    for (const url of urls) {
        try {
            const page = await browser.newPage();
            const options = {
                formFactor: 'mobile',
                onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
                skipAudits: ['screenshot-thumbnails', 'final-screenshot', 'full-page-screenshot'],
                disableStorageReset: true,
            };
            const result = await lighthouse(url, options, undefined, page);
            const html = result.artifacts.MainDocumentContent;
            const titleMatch = html ? /(<title[^>]*>([^<]+)<\/title>)/.exec(html) : null;
            const title = titleMatch ? titleMatch[2].trim() : '';

            const score = (cat) => cat.score == null ? 'NA' : (cat.score * 100).toFixed(0);
            const cats = result.lhr.categories;
            parentPort.postMessage({
                type: 'result',
                record: {
                    url,
                    title,
                    performance: score(cats.performance),
                    accessibility: score(cats.accessibility),
                    'best-practices': score(cats['best-practices']),
                    seo: score(cats.seo)
                }
            });
        } catch (error) {
            parentPort.postMessage({ type: 'error', url, message: error.message });
        }
    }
} finally {
    await browser.close();
}
