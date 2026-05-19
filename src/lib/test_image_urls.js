const https = require('https');

function checkUrl(name, url) {
  https.get(url, (res) => {
    console.log(`${name}: ${res.statusCode} (${url})`);
  }).on('error', (e) => {
    console.log(`${name} error: ${e.message}`);
  });
}

// 1. Test Trendyol mnresize stripping vs resizing
const tyUrl1 = "https://cdn.dsmcdn.com/mnresize/418/627/ty1843/prod/QC_ENRICHMENT/20260320/13/1b0f86b7-97cc-35bf-ae68-bb6129e7647e/1_org_zoom.jpg";
const tyUrlStripped = tyUrl1.replace(/\/mnresize\/\d+\/\d+/, '');
const tyUrlResized = tyUrl1.replace(/\/mnresize\/\d+\/\d+/, '/mnresize/1200/1800');

checkUrl("Trendyol original", tyUrl1);
checkUrl("Trendyol stripped", tyUrlStripped);
checkUrl("Trendyol resized 1200/1800", tyUrlResized);

// 2. Test Amazon suffix stripping
const amzUrl = "https://m.media-amazon.com/images/I/71d-Z-wX81L._AC_SR120,120_.jpg";
const amzUrlStripped = amzUrl.replace(/\._AC_SR\d+,\d+_/, '');
const amzUrlStrippedGeneric = amzUrl.replace(/\._AC_[A-Z0-9_,]+\./, '.');
const amzUrlSL1500 = amzUrl.replace(/\._AC_SR\d+,\d+_/, '._SL1500_');

checkUrl("Amazon original", amzUrl);
checkUrl("Amazon stripped specific", amzUrlStripped);
checkUrl("Amazon stripped generic", amzUrlStrippedGeneric);
checkUrl("Amazon SL1500", amzUrlSL1500);
