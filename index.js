import fs from 'fs';
import { parseString } from 'xml2js';
import { stringify } from 'csv-stringify';
import lighthouse from 'lighthouse';
import puppeteer from 'puppeteer';

const output = [];

// this example reads the file synchronously
let xml = fs.readFileSync("sitemap.xml", "utf8");

const createRecords = async input => {
    console.log("Starting Lighthouse Tests");
    for (let i in input) {
        const PORT = 8041;
        const browser = await puppeteer.launch({
            headless: true,
            args: [`--remote-debugging-port=${PORT}`]
        });
        try {
            const options = {
                //logLevel: 'info',
                port: PORT,
                strategy: "mobile",
                onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
            };
            const result = await lighthouse(input[i].url, options);
            const html = result.artifacts.MainDocumentContent;
            let title = html !== null ? html.match(/<title[^>]*>([^<]+)<\/title>/)[1].trim() : "";

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

        } catch (error) {
            console.error("Error while testing: " + input[i].url);
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }
    console.log("Success!");
};


parseString(xml, function (err, result) {
    if (err === null) {
        let rows = result.urlset.url;
        let input = rows.map(function (row) {
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