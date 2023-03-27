import fs from 'fs';
import { parseString } from 'xml2js';
import { stringify } from 'csv-stringify';
import lighthouse from 'lighthouse';
import chromeLauncher from 'chrome-launcher';

const output = [];

// this example reads the file synchronously
let xml = fs.readFileSync("sitemap.xml", "utf8");

const createRecords = async input => {
    console.log("Starting Lighthouse Tests");
    for (var i in input) {
        try {
            const chrome = await chromeLauncher.launch({
                chromeFlags: [
                    '--headless',
                    '--no-first-run',
                    '--no-default-browser-check',
                    '--single-process',
                    '--disable-dev-shm-usage',
                    '--disable-full-page-screenshot'
                ]
            });

            const options = {
                //logLevel: 'info',
                port: chrome.port,
                strategy: "mobile",
                onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
            };
            const result = await lighthouse(input[i].url, options);
            const html = result.artifacts.MainDocumentContent;
            var title = html !== null ? html.match(/<title[^>]*>([^<]+)<\/title>/)[1].trim() : "";

            output.push({
                'url': input[i].url,
                'title': title,
                'performance': result.lhr.categories.performance.score ? (result.lhr.categories.performance.score * 100).toFixed(0) : 'NA',
                'accessibility': result.lhr.categories.accessibility.score ? (result.lhr.categories.accessibility.score * 100).toFixed(0) : 'NA',
                'best-practices': result.lhr.categories['best-practices'].score ? (result.lhr.categories['best-practices'].score * 100).toFixed(0) : 'NA',
                'seo': result.lhr.categories.seo.score ? (result.lhr.categories.seo.score * 100).toFixed(0) : 'NA'
            });

            stringify(output, { header: true }, (err, data) => {
                if (err) {
                    console.log(err);
                } else {
                    fs.writeFile('output.csv', data, (err, result) => {
                        if (err) {
                            console.log(err);
                        }
                    });
                }
            });
            process.stdout.write("Record " + output.length + " \r");

            await chrome.kill();
        } catch (error) {
            console.error("Error while testing: " + input[i].url);
        }
    }
    console.log("Success!");
};


parseString(xml, function (err, result) {
    if (err === null) {
        var rows = result.urlset.url;
        var input = rows.map(function (row) {
            return {
                'url': row.loc[0],
                'title': '',
                'performance': '',
                'accessibility': '',
                'best-practices': '',
                'seo': ''
            };
        });
        console.log("Reading Sitemap");
        console.log(input.length + " Records");
        createRecords(input);
    }
    else {
        console.log(err);
    }
});