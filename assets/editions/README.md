# Edition folders

Each subdirectory here is **one digital edition** (one text) in the multi-edition viewer.

## Quick checklist for a new edition

1. Create `src/assets/editions/<slug>/` (slug = URL segment, e.g. `my-manuscript`).
2. Add:
   - `file_config.json` — TEI path(s) and links to the other JSON configs
   - `edition_config.json` — edition settings ([EVT wiki](https://github.com/evt-project/evt-viewer-angular/wiki/Edition-Configuration))
   - `ui_config.json` — UI and view modes ([EVT wiki](https://github.com/evt-project/evt-viewer-angular/wiki/Ui-Configuration))
   - `editorial_conventions_config.json` — editorial markup (copy from `ls-xii/` or `src/assets/config/`)
   - `edition.meta.json` — optional home-page label, sort order, default view (see below)
   - `data/edition.xml` — your TEI file (or use remote `editionUrls` in `file_config.json`)
3. From the project root run: `npm run generate:site-config`
4. Test: `npm run start` → `http://localhost:4205/<slug>/readingText`

## `edition.meta.json` (optional)

```json
{
  "label": "Display name on the home page",
  "defaultViewMode": "readingText",
  "enabled": true,
  "isDefault": false,
  "sortOrder": 10
}
```

- **`isDefault`**: only one edition should have `"isDefault": true` (opening `/` sends users to that slug).
- **`sortOrder`**: lower values list first on the home page.

If `edition.meta.json` is omitted, the generator uses `editionTitle` and `defaultViewMode` from `edition_config.json`.

## Do not edit by hand

`src/assets/config/site_config.json` is **generated** from these folders. After adding or removing an edition, always run:

```bash
npm run generate:site-config
```

(`npm run build:gh-pages` runs this automatically before deploy.)

## Full documentation

See **section 2.3** in the [project README](../../../README.md#23---multi-edition-site-this-fork).
