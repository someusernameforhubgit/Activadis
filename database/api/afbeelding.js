import { verifyAdmin } from "../../util/jwt-auth.js";
const url = "/api/afbeelding";

export default function AfbeeldingAPI(app, database) {
    app.get(url, async (req, res) => {
        if (req.query.id) {
            const afbeelding = (await database.query("SELECT * FROM afbeeldingen WHERE id = ?", [req.query.id]))[0];
            res.send(afbeelding);
        }else if (req.query.activiteitId) {
            const afbeeldingen = await database.query("SELECT * FROM afbeeldingen WHERE activiteitId = ?", [req.query.activiteitId]);
            res.send(afbeeldingen);
        } else {
            const afbeeldingen = (await database.query("SELECT * FROM afbeeldingen"));
            res.send(afbeeldingen);
        }
    });

    app.post(url, async (req, res) => {
        if (!(await verifyAdmin(req.query.token))) return res.status(401).send("Unauthorized");
        const requiredFields = ['activiteitId', 'afbeeldingUrl'];
        const hasAllRequiredFields = requiredFields.every(field => req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== '');
        if (hasAllRequiredFields) {
            const afbeelding = await database.query("INSERT INTO afbeeldingen (activiteitId, afbeeldingUrl) VALUES (?, ?)", [req.body.activiteitId, req.body.afbeeldingUrl]);
            res.send(afbeelding);
        } else {
            res.status(400).send("One or more required fields are missing");
        }
    });

    app.put(url, async (req, res) => {
        if (!(await verifyAdmin(req.query.token))) return res.status(401).send("Unauthorized");
        const requiredFields = ['id', 'activiteitId', 'afbeeldingUrl'];
        const hasAllRequiredFields = requiredFields.every(field => req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== '');
        
        if (hasAllRequiredFields) {
            const afbeelding = await database.query(
                "UPDATE afbeeldingen SET activiteitId = ?, afbeeldingUrl = ? WHERE id = ?", 
                [req.body.activiteitId, req.body.afbeeldingUrl, req.body.id]
            );
            res.send(afbeelding);
        } else {
            res.status(400).send("One or more required fields are missing");
        }
    });

    app.delete(url, async (req, res) => {
        if (!(await verifyAdmin(req.query.token))) return res.status(401).send("Unauthorized");
        if (req.query.id) {
            const afbeelding = await database.query("DELETE FROM afbeeldingen WHERE id = ?", [req.query.id]);
            res.send(afbeelding);
        } else {
            res.status(400).send("No id provided");
        }
    });
}
