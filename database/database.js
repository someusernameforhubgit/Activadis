import mysql from "mysql2/promise";

export default class Database {
    constructor(pool) {
        this.pool = pool;
        this.requests = 0;
    }

    static async init() {
        const pool = await mysql.createPool({
            host     : process.env.DB_HOST,
            user     : process.env.DB_USER,
            password : process.env.DB_PASSWORD,
            database : process.env.DB_NAME
        });
        return new Database(pool);
    }

    async query(query, params) {
        this.requests++;
        let res = await this.pool.query(query, params);
        if (query.startsWith("SELECT")) {
            return res[0];
        } else if (query.startsWith("INSERT")) {
            return res[0].insertId;
        }
    }

    async testConnection() {
        try {
            await this.pool.query("SELECT 1");
            return true;
        } catch (error) {
            return false;
        }
    }

    getRequestCount() {
        return this.requests;
    }
}