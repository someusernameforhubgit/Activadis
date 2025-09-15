import Database from "../database.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
const database = await Database.init();
const url = "/api/login";

export default function LoginAPI(app) {
    app.get(url, async (req, res) => {
        const {email, password} = req.query;
        const gebruiker = await database.query("SELECT * FROM gebruiker WHERE email = ?", [email]);
        if (gebruiker.length === 0) {
            return res.send({});
        }
        const hash = hashPassword(password, gebruiker[0].salt);
        if (hash !== gebruiker[0].hash) {
            return res.send({});
        }
        res.send({token: await jwt.sign({email: gebruiker[0].email}, process.env.JWT_SECRET, {expiresIn: "1h"})});
    });

    app.get("/api/verify", async (req, res) => {
        const {token} = req.query;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            res.send(decoded);
        } catch (error) {
            res.send({});
        }
    });
};

function hashPassword(password, salt) {
    return crypto.createHash("sha256").update(password + salt).digest("hex");
}