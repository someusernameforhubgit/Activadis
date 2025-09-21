import mysql from "mysql2/promise";

export default class Database {
    constructor(connection) {
        this.connection = connection;
        this.requests = 0;
    }

    static async init() {
        const connection = await mysql.createConnection({
            host     : process.env.DB_HOST,
            user     : process.env.DB_USER,
            password : process.env.DB_PASSWORD,
            database : process.env.DB_NAME
        });
        return new Database(connection);
    }

    async query(query, params) {
        this.requests++;
        let res = await this.connection.query(query, params);
        if (query.startsWith("SELECT")) {
            return res[0];
        } else if (query.startsWith("INSERT")) {
            return res[0].insertId;
        }
    }

    async testConnection() {
        try {
            await this.connection.query("SELECT 1");
            return true;
        } catch (error) {
            return false;
        }
    }

    getRequestCount() {
        return this.requests;
    }
}