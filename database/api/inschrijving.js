import {verifyAdmin, verifyToken} from "../../util/jwt-auth.js";
import jwt from "jsonwebtoken";
import mail from "../../util/mail.js";
const url = "/api/inschrijving";

export default function InschrijvingAPI(app, database) {
    app.get(url, async (req, res) => {
        if (req.query.id) {
            const verifiedId = (await verifyToken(req.query.token)).id;
            if (verifiedId !== parseInt(req.query.id) && !(await verifyAdmin(req.query.token))) return res.status(401).send("Unauthorized");
            const inschrijving = (await database.query("SELECT * FROM inschrijving WHERE id = ?", [req.query.id]))[0];
            res.send(inschrijving);
        } else if (req.query.gebruiker) {
            const verifiedId = (await verifyToken(req.query.token)).id;
            if (verifiedId !== parseInt(req.query.gebruiker) && !(await verifyAdmin(req.query.token))) return res.status(401).send("Unauthorized");
            const inschrijvingen = await database.query("SELECT * FROM inschrijving WHERE gebruiker = ?", [req.query.gebruiker]);
            res.send(inschrijvingen);
        } else if (req.query.activiteit) {
            const inschrijvingen = await database.query("SELECT * FROM inschrijving WHERE activiteit = ?", [req.query.activiteit]);
            res.send(inschrijvingen);
        } else {
            if (!(await verifyAdmin(req.query.token))) return res.status(401).send("Unauthorized");
            const inschrijvingen = await database.query("SELECT * FROM inschrijving");
            res.send(inschrijvingen);
        }
    });

    app.post(url, async (req, res) => {
        const requiredFields = ['gebruiker', 'activiteit'];
        const hasAllRequiredFields = requiredFields.every(field =>
            req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== ''
        );

        const verifiedId = (await verifyToken(req.query.token)).id;
        if (verifiedId !== parseInt(req.body.gebruiker)) return res.status(401).send("Unauthorized");
        
        if (hasAllRequiredFields) {
            try {
                const inschrijving = await database.query(
                    "INSERT INTO inschrijving (gebruiker, activiteit, notitie) VALUES (?, ?, ?)", 
                    [req.body.gebruiker, req.body.activiteit, req.body.notitie || null]
                );
                res.send(inschrijving);
                const reset_link = `${process.env.PROTOCOL}://${process.env.HOSTNAME}/activiteit.html?id=${req.body.activiteit}`;
                const email = (await database.query("SELECT email FROM gebruiker WHERE id = ?", [req.body.gebruiker]))[0].email;
                const activiteitNaam = (await database.query("SELECT naam FROM activiteit WHERE id = ?", [req.body.activiteit]))[0].naam;

                await mail(
                    email,
                    "Inschrijving",
                    `
                    <h1>U bent ingeschreven voor een activiteit</h1><br>
                    <p>U bent ingeschreven voor de activiteit <a href="${reset_link}">${activiteitNaam}</a></p>
                    <p>U kunt zich uitschrijven door op de knop te klikken.</p>
                    `
                );
            } catch (error) {
                console.error('Error creating inschrijving:', error);
                res.status(500).send("Error creating inschrijving");
            }
        } else {
            res.status(400).send("One or more required fields are missing");
        }
    });

    app.put(url, async (req, res) => {
        if (!(await verifyAdmin(req.query.token))) return res.status(401).send("Unauthorized");
        const requiredFields = ['id', 'gebruiker', 'activiteit'];
        const hasAllRequiredFields = requiredFields.every(field => 
            req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== ''
        );
        
        if (hasAllRequiredFields) {
            try {
                const inschrijving = await database.query(
                    "UPDATE inschrijving SET gebruiker = ?, activiteit = ?, notitie = ? WHERE id = ?", 
                    [req.body.gebruiker, req.body.activiteit, req.body.notitie || null, req.body.id]
                );
                res.send(inschrijving);
            } catch (error) {
                console.error('Error updating inschrijving:', error);
                res.status(500).send("Error updating inschrijving");
            }
        } else {
            res.status(400).send("One or more required fields are missing");
        }
    });

    app.delete(url, async (req, res) => {
        const requiredFields = ['gebruiker', 'activiteit'];
        const hasAllRequiredFields = requiredFields.every(field =>
            req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== ''
        );

        const verifiedId = (await verifyToken(req.query.token)).id;
        if (verifiedId !== parseInt(req.body.gebruiker)) return res.status(401).send("Unauthorized");

        if (hasAllRequiredFields) {
            const inschrijving = await database.query("DELETE FROM inschrijving WHERE gebruiker = ? AND activiteit = ?", [req.body.gebruiker, req.body.activiteit]);
            res.send(inschrijving);

            const reset_link = `${process.env.PROTOCOL}://${process.env.HOSTNAME}/activiteit.html?id=${req.body.activiteit}`;
            const email = (await database.query("SELECT email FROM gebruiker WHERE id = ?", [req.body.gebruiker]))[0].email;
            const activiteitNaam = (await database.query("SELECT naam FROM activiteit WHERE id = ?", [req.body.activiteit]))[0].naam;

            await mail(
                email,
                "Uitschrijving",
                `
                    <h1>U bent uitgeschreven voor een activiteit</h1><br>
                    <p>U bent uitgeschreven voor de activiteit <a href="${reset_link}">${activiteitNaam}</a></p>
                    <p>U kunt zich opnieuw inschrijven door op de knop te klikken.</p>
                    `
            );
        } else {
            res.status(400).send("No id provided");
        }
    });
}
