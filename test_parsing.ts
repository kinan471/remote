import fs from 'fs';
import path from 'path';
import { extractEmbeddedState, extractHepsiburadaNative, extractJsonLd } from './src/lib/scraper-engine/extractors';

const htmlPath = path.join(__dirname, 'firecrawl_dump.html');
const html = fs.readFileSync(htmlPath, 'utf8');

console.log("Loaded HTML of length:", html.length);

console.log("\n--- JSON-LD Test ---");
const jsonLdResult = extractJsonLd(html);
console.log(JSON.stringify(jsonLdResult, null, 2));

console.log("\n--- Embedded State Test ---");
const embeddedResult = extractEmbeddedState(html);
console.log(JSON.stringify(embeddedResult, null, 2));

console.log("\n--- Hepsiburada Native Test ---");
const nativeResult = extractHepsiburadaNative(html);
nativeResult.then(res => {
  console.log(JSON.stringify(res, null, 2));
});
