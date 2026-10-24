#!/usr/bin/env node
'use strict';

/**
 * MLBB official-source hero image collector
 *
 * Reads the project's master list at ./assets/heroes.js and downloads each
 * hero's icon/portrait from Moonton's GMS endpoint into ./assets/HEROES/.
 *
 * Default output matches each hero's `imageFile` field in heroes.js.
 * Optional splash images are saved as <hero-id>-splash.<ext>.
 *
 * No npm dependencies required. Node.js 18+ recommended.
 *
 * Usage:
 *   node download-hero-images.js
 *   node download-hero-images.js --force
 *   node download-hero-images.js --splash
 *   node download-hero-images.js --check
 *
 * Note: This uses an undocumented endpoint identified by a community scraper;
 * it may change or restrict requests. It is not an official Moonton SDK.
 */

const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const http = require('node:http');

const ROOT = process.cwd();
const HEROES_JS = path.join(ROOT, 'assets', 'heroes.js');
const ASSET_DIR = path.join(ROOT, 'assets', 'HEROES');
const REPORT_PATH = path.join(ROOT, 'hero-assets-report.json');
const MANIFEST_PATH = path.join(ROOT, 'hero-assets-manifest.json');

// Public Moonton GMS data endpoint observed by community tooling.
// The API is undocumented and may change.
const API_URL = 'https://api.gms.moontontech.com/api/gms/source/2669606/2756564';

const args = new Set(process.argv.slice(2));
const FORCE = args.has('--force');
const INCLUDE_SPLASH = args.has('--splash');
const CHECK_ONLY = args.has('--check');
const CONCURRENCY = 4;
const REQUEST_TIMEOUT_MS = 20000;
const MAX_REDIRECTS = 5;

function log(message) {
  process.stdout.write(`${message}\n`);
}

function fail(message) {
  console.error(`\n[ERROR] ${message}`);
  process.exitCode = 1;
}

function safeName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '');
}

function cleanFileName(value) {
  const basename = path.basename(String(value || ''));
  return basename.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
}

function getExtensionFromUrl(url, contentType = '') {
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname).toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.webp', '.avif'].includes(ext)) return ext;
  } catch (_) {}

  const mime = String(contentType).split(';')[0].trim().toLowerCase();
  const map = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
    'image/avif': '.avif'
  };
  return map[mime] || '.png';
}

function getHeroList() {
  if (!fs.existsSync(HEROES_JS)) {
    throw new Error(
      `Cannot find ${path.relative(ROOT, HEROES_JS)}. Put your master heroes.js at assets/heroes.js.`
    );
  }

  // The generated heroes.js exports heroList for Node.
  delete require.cache[require.resolve(HEROES_JS)];
  const data = require(HEROES_JS);
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('assets/heroes.js must export a non-empty heroList array via module.exports.');
  }
  return data;
}

function requestJson(url, payload, redirects = 0) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const body = JSON.stringify(payload);
    const transport = parsed.protocol === 'http:' ? http : https;

    const req = transport.request({
      hostname: parsed.hostname,
      port: parsed.port || undefined,
      path: `${parsed.pathname}${parsed.search}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'Mozilla/5.0 MLBB-Hero-Asset-Collector/1.0'
      },
      timeout: REQUEST_TIMEOUT_MS
    }, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        if (redirects >= MAX_REDIRECTS) return reject(new Error('Too many API redirects'));
        const nextUrl = new URL(res.headers.location, url).toString();
        return requestJson(nextUrl, payload, redirects + 1).then(resolve, reject);
      }

      let text = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { text += chunk; });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`Moonton API returned HTTP ${res.statusCode}: ${text.slice(0, 180)}`));
        }
        try {
          resolve(JSON.parse(text));
        } catch (_) {
          reject(new Error(`API response was not JSON: ${text.slice(0, 180)}`));
        }
      });
    });

    req.on('timeout', () => req.destroy(new Error('API request timed out')));
    req.on('error', reject);
    req.end(body);
  });
}

function downloadTo(url, requestedPath, redirects = 0) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const transport = parsed.protocol === 'http:' ? http : https;

    const req = transport.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 MLBB-Hero-Asset-Collector/1.0' },
      timeout: REQUEST_TIMEOUT_MS
    }, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        if (redirects >= MAX_REDIRECTS) return reject(new Error('Too many image redirects'));
        return downloadTo(new URL(res.headers.location, url).toString(), requestedPath, redirects + 1)
          .then(resolve, reject);
      }

      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume();
        return reject(new Error(`Image returned HTTP ${res.statusCode}`));
      }

      const contentType = String(res.headers['content-type'] || '').toLowerCase();
      if (contentType && !contentType.startsWith('image/')) {
        res.resume();
        return reject(new Error(`Expected image but received ${contentType}`));
      }

      const extFromUrl = getExtensionFromUrl(url, contentType);
      const expectedExt = path.extname(requestedPath).toLowerCase();
      const destination = expectedExt ? requestedPath : `${requestedPath}${extFromUrl}`;

      fs.mkdirSync(path.dirname(destination), { recursive: true });
      const tempPath = `${destination}.part`;
      const output = fs.createWriteStream(tempPath);
      res.pipe(output);

      output.on('finish', () => {
        output.close(() => {
          try {
            const stat = fs.statSync(tempPath);
            if (!stat.size) {
              fs.unlinkSync(tempPath);
              return reject(new Error('Downloaded file is empty'));
            }
            fs.renameSync(tempPath, destination);
            resolve({ path: destination, bytes: stat.size, contentType, actualExtension: extFromUrl });
          } catch (err) {
            reject(err);
          }
        });
      });

      output.on('error', err => {
        res.destroy();
        try { fs.unlinkSync(tempPath); } catch (_) {}
        reject(err);
      });
    });

    req.on('timeout', () => req.destroy(new Error('Image request timed out')));
    req.on('error', reject);
  });
}

function extractApiHeroes(response) {
  const records = response?.data?.records;
  if (!Array.isArray(records)) {
    throw new Error('Unexpected API response: data.records was not an array.');
  }

  return records.map(record => {
    const raw = record?.data || {};
    const nested = raw?.hero?.data;
    const hero = nested && typeof nested === 'object' ? nested : raw;
    const name = hero.name || raw.name || `Hero_${raw.hero_id || hero.heroid || 'unknown'}`;
    const imageUrl = hero.smallmap || hero.head || hero.avatar || '';
    const splashUrl = raw.painting || hero.painting || hero.bigmap || '';
    return {
      apiId: raw.hero_id || hero.heroid || hero.hero_id || null,
      name: String(name).trim(),
      normalizedName: safeName(name),
      imageUrl,
      splashUrl,
      roles: Array.isArray(hero.sortlabel) ? hero.sortlabel : []
    };
  }).filter(hero => hero.name);
}

const ALIASES = new Map([
  ['popolandkupa', 'popolandkupa'],
  ['yisunshin', 'yisunshin'],
  ['xborg', 'xborg'],
  ['lapulapu', 'lapulapu'],
  ['chang e', 'change']
]);

function findApiHero(hero, apiHeroes) {
  const key = safeName(hero.name || hero.id);
  const alias = ALIASES.get(key) || key;
  return apiHeroes.find(item => item.normalizedName === alias)
    || apiHeroes.find(item => item.normalizedName === safeName(hero.id))
    || null;
}

async function runPool(items, worker, concurrency) {
  let cursor = 0;
  let finished = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      await worker(items[index], index);
      finished++;
      if (finished % 10 === 0 || finished === items.length) {
        log(`[Progress] ${finished}/${items.length}`);
      }
    }
  });
  await Promise.all(workers);
}

async function main() {
  fs.mkdirSync(ASSET_DIR, { recursive: true });
  const heroes = getHeroList();

  log(`Master roster: ${heroes.length} heroes`);
  log('Requesting hero image metadata from the Moonton GMS endpoint...');

  const response = await requestJson(API_URL, {
    pageSize: 200,
    pageIndex: 1,
    filters: [],
    sorts: [{ data: { field: 'hero_id', order: 'desc' }, type: 'sequence' }],
    fields: [],
    object: []
  });

  const apiHeroes = extractApiHeroes(response);
  log(`API returned ${apiHeroes.length} hero records.`);

  const manifest = [];
  const report = {
    generatedAt: new Date().toISOString(),
    source: 'Moonton GMS API endpoint (undocumented; may change)',
    masterHeroCount: heroes.length,
    apiHeroCount: apiHeroes.length,
    downloaded: [],
    alreadyPresent: [],
    failed: [],
    unmatchedHeroes: [],
    missingAfterRun: []
  };

  const tasks = [];
  for (const hero of heroes) {
    const id = String(hero.id || safeName(hero.name));
    const name = String(hero.name || id);
    const filename = cleanFileName(hero.imageFile || `${id}.png`);
    const destination = path.join(ASSET_DIR, filename);
    const apiHero = findApiHero(hero, apiHeroes);

    const row = {
      id, name,
      imageFile: filename,
      localPath: path.relative(ROOT, destination).replace(/\\/g, '/'),
      sourceName: apiHero?.name || null,
      sourceUrl: apiHero?.imageUrl || null,
      status: 'pending'
    };

    if (!apiHero) {
      row.status = 'unmatched';
      report.unmatchedHeroes.push({ id, name });
      manifest.push(row);
      continue;
    }

    if (!apiHero.imageUrl) {
      row.status = 'no-image-url';
      report.failed.push({ id, name, reason: 'No image URL in API record' });
      manifest.push(row);
      continue;
    }

    if (fs.existsSync(destination) && fs.statSync(destination).size > 0 && !FORCE) {
      row.status = 'already-present';
      report.alreadyPresent.push({ id, name, file: row.localPath });
    } else if (!CHECK_ONLY) {
      tasks.push({ hero, apiHero, row, destination });
    } else {
      row.status = 'missing';
      report.missingAfterRun.push({ id, name, file: row.localPath });
    }

    if (INCLUDE_SPLASH && apiHero.splashUrl) {
      const ext = getExtensionFromUrl(apiHero.splashUrl);
      row.splashImageFile = `${id}-splash${ext}`;
      row.splashSourceUrl = apiHero.splashUrl;
    } else if (INCLUDE_SPLASH) {
      row.splashStatus = 'no-splash-url';
    }
    manifest.push(row);
  }

  if (!CHECK_ONLY) {
    log(`Downloading ${tasks.length} missing/forced hero portraits into assets/HEROES/...`);
    await runPool(tasks, async task => {
      const { hero, apiHero, row, destination } = task;
      try {
        const result = await downloadTo(apiHero.imageUrl, destination);
        row.status = 'downloaded';
        row.bytes = result.bytes;
        row.contentType = result.contentType;
        report.downloaded.push({ id: row.id, name: row.name, file: row.localPath, bytes: result.bytes });
      } catch (error) {
        row.status = 'failed';
        row.error = error.message;
        report.failed.push({ id: row.id, name: row.name, file: row.localPath, reason: error.message });
        console.error(`[Failed] ${row.name}: ${error.message}`);
      }
    }, CONCURRENCY);

    if (INCLUDE_SPLASH) {
      const splashTasks = manifest.filter(row => row.splashSourceUrl && row.splashImageFile);
      log(`Downloading ${splashTasks.length} optional splash images...`);
      await runPool(splashTasks, async row => {
        try {
          const destination = path.join(ASSET_DIR, row.splashImageFile);
          if (fs.existsSync(destination) && fs.statSync(destination).size > 0 && !FORCE) {
            row.splashStatus = 'already-present';
            return;
          }
          const result = await downloadTo(row.splashSourceUrl, destination);
          row.splashStatus = 'downloaded';
          row.splashBytes = result.bytes;
        } catch (error) {
          row.splashStatus = 'failed';
          row.splashError = error.message;
          report.failed.push({ id: row.id, name: row.name, file: row.splashImageFile, reason: error.message });
        }
      }, CONCURRENCY);
    }
  }

  // Final missing-file audit always checks actual disk state.
  for (const row of manifest) {
    const actual = path.join(ROOT, row.localPath);
    if (!fs.existsSync(actual) || fs.statSync(actual).size === 0) {
      if (!report.missingAfterRun.some(item => item.id === row.id)) {
        report.missingAfterRun.push({ id: row.id, name: row.name, file: row.localPath, status: row.status });
      }
    }
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n', 'utf8');

  log('\n=== Asset audit ===');
  log(`Roster heroes:       ${report.masterHeroCount}`);
  log(`API heroes:          ${report.apiHeroCount}`);
  log(`Downloaded:          ${report.downloaded.length}`);
  log(`Already present:     ${report.alreadyPresent.length}`);
  log(`Unmatched heroes:    ${report.unmatchedHeroes.length}`);
  log(`Failed downloads:    ${report.failed.length}`);
  log(`Missing image files: ${report.missingAfterRun.length}`);
  log(`Report:   ${path.relative(ROOT, REPORT_PATH)}`);
  log(`Manifest: ${path.relative(ROOT, MANIFEST_PATH)}`);

  if (report.unmatchedHeroes.length) {
    log('\nHeroes not matched to the official API list:');
    report.unmatchedHeroes.forEach(hero => log(` - ${hero.name} (${hero.id})`));
  }
  if (report.missingAfterRun.length) {
    log('\nMissing image files:');
    report.missingAfterRun.forEach(hero => log(` - ${hero.name}: ${hero.file}`));
  }

  if (report.failed.length || report.unmatchedHeroes.length || report.missingAfterRun.length) {
    process.exitCode = 2;
  }
}

main().catch(error => fail(error.message));
