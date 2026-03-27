import { parentPort, workerData } from 'node:worker_threads';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';

const { urls, chromePath } = workerData;

const chrome = await launch({
    chromePath,
    chromeFlags: [
        '--headless',
        '--log-level=3',
        '--silent-debugger-extension-api',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-sync',
        '--no-first-run',
        '--disable-translate',
    ]
});

try {
    for (const url of urls) {
        try {
            const options = {
                port: chrome.port,
                formFactor: 'mobile',
                onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
                skipAudits: ['screenshot-thumbnails', 'final-screenshot', 'full-page-screenshot'],
                disableStorageReset: true,
            };
            const result = await lighthouse(url, options);
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
    chrome.kill();
}
