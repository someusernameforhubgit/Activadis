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

        const requiredFieldsExternal = ['voornaam', 'achternaam', 'email', 'activiteit'];
        const hasAllRequiredFieldsExternal = requiredFieldsExternal.every(field =>
            req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== ''
        );

        const requiredFieldsToken = ['activiteit', 'token'];
        const hasAllRequiredFieldsToken = requiredFieldsToken.every(field =>
            req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== ''
        );
        
        if (hasAllRequiredFields) {
            const verifiedId = (await verifyToken(req.query.token)).id;
            if (verifiedId !== parseInt(req.body.gebruiker)) return res.status(401).send("Unauthorized");
            try {
                const inschrijving = await database.query(
                    "INSERT INTO inschrijving (gebruiker, activiteit, notitie) VALUES (?, ?, ?)", 
                    [req.body.gebruiker, req.body.activiteit, req.body.notitie || null]
                );
                res.send(inschrijving);
                const reset_link = `${process.env.PROTOCOL}://${process.env.HOSTNAME}/activiteit/${req.body.activiteit}`;
                const email = (await database.query("SELECT email FROM gebruiker WHERE id = ?", [req.body.gebruiker]))[0].email;
                const activiteitNaam = (await database.query("SELECT naam FROM activiteit WHERE id = ?", [req.body.activiteit]))[0].naam;

                await mail(
                    email,
                    "Inschrijving",
                    `
                    <h1>U bent ingeschreven voor ${activiteitNaam}</h1><br>
                    <p>U bent ingeschreven voor de activiteit <a href="${reset_link}">${activiteitNaam}</a></p>
                    <p>U kunt zich uitschrijven door op de link te klikken.</p>
                    `
                );
            } catch (error) {
                console.error('Error creating inschrijving:', error);
                res.status(500).send("Error creating inschrijving");
            }
        } else if (hasAllRequiredFieldsExternal) {
            const existingUser = await database.query(
                "SELECT * FROM gebruiker WHERE LOWER(email) = LOWER(?)",
                [req.body.email]
            );

            if (existingUser.length > 0) {
                res.status(409).send("A user with this email exists, log in if this is you.");
                return;
            }

            const existingInschrijving = await database.query(
                "SELECT * FROM inschrijving WHERE externe IN (SELECT id FROM externen WHERE LOWER(email) = LOWER(?))",
                [req.body.email]
            );

            if (existingInschrijving.length > 0) {
                res.status(409).send("You are already registered for this activity");
                return;
            }

            const token = await jwt.sign({email: req.body.email, voornaam: req.body.voornaam, achternaam: req.body.achternaam, activiteit: req.body.activiteit, edit: true}, process.env.JWT_SECRET, {expiresIn: "1h"})
            const reset_link = `${process.env.PROTOCOL}://${process.env.HOSTNAME}/activiteit.html?id=${req.body.activiteit}&token=${token}`;
            const activiteitNaam = (await database.query("SELECT naam FROM activiteit WHERE id = ?", [req.body.activiteit]))[0].naam;

            await mail(
                req.body.email,
                `Inschrijving voor ${activiteitNaam}`,
                `
                    <h1>U wilt u inschrijven voor ${activiteitNaam}</h1><br>
                    <p>Om dit te bevestigen klik <a href="${reset_link}">hier</a></p>
                    <p>Als U dit niet was, dan kan U deze email negeren.</p>
                    `
            );
            res.send("Inschrijving aangebracht");
        } else if (hasAllRequiredFieldsToken) {
            try {
                const decodedToken = await jwt.verify(req.body.token, process.env.JWT_SECRET);
                if (!decodedToken.edit) {
                    res.status(400).send("One or more required fields are missing");
                    return;
                }

                const existingInschrijving = await database.query(
                    "SELECT * FROM inschrijving WHERE externe IN (SELECT id FROM externen WHERE LOWER(email) = LOWER(?))",
                    [decodedToken.email]
                );

                if (existingInschrijving.length > 0) {
                    res.status(409).send("You are already registered for this activity");
                    return;
                }

                const externe = await database.query(
                    "INSERT INTO externen (voornaam, achternaam, email) VALUES (?, ?, ?)",
                    [decodedToken.voornaam, decodedToken.achternaam, decodedToken.email]
                );

                const inschrijving = await database.query(
                    "INSERT INTO inschrijving (externe, activiteit, notitie) VALUES (?, ?, ?)",
                    [externe, decodedToken.activiteit, null]
                );
                res.send(inschrijving);
            } catch (e) {
                console.error(e);
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

        const requiredFieldsExternen = ['email', 'activiteit'];
        const hasAllRequiredFieldsExternen = requiredFieldsExternen.every(field =>
            req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== ''
        );

        const requiredFieldsToken = ['token', 'activiteit'];
        const hasAllRequiredFieldsToken = requiredFieldsToken.every(field =>
            req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== ''
        );

        if (hasAllRequiredFields) {
            const verifiedId = (await verifyToken(req.query.token)).id;
            if (verifiedId !== parseInt(req.body.gebruiker)) return res.status(401).send("Unauthorized");

            const inschrijving = await database.query("DELETE FROM inschrijving WHERE gebruiker = ? AND activiteit = ?", [req.body.gebruiker, req.body.activiteit]);
            res.send(inschrijving);

            const reset_link = `${process.env.PROTOCOL}://${process.env.HOSTNAME}/activiteit/${req.body.activiteit}`;
            const email = (await database.query("SELECT email FROM gebruiker WHERE id = ?", [req.body.gebruiker]))[0].email;
            const activiteitNaam = (await database.query("SELECT naam FROM activiteit WHERE id = ?", [req.body.activiteit]))[0].naam;

            await mail(
                email,
                "Uitschrijving",
                `
                    <h1>U bent uitgeschreven voor ${activiteitNaam}</h1><br>
                    `
            );
        } else if (hasAllRequiredFieldsExternen) {
            const existingUser = await database.query(
                "SELECT * FROM gebruiker WHERE LOWER(email) = LOWER(?)",
                [req.body.email]
            );

            if (existingUser.length > 0) {
                res.status(409).send("A user with this email exists, log in if this is you.");
                return;
            }

            const existingInschrijving = await database.query(
                "SELECT * FROM inschrijving WHERE externe IN (SELECT id FROM externen WHERE LOWER(email) = LOWER(?))",
                [req.body.email]
            );

            if (existingInschrijving.length === 0) {
                res.status(404).send("You are not registered for this activity");
                return;
            }

            const token = await jwt.sign({email: req.body.email, activiteit: req.body.activiteit, "delete": true}, process.env.JWT_SECRET, {expiresIn: "1h"})
            const reset_link = `${process.env.PROTOCOL}://${process.env.HOSTNAME}/activiteit.html?id=${req.body.activiteit}&token=${token}`;
            const activiteitNaam = (await database.query("SELECT naam FROM activiteit WHERE id = ?", [req.body.activiteit]))[0].naam;

            await mail(
                req.body.email,
                `Uitschrijving voor ${activiteitNaam}`,
                `
                    <h1>U wilt u uitschrijven voor ${activiteitNaam}</h1><br>
                    <p>Om dit te bevestigen klik <a href="${reset_link}">hier</a></p>
                    <p>Als U dit niet was, dan kan U deze email negeren.</p>
                    `
            );
            res.send("Uitschrijving aangebracht");
        } else if (hasAllRequiredFieldsToken) {
            try {
                const decodedToken = await jwt.verify(req.body.token, process.env.JWT_SECRET);
                if (!decodedToken.delete) {
                    res.status(400).send("One or more required fields are missing");
                    return;
                }

                const existingInschrijving = await database.query(
                    "SELECT * FROM inschrijving WHERE externe IN (SELECT id FROM externen WHERE LOWER(email) = LOWER(?))",
                    [decodedToken.email]
                );

                await database.query(
                    "DELETE FROM inschrijving WHERE externe = ? AND activiteit = ?",
                    [existingInschrijving[0].externe, existingInschrijving[0].activiteit]
                );

                await database.query(
                    "DELETE from externen WHERE id = ?",
                    [existingInschrijving[0].externe]
                );

                res.send();
            } catch (e) {
                console.error(e);
                res.status(500).send("Error creating inschrijving");
            }
        } else {
            res.status(400).send("No id provided");
        }
    });
}
