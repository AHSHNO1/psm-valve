import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import {
  canonicalSeriesProducts,
  products as initialProducts,
  persianProductCorrections
} from "./products.js";
import { productTranslations } from "./product-translations.js";

const DATABASE_PATH = process.env.PSM_DATABASE_PATH
  ? path.resolve(process.env.PSM_DATABASE_PATH)
  : path.join(process.cwd(), "data", "psm-valve.sqlite");
const DATABASE_KEY = "__psmProductDatabase";

function getDatabase() {
  if (globalThis[DATABASE_KEY]) return globalThis[DATABASE_KEY];

  fs.mkdirSync(path.dirname(DATABASE_PATH), { recursive: true });
  const database = new Database(DATABASE_PATH);
  database.pragma("journal_mode = WAL");
  database.exec(`
    CREATE TABLE IF NOT EXISTS products (
      slug TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      position INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS app_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const seed = database.transaction(() => {
    const seeded = database.prepare("SELECT value FROM app_metadata WHERE key = ?").get("products-seeded");
    if (seeded) return;

    const count = database.prepare("SELECT COUNT(*) AS count FROM products").get().count;
    if (count === 0) {
      const insert = database.prepare("INSERT INTO products (slug, data, position) VALUES (?, ?, ?)");
      initialProducts.forEach((product, index) => {
        insert.run(product.slug, JSON.stringify(product), index);
      });
    }
    database.prepare("INSERT INTO app_metadata (key, value) VALUES (?, ?)").run("products-seeded", "1");
  });
  seed.immediate();

  const migrateInstrumentationHierarchy = database.transaction(() => {
    const migrationKey = "products-migration-control-valve-instrumentation-hierarchy-v2";
    const migrated = database.prepare("SELECT value FROM app_metadata WHERE key = ?").get(migrationKey);
    if (migrated) return;

    database.prepare("DELETE FROM products WHERE slug = ?").run("control-valve-instrumentation-equipment");
    database.prepare("INSERT INTO app_metadata (key, value) VALUES (?, ?)").run(migrationKey, "1");
  });
  migrateInstrumentationHierarchy.immediate();

  const correctSeedPersian = database.transaction(() => {
    const migrationKey = "products-migration-persian-proofreading-v1";
    const migrated = database.prepare("SELECT value FROM app_metadata WHERE key = ?").get(migrationKey);
    if (migrated) return;

    const findProduct = database.prepare("SELECT data FROM products WHERE slug = ?");
    const updateProduct = database.prepare("UPDATE products SET data = ? WHERE slug = ?");
    for (const correction of persianProductCorrections) {
      const row = findProduct.get(correction.slug);
      if (!row) continue;

      const product = JSON.parse(row.data);
      const keys = correction.field.split(".");
      let target = product;
      for (let index = 0; index < keys.length - 1; index++) target = target?.[keys[index]];
      const field = keys[keys.length - 1];
      if (target && target[field] === correction.from) {
        target[field] = correction.to;
        updateProduct.run(JSON.stringify(product), correction.slug);
      }
    }
    database.prepare("INSERT INTO app_metadata (key, value) VALUES (?, ?)").run(migrationKey, "1");
  });
  correctSeedPersian.immediate();

  const migrateTypeF = database.transaction(() => {
    const migrationKey = "products-migration-pressure-regulator-type-f-v1";
    const migrated = database.prepare("SELECT value FROM app_metadata WHERE key = ?").get(migrationKey);
    if (migrated) return;

    const legacySlug = "pressure-regulator-70000-e";
    const currentSlug = "pressure-regulator-70000-f";
    const legacy = database.prepare("SELECT data FROM products WHERE slug = ?").get(legacySlug);
    const current = database.prepare("SELECT 1 FROM products WHERE slug = ?").get(currentSlug);

    if (legacy && !current) {
      const product = initialProducts.find((item) => item.slug === currentSlug);
      if (!product) throw new Error("Pressure regulator Type F seed product is missing");
      database.prepare("UPDATE products SET slug = ?, data = ? WHERE slug = ?")
        .run(currentSlug, JSON.stringify(product), legacySlug);
    } else if (legacy && current) {
      database.prepare("DELETE FROM products WHERE slug = ?").run(legacySlug);
    } else if (!current) {
      const product = initialProducts.find((item) => item.slug === currentSlug);
      if (!product) throw new Error("Pressure regulator Type F seed product is missing");
      const position = database.prepare("SELECT COALESCE(MAX(position), -1) + 1 AS position FROM products").get().position;
      database.prepare("INSERT INTO products (slug, data, position) VALUES (?, ?, ?)")
        .run(currentSlug, JSON.stringify(product), position);
    }

    database.prepare("INSERT INTO app_metadata (key, value) VALUES (?, ?)").run(migrationKey, "1");
  });
  migrateTypeF.immediate();

  const restoreTypeE = database.transaction(() => {
    const migrationKey = "products-migration-restore-pressure-regulator-type-e-v1";
    const migrated = database.prepare("SELECT value FROM app_metadata WHERE key = ?").get(migrationKey);
    if (migrated) return;

    const typeE = initialProducts.find((product) => product.slug === "pressure-regulator-70000-e");
    if (!typeE) throw new Error("Pressure regulator Type E seed product is missing");

    const exists = database.prepare("SELECT 1 FROM products WHERE slug = ?").get(typeE.slug);
    if (!exists) {
      const typeF = database.prepare("SELECT position FROM products WHERE slug = ?")
        .get("pressure-regulator-70000-f");
      const position = typeF?.position
        ?? database.prepare("SELECT COALESCE(MAX(position), -1) + 1 AS position FROM products").get().position;
      database.prepare("UPDATE products SET position = position + 1 WHERE position >= ?").run(position);
      database.prepare("INSERT INTO products (slug, data, position) VALUES (?, ?, ?)")
        .run(typeE.slug, JSON.stringify(typeE), position);
    }

    database.prepare("INSERT INTO app_metadata (key, value) VALUES (?, ?)").run(migrationKey, "1");
  });
  restoreTypeE.immediate();

  const migrateRequestedProductSeries = database.transaction(() => {
    const migrationKey = "products-migration-requested-series-catalog-v2";
    const migrated = database.prepare("SELECT value FROM app_metadata WHERE key = ?").get(migrationKey);
    if (migrated) return;

    const findProduct = database.prepare("SELECT data FROM products WHERE slug = ?");
    const updateProduct = database.prepare("UPDATE products SET data = ? WHERE slug = ?");
    const insertProduct = database.prepare("INSERT INTO products (slug, data, position) VALUES (?, ?, ?)");
    let nextPosition = database.prepare("SELECT COALESCE(MAX(position), -1) + 1 AS position FROM products").get().position;

    for (const canonical of canonicalSeriesProducts) {
      const row = findProduct.get(canonical.slug);
      if (!row) {
        insertProduct.run(canonical.slug, JSON.stringify(canonical), nextPosition++);
        continue;
      }

      const current = JSON.parse(row.data);
      const updated = {
        ...current,
        series: canonical.series,
        categoryId: canonical.categoryId,
        name: { ...current.name, ...canonical.name },
        ...(canonical.short && { short: { ...current.short, ...canonical.short } })
      };
      if (JSON.stringify(updated) !== row.data) {
        updateProduct.run(JSON.stringify(updated), canonical.slug);
      }
    }

    const orderedSlugs = new Set(initialProducts.map((product) => product.slug));
    const existingRows = database.prepare("SELECT slug, position FROM products ORDER BY position, slug").all();
    const existingBySlug = new Map(existingRows.map((row) => [row.slug, row]));
    const desiredRows = initialProducts
      .map((product) => existingBySlug.get(product.slug))
      .filter(Boolean);
    const additionalRows = existingRows.filter((row) => !orderedSlugs.has(row.slug));
    const finalOrder = [...desiredRows, ...additionalRows];
    const offset = database.prepare("SELECT COALESCE(MAX(position), -1) + 1 AS offset FROM products").get().offset;
    database.prepare("UPDATE products SET position = position + ?").run(offset);
    const setPosition = database.prepare("UPDATE products SET position = ? WHERE slug = ?");
    finalOrder.forEach((row, index) => setPosition.run(index, row.slug));

    database.prepare("INSERT INTO app_metadata (key, value) VALUES (?, ?)").run(migrationKey, "1");
  });
  migrateRequestedProductSeries.immediate();

  const backfillProductTranslations = database.transaction(() => {
    const migrationKey = "products-migration-localization-backfill-v1";
    const migrated = database.prepare("SELECT value FROM app_metadata WHERE key = ?").get(migrationKey);
    if (migrated) return;

    const findProduct = database.prepare("SELECT data FROM products WHERE slug = ?");
    const updateProduct = database.prepare("UPDATE products SET data = ? WHERE slug = ?");
    for (const seed of initialProducts) {
      const row = findProduct.get(seed.slug);
      if (!row) continue;

      const product = JSON.parse(row.data);
      let changed = false;
      for (const field of ["name", "short"]) {
        if (!seed[field]) continue;
        for (const locale of ["fa", "en", "ar", "ru"]) {
          const value = seed[field][locale];
          if (value && !product[field]?.[locale]) {
            product[field] = { ...(product[field] || {}), [locale]: value };
            changed = true;
          }
        }
      }
      if (changed) updateProduct.run(JSON.stringify(product), seed.slug);
    }
    database.prepare("INSERT INTO app_metadata (key, value) VALUES (?, ?)").run(migrationKey, "1");
  });
  backfillProductTranslations.immediate();

  const correctStaleTranslations = database.transaction(() => {
    const migrationKey = "products-migration-localization-corrections-v1";
    const migrated = database.prepare("SELECT value FROM app_metadata WHERE key = ?").get(migrationKey);
    if (migrated) return;

    const staleValues = {
      "general-ball-35000": {
        short: {
          en: "A quarter-turn valve that uses a hollow, ported ball to control flow."
        }
      }
    };

    const findProduct = database.prepare("SELECT data FROM products WHERE slug = ?");
    const updateProduct = database.prepare("UPDATE products SET data = ? WHERE slug = ?");
    for (const [slug, fields] of Object.entries(staleValues)) {
      const row = findProduct.get(slug);
      if (!row) continue;

      const seed = initialProducts.find((product) => product.slug === slug);
      if (!seed) continue;

      const product = JSON.parse(row.data);
      let changed = false;
      for (const [field, locales] of Object.entries(fields)) {
        for (const [locale, stale] of Object.entries(locales)) {
          const corrected = seed[field]?.[locale];
          if (corrected && product[field]?.[locale] === stale && corrected !== stale) {
            product[field] = { ...(product[field] || {}), [locale]: corrected };
            changed = true;
          }
        }
      }
      if (changed) updateProduct.run(JSON.stringify(product), slug);
    }
    database.prepare("INSERT INTO app_metadata (key, value) VALUES (?, ?)").run(migrationKey, "1");
  });
  correctStaleTranslations.immediate();

  const localizeProductLists = database.transaction(() => {
    const migrationKey = "products-migration-localization-lists-v1";
    const migrated = database.prepare("SELECT value FROM app_metadata WHERE key = ?").get(migrationKey);
    if (migrated) return;

    const listFields = ["features", "applications", "options", "clients"];
    const findProduct = database.prepare("SELECT data FROM products WHERE slug = ?");
    const updateProduct = database.prepare("UPDATE products SET data = ? WHERE slug = ?");
    for (const [slug, translations] of Object.entries(productTranslations)) {
      const row = findProduct.get(slug);
      if (!row) continue;

      const product = JSON.parse(row.data);
      let changed = false;
      for (const field of listFields) {
        if (!translations[field]) continue;
        const existing = product[field];
        const hasContent = existing
          && ["fa", "en", "ar", "ru"].some(
            (locale) => Array.isArray(existing[locale]) && existing[locale].length > 0
          );
        if (!hasContent) continue;
        for (const [locale, values] of Object.entries(translations[field])) {
          if (!Array.isArray(values) || values.length === 0) continue;
          const current = existing[locale];
          if (Array.isArray(current) && current.length > 0) continue;
          existing[locale] = values;
          changed = true;
        }
      }
      if (changed) updateProduct.run(JSON.stringify(product), slug);
    }
    database.prepare("INSERT INTO app_metadata (key, value) VALUES (?, ?)").run(migrationKey, "1");
  });
  localizeProductLists.immediate();

  globalThis[DATABASE_KEY] = database;
  return database;
}

function parseProduct(row) {
  if (!row) return null;
  const product = JSON.parse(row.data);
  if (!product || product.slug !== row.slug) {
    throw new Error(`Product data integrity error for slug "${row.slug}"`);
  }
  return product;
}

export function getProducts() {
  return getDatabase()
    .prepare("SELECT slug, data FROM products ORDER BY position, slug")
    .all()
    .map(parseProduct);
}

export function getProduct(slug) {
  return parseProduct(getDatabase().prepare("SELECT slug, data FROM products WHERE slug = ?").get(slug));
}

export function getProductsByCategory(categoryId) {
  return getProducts().filter((product) => product.categoryId === categoryId);
}

export function createProduct(product) {
  const database = getDatabase();
  const nextPosition = database.prepare("SELECT COALESCE(MAX(position), -1) + 1 AS position FROM products").get().position;
  try {
    database.prepare("INSERT INTO products (slug, data, position) VALUES (?, ?, ?)")
      .run(product.slug, JSON.stringify(product), nextPosition);
    return true;
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_PRIMARYKEY" || error.code === "SQLITE_CONSTRAINT_UNIQUE") return false;
    throw error;
  }
}

export function updateProduct(slug, updates) {
  const current = getProduct(slug);
  if (!current) return false;
  const updated = { ...current, ...updates, slug };
  const result = getDatabase()
    .prepare("UPDATE products SET data = ? WHERE slug = ?")
    .run(JSON.stringify(updated), slug);
  return result.changes === 1;
}

export function deleteProduct(slug) {
  const result = getDatabase().prepare("DELETE FROM products WHERE slug = ?").run(slug);
  return result.changes === 1;
}
