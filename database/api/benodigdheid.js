import {verifyAdmin} from "../../util/jwt-auth.js";

const url = "/api/benodigdheid";

export default function BenodigdheidAPI(app, database) {
    app.get(url, async (req, res) => {
        if (req.query.id) {
            const benodigdheid = (await database.query("SELECT * FROM benodigdheid WHERE id = ?", [req.query.id]))[0];
            res.send(benodigdheid);
        } else {
            const benodigdheden = await database.query("SELECT * FROM benodigdheid");
            res.send(benodigdheden);
        }
    });

    app.post(url, async (req, res) => {
        if (!(await verifyAdmin(req.query.token))) return res.status(401).send("Unauthorized");
        if (req.body.naam && req.body.activiteit) {
            const benodigdheid = await database.query("INSERT INTO benodigdheid (naam, activiteit) VALUES (?, ?)", [req.body.naam, req.body.activiteit]);
            res.send(benodigdheid);
        } else {
            res.status(400).send("One or more required fields are missing");
        }
    });

    app.put(url, async (req, res) => {
        if (!(await verifyAdmin(req.query.token))) return res.status(401).send("Unauthorized");
        if (req.body.id && req.body.naam && req.body.activiteit) {
            const benodigdheid = await database.query("UPDATE benodigdheid SET naam = ?, activiteit = ? WHERE id = ?", [req.body.naam, req.body.activiteit, req.body.id]);
            res.send(benodigdheid);
        } else {
            res.status(400).send("One or more required fields are missing");
        }
    });

    app.delete(url, async (req, res) => {
        if (!(await verifyAdmin(req.query.token))) return res.status(401).send("Unauthorized");
        if (req.query.id) {
            const benodigdheid = await database.query("DELETE FROM benodigdheid WHERE id = ?", [req.query.id]);
            res.send(benodigdheid);
        } else {
            res.status(400).send("No id provided");
        }
    });
}
