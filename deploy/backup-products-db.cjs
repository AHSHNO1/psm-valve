const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

async function backupDatabase() {
  const source = process.env.PSM_DATABASE_PATH
    ? path.resolve(process.env.PSM_DATABASE_PATH)
    : path.join(process.cwd(), "data", "psm-valve.sqlite");
  const destination = process.argv[2];

  if (!destination) throw new Error("A destination path is required.");
  if (!fs.existsSync(source)) return;

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const database = new Database(source, { readonly: true, fileMustExist: true });
  try {
    await database.backup(destination);
  } finally {
    database.close();
  }
}

backupDatabase().catch((error) => {
  console.error("SQLite product backup failed:", error);
  process.exitCode = 1;
});
