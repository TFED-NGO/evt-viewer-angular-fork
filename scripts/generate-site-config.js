#!/usr/bin/env node
/**
 * Scans src/assets/editions/<slug>/ and writes src/assets/config/site_config.json.
 * Optional per-edition edition.meta.json overrides label, defaultViewMode, enabled, sortOrder, isDefault.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const EDITIONS_DIR = path.join(ROOT, 'src/assets/editions');
const OUTPUT = path.join(ROOT, 'src/assets/config/site_config.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function main() {
  if (!fs.existsSync(EDITIONS_DIR)) {
    console.error('Editions directory not found:', EDITIONS_DIR);
    process.exit(1);
  }

  const slugs = fs.readdirSync(EDITIONS_DIR)
    .filter((name) => fs.statSync(path.join(EDITIONS_DIR, name)).isDirectory())
    .filter((slug) => fs.existsSync(path.join(EDITIONS_DIR, slug, 'file_config.json')))
    .sort((a, b) => {
      const metaA = fs.existsSync(path.join(EDITIONS_DIR, a, 'edition.meta.json'))
        ? readJson(path.join(EDITIONS_DIR, a, 'edition.meta.json')) : {};
      const metaB = fs.existsSync(path.join(EDITIONS_DIR, b, 'edition.meta.json'))
        ? readJson(path.join(EDITIONS_DIR, b, 'edition.meta.json')) : {};
      return (metaA.sortOrder ?? 100) - (metaB.sortOrder ?? 100) || a.localeCompare(b);
    });

  const editions = [];
  let defaultEdition = null;

  for (const slug of slugs) {
    const base = path.join(EDITIONS_DIR, slug);
    const metaPath = path.join(base, 'edition.meta.json');
    const editionConfigPath = path.join(base, 'edition_config.json');
    const meta = fs.existsSync(metaPath) ? readJson(metaPath) : {};

    let label = meta.label || slug;
    let defaultViewMode = meta.defaultViewMode || 'readingText';

    if (fs.existsSync(editionConfigPath)) {
      const editionConfig = readJson(editionConfigPath);
      if (!meta.label && editionConfig.editionTitle) {
        label = editionConfig.editionTitle;
      }
      if (!meta.defaultViewMode && editionConfig.defaultViewMode) {
        defaultViewMode = editionConfig.defaultViewMode;
      }
    }

    if (meta.isDefault) {
      defaultEdition = slug;
    }

    editions.push({
      slug,
      label,
      configBase: `assets/editions/${slug}`,
      defaultViewMode,
      enabled: meta.enabled !== false,
    });
  }

  if (!defaultEdition) {
    defaultEdition = editions.find((e) => e.slug === 'ls-xii')?.slug
      || editions.find((e) => e.enabled)?.slug
      || editions[0]?.slug
      || 'ls-xii';
  }

  const siteConfig = {
    defaultEdition,
    editions: editions.filter((e) => e.enabled),
  };

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, `${JSON.stringify(siteConfig, null, 2)}\n`);
  console.log(`Wrote ${OUTPUT} (${siteConfig.editions.length} editions, default: ${defaultEdition})`);
}

main();
