import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'intelmap.db');
const schemaPath = path.join(__dirname, 'schema.sql');

export async function initDB() {
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    const schema = fs.readFileSync(schemaPath, 'utf8');
    await db.exec(schema);

    return db;
}
