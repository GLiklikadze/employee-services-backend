import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import fs from "fs";
import path from "path";

const tmpFile = "/tmp/employee-data.json";
const originFile = path.join(process.cwd(), "employee-data.json");

// Copy original to /tmp if it doesn't exist
if (!fs.existsSync(tmpFile)) {
  fs.copyFileSync(originFile, tmpFile);
}

const adapter = new JSONFile(tmpFile);
const db = new Low(adapter);

export async function getDb() {
  await db.read();
  db.data ||= { users: [] };
  return db;
}
