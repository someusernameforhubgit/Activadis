import {verifyAdmin, verifyToken} from "../../util/jwt-auth.js";
const url = "/api/inschrijving";

export default function InschrijvingAPI(app, database) {
    app.get(url, async (req, res) => {
        if (req.query.id) {
            const verifiedId = (await verifyToken(req.query.token)).id;
            if (verifiedId !== parseInt(req.query.id) && !(await verifyAdmin(req.query.token))) return res.status(401).send("Unauthorized");
            const inschrijving = (await database.query("SELECT * FROM inschrijving WHERE id = ?", [req.query.id]))[0];
            res.send(inschrijving);
        } else {
            if (!(await verifyAdmin(req.query.token))) return res.status(401).send("Unauthorized");
            const inschrijvingen = await database.query("SELECT * FROM inschrijving");
            res.send(inschrijvingen);
        }
    });

    app.post(url, async (req, res) => {
        if (!(await verifyAdmin(req.query.token))) return res.status(401).send("Unauthorized");
        if (req.body.gebruiker && req.body.activiteit) {
            const inschrijving = await database.query("INSERT INTO inschrijving (gebruiker, activiteit, notitie) VALUES (?, ?, ?)", [req.body.gebruiker, req.body.activiteit, req.body.notitie || null]);
            res.send(inschrijving);
        } else {
            res.status(400).send("One or more required fields are missing");
        }
    });

    app.put(url, async (req, res) => {
        if (!(await verifyAdmin(req.query.token))) return res.status(401).send("Unauthorized");
        if (req.body.id && req.body.gebruiker && req.body.activiteit) {
            const inschrijving = await database.query("UPDATE inschrijving SET gebruiker = ?, activiteit = ?, notitie = ? WHERE id = ?", [req.body.gebruiker, req.body.activiteit, req.body.notitie || null, req.body.id]);
            res.send(inschrijving);
        } else {
            res.status(400).send("One or more required fields are missing");
        }
    });

    app.delete(url, async (req, res) => {
        if (!(await verifyAdmin(req.query.token))) return res.status(401).send("Unauthorized");
        if (req.query.id) {
            const inschrijving = await database.query("DELETE FROM inschrijving WHERE id = ?", [req.query.id]);
            res.send(inschrijving);
        } else {
            res.status(400).send("No id provided");
        }
    });
}
