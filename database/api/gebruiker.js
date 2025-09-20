import Database from "../database.js";
import crypto from "crypto";
import mail from "../../util/mail.js";
import jwt from "jsonwebtoken";
const database = await Database.init();
const url = "/api/gebruiker";

export default function GebruikerAPI(app) {
    app.get(url, async (req, res) => {
        if (req.query.id) {
            const gebruiker = (await database.query("SELECT * FROM gebruiker WHERE id = ?", [req.query.id]))[0];
            res.send(gebruiker);
        } else {
            const gebruikers = await database.query("SELECT * FROM gebruiker");
            res.send(gebruikers);
        }
    });

    app.post(url, async (req, res) => {
        if (req.body.email && req.body.firstname && req.body.lastname && req.body.role !== undefined) {
            const gebruiker = await database.query("INSERT INTO gebruiker (email, firstname, lastname, role) VALUES (?, ?, ?, ?)", [req.body.email, req.body.firstname, req.body.lastname, req.body.role]);
            res.send(gebruiker);
            const reset_token = jwt.sign({id: gebruiker, email: req.body.email, reset: true}, process.env.JWT_SECRET, {expiresIn: "15m"});
            await mail(
                req.body.email,
                "Account aangemaakt",
                "<h1>Account aangemaakt</h1><br>" +
                "<p>Er is een account voor u aangemaakt op Activadis.</p>" +
                "<p>U moet voor u kan inloggen op Activadis een wachtwoord instellen.</p>" +
                "<p>Dit kunt u <a href='http://localhost:3000/login?reset_token=" + reset_token + "'>hier</a> doen.</p>" +
                "<p>Deze link verloopt over 15 minuten.</p>"
            );
        } else {
            res.status(400).send("One or more required fields are missing");
        }
    });

    app.put(url, async (req, res) => {
        if (req.body.id && req.body.email && req.body.password && req.body.firstname && req.body.lastname && req.body.role !== undefined) {
            const salt = crypto.randomBytes(16).toString("hex");
            const hash = hashPassword(req.body.password, salt);
            const gebruiker = await database.query("UPDATE gebruiker SET email = ?, hash = ?, salt = ?, firstname = ?, lastname = ?, role = ? WHERE id = ?", [req.body.email, hash, salt, req.body.firstname, req.body.lastname, req.body.role, req.body.id]);
            res.send(gebruiker);
        } else {
            res.status(400).send("One or more required fields are missing");
        }
    });

    app.delete(url, async (req, res) => {
        if (req.query.id) {
            const gebruiker = await database.query("DELETE FROM gebruiker WHERE id = ?", [req.query.id]);
            res.send(gebruiker);
        } else {
            res.status(400).send("No id provided");
        }
    });
}

function hashPassword(password, salt) {
    return crypto.createHash("sha256").update(password + salt).digest("hex");
}