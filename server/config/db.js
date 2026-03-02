import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on("error", (err) => {
    console.error("❌ Unexpected PostgreSQL pool error:", err.message);
});

pool.connect()
    .then((client) => {
        console.log("✅ Connected to PostgreSQL database");
        client.release();
    })
    .catch((err) => {
        console.error("❌ Failed to connect to PostgreSQL:", err.message);
        process.exit(1);
    });

export default pool;
