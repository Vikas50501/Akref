// Structural + deep static QA for the AKINNA theme (no Shopify CLI required).
// Phase 10 QA harness. Run: node .qa-validate.mjs
//
// Checks:
//  1. Template/section-group/config/locale JSON parses.
//  2. Template & group section "type"s resolve to a sections/<type>.liquid file.
//  3. Section {% schema %} blocks are valid JSON.
//  4. {% render/include 'x' %} snippets and {{ 'x' | asset_url }} assets exist.
//  5. Every {{ 'key' | t }} translation key resolves in locales/en.default.json.
//  6. Liquid block tags are balanced (if/for/case/style/schema/...).
//  7. Template block "type"s resolve to a block type declared in the section schema
//     (or a known dynamic type: @app / @theme / local block file).
//  8. settings_data.json setting keys resolve to settings_schema.json ids.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const root = process.cwd();
const list = (d) => existsSync(join(root, d)) ? readdirSync(join(root, d)) : [];
const read = (p) => readFileSync(join(root, p), 'utf8');
let errors = 0, warns = 0, checks = 0;
const fail = (m) => { console.log('  ✗ ' + m); errors++; };
const warn = (m) => { console.log('  ! ' + m); warns++; };

const sectionFiles = new Set(list('sections').filter(f => f.endsWith('.liquid')).map(f => basename(f, '.liquid')));
const snippetFiles = new Set(list('snippets').filter(f => f.endsWith('.liquid')).map(f => basename(f, '.liquid')));
const blockFiles = new Set(list('blocks').filter(f => f.endsWith('.liquid')).map(f => basename(f, '.liquid')));
const assetFiles = new Set(list('assets'));
const locale = JSON.parse(read('locales/en.default.json'));

const getKey = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

// cache: section file -> {settings:Set, blocks:Set}
const schemaCache = {};
function schemaOf(type) {
  if (schemaCache[type]) return schemaCache[type];
  const p = join('sections', type + '.liquid');
  if (!existsSync(join(root, p))) return (schemaCache[type] = null);
  const m = read(p).match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/);
  if (!m) return (schemaCache[type] = { settings: new Set(), blocks: new Set() });
  let json; try { json = JSON.parse(m[1]); } catch { return (schemaCache[type] = null); }
  const settings = new Set((json.settings || []).filter(s => s.id).map(s => s.id));
  const blocks = new Set((json.blocks || []).filter(b => b.type).map(b => b.type));
  return (schemaCache[type] = { settings, blocks });
}

// ---- 1-3. JSON: templates, groups, section schemas, config, locales ----
console.log('JSON parse + section-type resolution:');
const tdirs = ['templates', 'templates/customers'];
const templateJson = {}; // path -> parsed
for (const d of tdirs) for (const f of list(d).filter(f => f.endsWith('.json'))) {
  checks++;
  try { templateJson[`${d}/${f}`] = JSON.parse(read(join(d, f))); }
  catch (e) { fail(`${d}/${f}: invalid JSON — ${e.message}`); }
}
for (const f of list('sections').filter(f => f.endsWith('.json'))) {
  checks++;
  try { templateJson[`sections/${f}`] = JSON.parse(read(join('sections', f))); }
  catch (e) { fail(`sections/${f}: invalid JSON — ${e.message}`); }
}
for (const p of ['config/settings_schema.json', 'config/settings_data.json', 'locales/en.default.json']) {
  checks++;
  try { JSON.parse(read(p)); } catch (e) { fail(`${p}: invalid JSON — ${e.message}`); }
}
for (const f of list('sections').filter(f => f.endsWith('.liquid'))) {
  checks++;
  const m = read(join('sections', f)).match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/);
  if (m) { try { JSON.parse(m[1]); } catch (e) { fail(`sections/${f}: invalid {% schema %} JSON — ${e.message}`); } }
}

// ---- 2 + 7. section types + block types in every JSON that has "sections" ----
console.log('Template section + block types:');
for (const [path, json] of Object.entries(templateJson)) {
  for (const [sid, sec] of Object.entries(json.sections || {})) {
    checks++;
    if (sec.type && !sectionFiles.has(sec.type)) { fail(`${path} [${sid}]: section type "${sec.type}" → no sections/${sec.type}.liquid`); continue; }
    const sc = sec.type ? schemaOf(sec.type) : null;
    if (!sc) continue;
    for (const [bid, blk] of Object.entries(sec.blocks || {})) {
      checks++;
      const t = blk.type;
      if (!t) continue;
      if (t.startsWith('@')) continue;               // @app / @theme
      if (blockFiles.has(t)) continue;               // theme block file
      if (!sc.blocks.has(t)) fail(`${path} [${sid}]: block type "${t}" not declared in ${sec.type} schema`);
    }
  }
}

// ---- 4. render/include + asset refs ----
console.log('Snippet + asset references:');
const liquidDirs = ['sections', 'snippets', 'layout', 'templates/customers', 'blocks'];
const allLiquid = [];
for (const d of liquidDirs) for (const f of list(d).filter(f => f.endsWith('.liquid'))) allLiquid.push([d, f, read(join(d, f))]);
for (const [d, f, src] of allLiquid) {
  for (const mm of src.matchAll(/\{%-?\s*(?:render|include)\s+'([^']+)'/g)) {
    checks++;
    if (!snippetFiles.has(mm[1])) fail(`${d}/${f}: render '${mm[1]}' → no snippets/${mm[1]}.liquid`);
  }
  for (const mm of src.matchAll(/'([^']+\.(?:css|js|woff2|png|jpg|jpeg|webp|svg))'\s*\|\s*asset_url/g)) {
    checks++;
    if (!assetFiles.has(mm[1])) fail(`${d}/${f}: asset '${mm[1]}' not in assets/`);
  }
}

// ---- 5. translation keys ----
console.log('Translation keys ({{ ... | t }}):');
for (const [d, f, src] of allLiquid) {
  for (const mm of src.matchAll(/['"]([a-z0-9_]+(?:\.[a-z0-9_]+)+)['"]\s*\|\s*t\b/gi)) {
    checks++;
    const key = mm[1];
    const val = getKey(locale, key);
    if (val === undefined) {
      // pluralization objects (one/other) resolve to the parent; also allow parent-with-children
      warn(`${d}/${f}: translation key "${key}" missing in en.default.json`);
    }
  }
}

// ---- 6. Liquid tag balance ----
console.log('Liquid tag balance:');
// NB: {% liquid %} is an inline tag with no {% endliquid %} — excluded on purpose.
const pairs = ['if', 'unless', 'for', 'case', 'form', 'paginate', 'capture', 'tablerow',
  'comment', 'raw', 'schema', 'style', 'stylesheet', 'javascript'];
for (const [d, f, src] of allLiquid) {
  checks++;
  const counts = {};
  for (const mm of src.matchAll(/\{%-?\s*(end)?([a-z]+)/g)) {
    const [, end, tag] = mm;
    if (!pairs.includes(tag)) continue;
    counts[tag] = (counts[tag] || 0) + (end ? -1 : 1);
  }
  for (const [tag, n] of Object.entries(counts)) {
    if (n !== 0) fail(`${d}/${f}: unbalanced {% ${tag} %} (open-close = ${n})`);
  }
}

// ---- 8. settings_data ids resolve to schema ids ----
console.log('settings_data → settings_schema:');
try {
  const schema = JSON.parse(read('config/settings_schema.json'));
  const ids = new Set();
  for (const grp of schema) for (const s of (grp.settings || [])) if (s.id) ids.add(s.id);
  const data = JSON.parse(read('config/settings_data.json'));
  const current = data.current && typeof data.current === 'object' ? data.current : {};
  for (const k of Object.keys(current)) {
    if (k === 'sections' || k === 'content_for_index' || k === 'blocks' || k === 'order') continue;
    checks++;
    if (!ids.has(k)) warn(`settings_data.current.${k} has no matching id in settings_schema.json`);
  }
} catch (e) { fail('settings comparison failed: ' + e.message); }

// ---- 9. schema locale (t:) keys resolve in en.default.schema.json ----
console.log('Schema locale keys (t:):');
if (existsSync(join(root, 'locales/en.default.schema.json'))) {
  const sloc = JSON.parse(read('locales/en.default.schema.json'));
  const getS = (p) => p.split('.').reduce((o, k) => (o == null ? undefined : o[k]), sloc);
  const scanT = (str, where) => {
    for (const mm of str.matchAll(/"t:([^"]+)"/g)) { checks++; if (getS(mm[1]) === undefined) fail(`${where}: schema locale key "${mm[1]}" missing in en.default.schema.json`); }
  };
  for (const f of list('sections').filter(f => f.endsWith('.liquid'))) {
    const m = read(join('sections', f)).match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema/);
    if (m) scanT(m[1], `sections/${f}`);
  }
  scanT(read('config/settings_schema.json'), 'config/settings_schema.json');
} else { warn('locales/en.default.schema.json not found (schema labels not localized)'); }

// ---- 10. No Liquid inside static .css/.js assets (Shopify won't process it) ----
console.log('No Liquid in static assets:');
for (const f of list('assets').filter(f => /\.(css|js)$/.test(f))) {
  checks++;
  const src = read(join('assets', f));
  if (/\{\{|\{%/.test(src)) fail(`assets/${f}: contains Liquid ({{ or {%) — move it to a .liquid file (Shopify serves .css/.js as static).`);
}

console.log(`\n${errors === 0 ? '✅ PASS' : '❌ FAIL'} — ${checks} checks, ${errors} error(s), ${warns} warning(s).`);
process.exit(errors === 0 ? 0 : 1);
