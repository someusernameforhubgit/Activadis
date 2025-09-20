import Database from "../database.js";
const database = await Database.init();
const url = "/api/activiteit";

export default function ActiviteitAPI(app) {
    app.get(url, async (req, res) => {
        if (req.query.id) {
            const activiteit = (await database.query("SELECT * FROM activiteit WHERE id = ? AND hidden = 0", [req.query.id]))[0];
            res.send(activiteit);
        } else {
            const activiteiten = await database.query("SELECT * FROM activiteit WHERE hidden = 0");
            res.send(activiteiten);
        }
    });

    app.post(url, async (req, res) => {
        if (req.body.naam && req.body.locatie && req.body.eten && req.body.omschrijving && req.body.begin && req.body.eind && req.body.kost && req.body.max && req.body.min && req.body.afbeelding && req.body.hidden !== undefined) {
            const activiteit = await database.query("INSERT INTO activiteit (naam, locatie, eten, omschrijving, begin, eind, kost, max, min, afbeelding, hidden) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [req.body.naam, req.body.locatie, req.body.eten, req.body.omschrijving, req.body.begin, req.body.eind, req.body.kost, req.body.max, req.body.min, req.body.afbeelding, req.body.hidden ? 1 : 0]);
            res.send(activiteit);
        } else {
            res.status(400).send("One or more required fields are missing");
        }
    });

    app.put(url, async (req, res) => {
        if (req.body.id && req.body.naam && req.body.locatie && req.body.eten && req.body.omschrijving && req.body.begin && req.body.eind && req.body.kost && req.body.max && req.body.min && req.body.afbeelding && req.body.hidden !== undefined) {
            const activiteit = await database.query("UPDATE activiteit SET naam = ?, locatie = ?, eten = ?, omschrijving = ?, begin = ?, eind = ?, kost = ?, max = ?, min = ?, afbeelding = ?, hidden = ? WHERE id = ?", [req.body.naam, req.body.locatie, req.body.eten, req.body.omschrijving, req.body.begin, req.body.eind, req.body.kost, req.body.max, req.body.min, req.body.afbeelding, req.body.hidden ? 1 : 0, req.body.id]);
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
