import Database from "../database.js";
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
        if (req.body.email && req.body.hash && req.body.salt && req.body.admin !== undefined) {
            const gebruiker = await database.query("INSERT INTO gebruiker (email, hash, salt, admin) VALUES (?, ?, ?, ?)", [req.body.email, req.body.hash, req.body.salt, req.body.admin]);
            res.send(gebruiker);
        } else {
            res.status(400).send("One or more required fields are missing");
        }
    });

    app.put(url, async (req, res) => {
        if (req.body.id && req.body.email && req.body.hash && req.body.salt && req.body.admin !== undefined) {
            const gebruiker = await database.query("UPDATE gebruiker SET email = ?, hash = ?, salt = ?, admin = ? WHERE id = ?", [req.body.email, req.body.hash, req.body.salt, req.body.admin, req.body.id]);
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