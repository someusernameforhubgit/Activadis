import jwt from "jsonwebtoken";
import Database from "../database/database.js";
const database = await Database.init();

async function verifyToken(token) {
    try {
        const data = jwt.verify(token, process.env.JWT_SECRET);
        const id = data.id;
        return {
            jwt: data,
            id: id
        }
    } catch (error) {
        return false;
    }
}

async function verifyAdmin(token) {
    const verified = await verifyToken(token);
    if (!verified) return false
    const admin = (await database.query("SELECT role FROM gebruiker WHERE id = ?", [verified.id]))[0].role;
    return admin === 1;
}

export {
    verifyToken,
    verifyAdmin
}
