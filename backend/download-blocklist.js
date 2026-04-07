const fs = require('fs');
const https = require('https');

const languages = ['en', 'es', 'fr', 'de', 'hi', 'it', 'ru', 'pt', 'zh', 'ja', 'ko', 'ar', 'nl', 'tr', 'pl', 'sv', 'fi', 'da', 'no', 'cs', 'hu', 'ro', 'el', 'th', 'vi', 'id'];
const customWords = [
  'mc', 'bc', 'bkl', 'lodu', 'chutiya', 'madarchod', 'behenchod', 'randi', 
  'harami', 'gaandu', 'bhosdi', 'lavde', 'saala', 'kutte', 'sule', 'maga', 
  'haramkhor', 'laude'
];
let allWords = new Set(customWords);

async function fetchList(lang) {
  return new Promise((resolve) => {
    https.get(`https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master/${lang}`, (res) => {
      if (res.statusCode !== 200) { resolve(''); return; }
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

(async () => {
  console.log('Downloading international profanity lists...');
  for (const lang of languages) {
    const text = await fetchList(lang);
    if (text) {
      text.split('\n').map(w => w.trim().toLowerCase()).filter(w => w.length > 2).forEach(w => allWords.add(w));
    }
  }
  
  const wordsArray = Array.from(allWords);
  const fileContent = `// Auto-generated comprehensive blocklist (${wordsArray.length} words)\nexport const BLOCKLIST_WORDS = [\n  ${wordsArray.map(w => `'${w.replace(/'/g, "\\'")}'`).join(',\n  ')}\n];\n`;
  
  fs.writeFileSync('./src/utils/blocklist.ts', fileContent);
  fs.writeFileSync('../src/lib/blocklist.ts', fileContent);
  console.log('Successfully generated extensive blocklist with ' + wordsArray.length + ' words');
})();
