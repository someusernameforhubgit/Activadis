import {verifyAdmin, verifyToken} from "../../util/jwt-auth.js";
import jwt from "jsonwebtoken";
import mail, {templates} from "../../util/mail.js";
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
            const includeDetails = req.query.includeDetails === 'true';
            const registrations = await database.query(
                `SELECT i.*, 
                        g.firstname AS internalFirstname,
                        g.lastname AS internalLastname,
                        g.email AS internalEmail,
                        e.voornaam AS externalFirstname,
                        e.achternaam AS externalLastname,
                        e.email AS externalEmail
                 FROM inschrijving i
                 LEFT JOIN gebruiker g ON g.id = i.gebruiker
                 LEFT JOIN externen e ON e.id = i.externe
                 WHERE i.activiteit = ?`,
                [req.query.activiteit]
            );

            let verifiedUser = null;
            let isAdmin = false;
            if (req.query.token) {
                verifiedUser = await verifyToken(req.query.token);
                isAdmin = await verifyAdmin(req.query.token);
            }

            let showParticipantsSetting = 0;
            if (includeDetails && !isAdmin && verifiedUser) {
                const setting = await database.query(
                    "SELECT showParticipants FROM activiteit WHERE id = ?",
                    [req.query.activiteit]
                );
                if (setting && setting.length > 0) {
                    showParticipantsSetting = Number(setting[0].showParticipants) === 1 ? 1 : 0;
                }
            }

            const allowDetails = Boolean(
                includeDetails && (
                    isAdmin ||
                    (verifiedUser && verifiedUser.id && showParticipantsSetting === 1)
                )
            );
            const allowEmails = isAdmin;

            const sanitized = registrations.map((reg) => {
                const participantType = reg.gebruiker ? 'internal' : 'external';
                const canShowName = allowDetails && (participantType === 'internal' || isAdmin);

                let displayName = null;
                let initials = null;
                let email = null;

                if (participantType === 'internal' && reg.internalFirstname && reg.internalLastname && canShowName) {
                    displayName = `${reg.internalFirstname} ${reg.internalLastname}`.trim();
                    initials = `${reg.internalFirstname.charAt(0)}${reg.internalLastname.charAt(0)}`.toUpperCase();
                    if (allowEmails && reg.internalEmail) {
                        email = reg.internalEmail;
                    }
                } else if (participantType === 'external' && canShowName && reg.externalFirstname && reg.externalLastname) {
                    displayName = `${reg.externalFirstname} ${reg.externalLastname}`.trim();
                    initials = `${reg.externalFirstname.charAt(0)}${reg.externalLastname.charAt(0)}`.toUpperCase();
                    if (allowEmails && reg.externalEmail) {
                        email = reg.externalEmail;
                    }
                }

                const {
                    internalFirstname,
                    internalLastname,
                    internalEmail,
                    externalFirstname,
                    externalLastname,
                    externalEmail,
                    ...rest
                } = reg;

                return {
                    ...rest,
                    participantType,
                    participantName: displayName,
                    participantInitials: initials,
                    participantEmail: email
                };
            });

            res.send(sanitized);
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
                    [req.body.gebruiker, req.body.activiteit, req.body.opmerking || null]
                );
                res.send(inschrijving);
                const reset_link = `${process.env.PROTOCOL}://${process.env.HOSTNAME}/activiteit/${req.body.activiteit}`;
                const email = (await database.query("SELECT email FROM gebruiker WHERE id = ?", [req.body.gebruiker]))[0].email;
                const activiteitNaam = (await database.query("SELECT naam FROM activiteit WHERE id = ?", [req.body.activiteit]))[0].naam;

                const emailC = templates.activitySignedUp(activiteitNaam, reset_link);
                await mail(
                    email,
                    emailC.subject,
                    emailC.content
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

            const activiteitNaam = (await database.query("SELECT naam FROM activiteit WHERE id = ?", [req.body.activiteit]))[0].naam;

            if (existingInschrijving.length > 0) {
                // res.status(409).send("You are already registered for this activity");
                const emailC = templates.alreadySignedUp(activiteitNaam);
                await mail(
                    req.body.email,
                    emailC.subject,
                    emailC.content
                );
                res.send("Inschrijving aangebracht");
                return;
            }

            const token = await jwt.sign({email: req.body.email, voornaam: req.body.voornaam, achternaam: req.body.achternaam, activiteit: req.body.activiteit, opmerking: req.body.opmerking || null, edit: true}, process.env.JWT_SECRET, {expiresIn: "1h"})
            const reset_link = `${process.env.PROTOCOL}://${process.env.HOSTNAME}/activiteit/${req.body.activiteit}?token=${token}`;

            const emailC = templates.confirmSignUp(activiteitNaam, reset_link);
            await mail(
                req.body.email,
                emailC.subject,
                emailC.content
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
                    [externe, decodedToken.activiteit, decodedToken.opmerking || null]
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

            const emailC = templates.activitySignedOut(activiteitNaam);
            await mail(
                email,
                emailC.subject,
                emailC.content
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

            const activiteitNaam = (await database.query("SELECT naam FROM activiteit WHERE id = ?", [req.body.activiteit]))[0].naam;

            if (existingInschrijving.length === 0) {
                // res.status(404).send("You are not registered for this activity");
                const emailC = templates.alreadySignedOut(activiteitNaam);
                await mail(
                    req.body.email,
                    emailC.subject,
                    emailC.content
                );
                res.send("Uitschrijving aangebracht");
                return;
            }

            const token = await jwt.sign({email: req.body.email, activiteit: req.body.activiteit, "delete": true}, process.env.JWT_SECRET, {expiresIn: "1h"})
            const reset_link = `${process.env.PROTOCOL}://${process.env.HOSTNAME}/activiteit/${req.body.activiteit}?token=${token}`;

            const emailC = templates.confirmSignOut(activiteitNaam, reset_link);
            await mail(
                req.body.email,
                emailC.subject,
                emailC.content
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
