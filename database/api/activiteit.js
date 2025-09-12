import Database from "../database.js";
const database = await Database.init();
const url = "/api/activiteit";

export default function ActiviteitAPI(app) {
    app.get(url, async (req, res) => {
        if (req.query.id) {
            const activiteit = (await database.query("SELECT * FROM activiteit WHERE id = ?", [req.query.id]))[0];
            res.send(activiteit);
        } else {
            const activiteiten = await database.query("SELECT * FROM activiteit");
            res.send(activiteiten);
        }
    });

    app.post(url, async (req, res) => {
        if (req.body.naam && req.body.locatie && req.body.eten && req.body.omschrijving && req.body.begin && req.body.eind && req.body.kost && req.body.max && req.body.min && req.body.afbeelding) {
            const activiteit = await database.query("INSERT INTO activiteit (naam, locatie, eten, omschrijving, begin, eind, kost, max, min, afbeelding) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [req.body.naam, req.body.locatie, req.body.eten, req.body.omschrijving, req.body.begin, req.body.eind, req.body.kost, req.body.max, req.body.min, req.body.afbeelding]);
            res.send(activiteit);
        } else {
            res.status(400).send("One or more required fields are missing");
        }
    });

    app.put(url, async (req, res) => {
        if (req.body.id && req.body.naam && req.body.locatie && req.body.eten && req.body.omschrijving && req.body.begin && req.body.eind && req.body.kost && req.body.max && req.body.min && req.body.afbeelding) {
            const activiteit = await database.query("UPDATE activiteit SET naam = ?, locatie = ?, eten = ?, omschrijving = ?, begin = ?, eind = ?, kost = ?, max = ?, min = ?, afbeelding = ? WHERE id = ?", [req.body.naam, req.body.locatie, req.body.eten, req.body.omschrijving, req.body.begin, req.body.eind, req.body.kost, req.body.max, req.body.min, req.body.afbeelding, req.body.id]);
            res.send(activiteit);
        } else {
            res.status(400).send("One or more required fields are missing");
        }
    });

    app.delete(url, async (req, res) => {
        if (req.query.id) {
            const activiteit = await database.query("DELETE FROM activiteit WHERE id = ?", [req.query.id]);
            res.send(activiteit);
        } else {
            res.status(400).send("No id provided");
        }
    });
}