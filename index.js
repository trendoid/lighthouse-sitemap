import fs from 'fs';
import { gunzipSync } from 'node:zlib';
import { Worker } from 'node:worker_threads';
import { parseStringPromise } from 'xml2js';
import { stringify } from 'csv-stringify/sync';

const sitemapUrl = process.argv[2];
const CONCURRENCY = Number.parseInt(process.argv[3], 10) || 3;
if (!sitemapUrl) {
    console.error('Usage: node index.js <sitemap-url> [concurrency]');
    process.exit(1);
}

const output = [];
let completed = 0;

async function fetchXml(url) {
    console.log(`Downloading ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
    }
    if (url.endsWith('.gz')) {
        const buffer = Buffer.from(await response.arrayBuffer());
        return gunzipSync(buffer).toString('utf-8');
    }
    return response.text();
}

function spawnWorker(urls, total) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(new URL('./lighthouse-worker.js', import.meta.url), {
            workerData: { urls }
        });
        worker.on('message', (msg) => {
            if (msg.type === 'result') {
                output.push(msg.record);
                const csv = stringify(output, { header: true });
                fs.writeFileSync('output.csv', csv);
            } else if (msg.type === 'error') {
                console.error(`Error while testing: ${msg.url}`, msg.message);
            }
            completed++;
            process.stdout.write(`Record ${completed}/${total}\r`);
        });
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0) reject(new Error(`Worker exited with code ${code}`));
            else resolve();
        });
    });
}

const createRecords = async (input) => {
    console.log(`Starting Lighthouse Tests (concurrency: ${CONCURRENCY})`);

    const chunks = Array.from({ length: CONCURRENCY }, () => []);
    input.forEach((item, i) => chunks[i % CONCURRENCY].push(item));

    const workers = chunks.map((chunk) =>
        spawnWorker(chunk.map(item => item.url), input.length)
    );
    await Promise.all(workers);

    console.log("\nSuccess!");
};

const xml = await fetchXml(sitemapUrl);

let parsed;
try {
    parsed = await parseStringPromise(xml);
} catch (err) {
    console.error('Failed to parse sitemap XML:', err);
    process.exit(1);
}

let input;

if (parsed.sitemapindex) {
    const sitemaps = parsed.sitemapindex.sitemap;
    console.log(`Found sitemap index with ${sitemaps.length} sub-sitemaps`);

    input = [];
    for (const entry of sitemaps) {
        const subUrl = entry.loc[0];
        try {
            const subXml = await fetchXml(subUrl);
            const subParsed = await parseStringPromise(subXml);
            const urls = subParsed.urlset.url.map(row => ({ url: row.loc[0] }));
            input.push(...urls);
            console.log(`  ${subUrl} — ${urls.length} URLs`);
        } catch (err) {
            console.error(`Failed to process sub-sitemap ${subUrl}:`, err.message);
        }
    }
} else {
    const rows = parsed.urlset.url;
    input = rows.map(row => ({ url: row.loc[0] }));
}

console.log(`Total URLs to test: ${input.length}`);
await createRecords(input);
