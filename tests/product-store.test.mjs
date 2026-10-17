import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { products as seedProducts } from "../lib/products.js";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");
const directory = fs.mkdtempSync(path.join(os.tmpdir(), "psm-products-"));
process.env.PSM_DATABASE_PATH = path.join(directory, "products.sqlite");
const store = await import("../lib/product-store.js");

test("SQLite product store seeds once and supports create, update, and delete", (context) => {
  context.after(() => {
    const database = globalThis.__psmProductDatabase;
    if (database) {
      database.close();
      delete globalThis.__psmProductDatabase;
    }
    fs.rmSync(directory, { recursive: true, force: true });
  });

  const legacyDatabase = new Database(process.env.PSM_DATABASE_PATH);
  legacyDatabase.exec(`
    CREATE TABLE products (slug TEXT PRIMARY KEY, data TEXT NOT NULL, position INTEGER NOT NULL);
    CREATE TABLE app_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `);
  const insertLegacyProduct = legacyDatabase.prepare("INSERT INTO products (slug, data, position) VALUES (?, ?, ?)");
  seedProducts.forEach((product, index) => {
    if (
      product.slug !== "pressure-regulator-70000-e" &&
      product.slug !== "pressure-regulator-70000-f"
    ) {
      const legacyProduct = structuredClone(product);
      if (legacyProduct.slug === "rotary-plug-31000") {
        legacyProduct.name.en = "Rotary Plug Control Valve 31000";
        legacyProduct.short.en = "A precision control valve with a rotating plug design.";
      }
      if (legacyProduct.slug === "rotary-globe-62000") {
        legacyProduct.categoryId = "control-valves";
      }
      if (legacyProduct.slug === "general-ball-35000") {
        legacyProduct.categoryId = "general-ball-valves";
      }
      if (legacyProduct.slug === "ball-valve-46000") {
        legacyProduct.categoryId = "control-ball-valves";
      }
      insertLegacyProduct.run(legacyProduct.slug, JSON.stringify(legacyProduct), index);
    }
  });
  const legacyTypeE = structuredClone(
    seedProducts.find((product) => product.slug === "pressure-regulator-70000-e")
  );
  const typeEPosition = seedProducts.findIndex((product) => product.slug === "pressure-regulator-70000-e");
  insertLegacyProduct.run(legacyTypeE.slug, JSON.stringify(legacyTypeE), typeEPosition);
  const legacyInstrumentationPlaceholder = {
    slug: "control-valve-instrumentation-equipment",
    series: "ICV",
    categoryId: "control-valve-instrumentation",
    name: { fa: "تجهیزات ابزار دقیق کنترل ولو", en: "Control Valve Instrumentation Equipment" }
  };
  insertLegacyProduct.run(
    legacyInstrumentationPlaceholder.slug,
    JSON.stringify(legacyInstrumentationPlaceholder),
    seedProducts.length
  );
  legacyDatabase.prepare("INSERT INTO app_metadata (key, value) VALUES (?, ?)").run("products-seeded", "1");
  legacyDatabase.close();

  assert.deepEqual(store.getProducts(), seedProducts);
  assert.equal(
    store.getProduct("pressure-regulator-70000-f").name.fa,
    "شیر تنظیم فشار (سری ۷۰۰۰۰)، نوع F"
  );
  assert.equal(store.getProduct("pressure-regulator-70000-f").image, "");
  assert.equal(store.getProduct("pressure-regulator-70000-f").short.fa, "");
  assert.equal(
    store.getProduct("pressure-regulator-70000-e").name.en,
    "Pressure Regulating Valve (70000 Series) Type E"
  );
  assert.equal(
    store.getProduct("pressure-regulator-70000-e").image,
    "/images/products/Regulator_valve_type_E-removebg-preview.png"
  );
  assert.equal(
    store.getProduct("rotary-plug-31000").name.en,
    "Control Reciprocating Globe Valve (31000 Series)"
  );
  assert.equal(
    store.getProduct("rotary-plug-31000").short.en,
    "Control reciprocating globe valve, series 31000."
  );
  assert.equal(store.getProduct("rotary-globe-62000").categoryId, "rotary-globe-valves");
  assert.equal(store.getProduct("general-ball-35000").categoryId, "ball-valves");
  assert.equal(store.getProduct("ball-valve-46000").categoryId, "ball-valves");
  assert.deepEqual(
    store.getProducts().slice(0, 14).map((product) => product.slug),
    [
      "spherical-globe-51000",
      "rotary-plug-31000",
      "globe-control-38000",
      "general-ball-35000",
      "ball-valve-46000",
      "ball-control-45000",
      "butterfly-control-53000",
      "butterfly-control-43000",
      "rotary-globe-62000",
      "letdown-66000",
      "desuperheater-65000",
      "piston-valve-10000",
      "safety-valve-57000",
      "pneumatic-actuators-97-98-62-63"
    ]
  );
  assert.equal(store.getProduct("control-valve-instrumentation-equipment"), null);

  const product = {
    slug: "sqlite-test-valve",
    series: "TEST-01",
    categoryId: "control-valves",
    image: "/images/test-main.png",
    image2: "/images/test-detail.png",
    description: { fa: "توضیحات کامل", en: "Full product description" },
    options: { fa: ["ورودی جانبی"], en: ["Side Entry"] },
    clients: { fa: ["مشتری نمونه"], en: ["Sample Client"] },
    specifications: [{
      id: "connection",
      label: { fa: "نوع اتصال", en: "Connection" },
      value: { fa: "فلنجی", en: "Flanged" }
    }],
    name: { fa: "محصول آزمایشی", en: "Test valve" }
  };
  assert.equal(store.createProduct(product), true);
  assert.equal(store.createProduct(product), false);
  assert.equal(store.getProduct(product.slug).series, "TEST-01");
  assert.equal(store.getProduct(product.slug).image2, "/images/test-detail.png");
  assert.equal(store.getProduct(product.slug).description.en, "Full product description");
  assert.deepEqual(store.getProduct(product.slug).options.en, ["Side Entry"]);
  assert.deepEqual(store.getProduct(product.slug).clients.en, ["Sample Client"]);
  assert.equal(store.getProduct(product.slug).specifications[0].value.en, "Flanged");
  assert.equal(store.getProductsByCategory("control-valves").some((item) => item.slug === product.slug), true);

  assert.equal(store.updateProduct(product.slug, { slug: "not-allowed", series: "TEST-02" }), true);
  assert.equal(store.getProduct(product.slug).series, "TEST-02");
  assert.equal(store.getProduct("not-allowed"), null);
  assert.equal(store.deleteProduct(product.slug), true);
  assert.equal(store.deleteProduct(product.slug), false);

  const persianSeriesProduct = {
    slug: "persian-series-test",
    series: "۵۷۰۰۰",
    categoryId: "safety-valves",
    name: { fa: "محصول با سری فارسی", en: "Product with Persian series" }
  };
  assert.equal(store.createProduct(persianSeriesProduct), true);
  assert.equal(store.getProduct(persianSeriesProduct.slug).series, "۵۷۰۰۰");
  assert.equal(store.deleteProduct(persianSeriesProduct.slug), true);

  const snapshot = path.join(directory, "products-backup.sqlite");
  execFileSync(process.execPath, [
    path.join(process.cwd(), "deploy", "backup-products-db.cjs"),
    snapshot
  ], { env: process.env, cwd: process.cwd() });
  const backup = new Database(snapshot, { readonly: true, fileMustExist: true });
  assert.equal(backup.prepare("SELECT COUNT(*) AS count FROM products").get().count, seedProducts.length);
  backup.close();

  const database = globalThis.__psmProductDatabase;
  database.prepare("DELETE FROM products").run();
  assert.deepEqual(store.getProducts(), []);
});
