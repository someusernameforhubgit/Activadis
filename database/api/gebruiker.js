import crypto from "crypto";
import mail from "../../util/mail.js";
import jwt from "jsonwebtoken";
import { verifyToken, verifyAdmin } from "../../util/jwt-auth.js";
const url = "/api/gebruiker";

export default function GebruikerAPI(app, database) {
    app.get(url, async (req, res) => {
        if (req.query.id) {
            const verifiedId = (await verifyToken(req.query.token)).id;
            if (verifiedId !== parseInt(req.query.id) && !(await verifyAdmin(req.query.token))) return res.status(401).send("Unauthorized");
            const gebruiker = (await database.query("SELECT * FROM gebruiker WHERE id = ?", [req.query.id]))[0];
            res.send(gebruiker);
        } else {
            if (!(await verifyAdmin(req.query.token))) return res.status(401).send("Unauthorized");
            const gebruikers = await database.query("SELECT * FROM gebruiker");
            res.send(gebruikers);
        }
    });

    app.get(url + "/reset", async (req, res) => {
        if (req.query.email) {
            const gebruiker = (await database.query("SELECT * FROM gebruiker WHERE email = ?", [req.query.email]))[0];
            if (!gebruiker) return res.status(404).send("User not found");
            const reset_token = jwt.sign(
                { id: gebruiker.id, email: gebruiker.email, reset: true },
                process.env.JWT_SECRET,
                { expiresIn: "15m" }
            );
            const reset_link = `${process.env.PROTOCOL}://${process.env.HOSTNAME}/login?reset_token=${reset_token}`;

            await mail(
                req.query.email,
                "Wachtwoord resetten",
                `
                    <h1>Wachtwoord resetten</h1><br>
                    <p>Er is een wachtwoord reset voor uw email aangevraagd.</p>
                    <p>Was U dit niet? dan kunt u deze link negeren.</p>
                    <p>Als U dit was was kunt u <a href="${reset_link}">hier</a> uw wachtwoord resetten.</p>
                    <p>Deze link verloopt over 15 minuten.</p>
                    `
            );
            res.send("Reset link gestuurd");
        } else {
            res.status(400).send("No id provided");
        }
    });

    app.post(url, async (req, res) => {
        console.log("POST /api/gebruiker - Request body:", req.body);
        
        if (!(await verifyAdmin(req.query.token))) {
            return res.status(401).send("Unauthorized");
        }

        const requiredFields = ['email', 'firstname', 'lastname'];

        // ✅ Collect missing or empty fields (also trims strings)
        const missingFields = requiredFields.filter(field => {
            const value = req.body[field];
            return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
        });

        if (missingFields.length > 0) {
            console.warn("Missing fields:", missingFields, "Body:", req.body);
            return res.status(400).send("One or more required fields are missing: " + missingFields.join(", "));
        }

        try {
            // ✅ Check if email already exists
            const existingUser = await database.query(
                "SELECT id FROM gebruiker WHERE email = ?",
                [req.body.email]
            );

            if (existingUser.length > 0) {
                return res.status(400).send("Email is already in use");
            }

            // ✅ Insert new user
            const isAdmin = req.body.admin === '1' ? 1 : 0;
            
            console.log("Raw role value from request:", req.body.role, "Type:", typeof req.body.role);
            
            // Handle role: use 0 for no selection, otherwise use the actual role ID
            let role = 0; // Default to 0 instead of null
            console.log('role id from request body:', req.body.role);
            if (req.body.role && req.body.role !== '') {
                role = parseInt(req.body.role); // Convert to integer since it's a role ID
                console.log("Parsed role value:", role);
            } else {
                console.log("No role selected, using default value 0");
            }
            
            console.log("Final values - role:", role, "isAdmin:", isAdmin);
            console.log("About to insert with values:", {
                email: req.body.email,
                firstname: req.body.firstname, 
                lastname: req.body.lastname,
                isAdmin: isAdmin,
                role: role
            });
            
            // Direct insert without try/catch since we're not using NULL
            const gebruiker = await database.query(
                "INSERT INTO gebruiker (email, firstname, lastname, isAdmin, role) VALUES (?, ?, ?, ?, ?)",
                [req.body.email, req.body.firstname, req.body.lastname, isAdmin, role]
            );
            
            console.log("Database insert result:", gebruiker);
            
            // Let's also verify what was actually inserted by querying it back
            const insertedUser = await database.query(
                "SELECT * FROM gebruiker WHERE email = ? ORDER BY id DESC LIMIT 1",
                [req.body.email]
            );
            console.log("Inserted user from database:", insertedUser[0]);

            res.send(gebruiker);

            // ✅ Generate reset token
            const reset_token = jwt.sign(
                { id: gebruiker, email: req.body.email, reset: true },
                process.env.JWT_SECRET,
                { expiresIn: "15m" }
            );
            const reset_link = `${process.env.PROTOCOL}://${process.env.HOSTNAME}/login?reset_token=${reset_token}`;

            await mail(
                req.body.email,
                "Account aangemaakt",
                `
            <h1>Account aangemaakt</h1><br>
            <p>Er is een account voor u aangemaakt op Activadis.</p>
            <p>U moet voor u kan inloggen op Activadis een wachtwoord instellen.</p>
            <p>Dit kunt u <a href="${reset_link}">hier</a> doen.</p>
            <p>Deze link verloopt over 15 minuten.</p>
            `
            );
        } catch (error) {
            console.error('Error creating user:', error);
            console.error('Error details:', error.message);
            console.error('Error stack:', error.stack);
            res.status(500).send("Error creating user: " + error.message);
        }
    });

    app.put(url, async (req, res) => {
        const jwtData = await verifyToken(req.query.token);
        if (!(await verifyAdmin(req.query.token)) && !jwtData.jwt.reset) {
            return res.status(401).send("Unauthorized");
        }

        // Different required fields based on whether it's a password reset or admin update
        const isPasswordReset = jwtData.jwt && jwtData.jwt.reset;
        const requiredFields = isPasswordReset
            ? ['id', 'password']
            : ['id', 'email', 'firstname', 'lastname', 'reset'];

        const hasAllRequiredFields = requiredFields.every(field =>
            req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== ''
        );

        if (!hasAllRequiredFields) {
            return res.status(400).send("One or more required fields are missing");
        }

        try {
            if (isPasswordReset) {
                if (!checkPassword(req.body.password)) {
                    return res.status(400).send("Password does not meet requirements");
                }
                const salt = crypto.randomBytes(16).toString("hex");
                const hash = hashPassword(req.body.password, salt);
                await database.query(
                    "UPDATE gebruiker SET hash = ?, salt = ? WHERE id = ?",
                    [hash, salt, req.body.id]
                );
                res.send({ success: true, message: "Password updated successfully" });
            } else {
                if (req.body.reset) {
                    const isAdmin = req.body.admin === '1' ? 1 : 0;
                    let role = null;
                    if (req.body.role && req.body.role !== '') {
                        role = parseInt(req.body.role);
                    }
                    
                    let gebruiker;
                    try {
                        gebruiker = await database.query(
                            "UPDATE gebruiker SET email = ?, firstname = ?, lastname = ?, isAdmin = ?, role = ?, hash = ?, salt = ? WHERE id = ?",
                            [req.body.email, req.body.firstname, req.body.lastname, isAdmin, role, "", "", req.body.id]
                        );
                    } catch (dbError) {
                        if (dbError.message.includes('cannot be null') && role === null) {
                            // Only use 0 if role was actually null (no role selected)
                            gebruiker = await database.query(
                                "UPDATE gebruiker SET email = ?, firstname = ?, lastname = ?, isAdmin = ?, role = ?, hash = ?, salt = ? WHERE id = ?",
                                [req.body.email, req.body.firstname, req.body.lastname, isAdmin, 0, "", "", req.body.id]
                            );
                        } else {
                            throw dbError;
                        }
                    }
                    res.send(gebruiker);

                    const reset_token = jwt.sign(
                        { id: req.body.id, email: req.body.email, reset: true },
                        process.env.JWT_SECRET,
                        { expiresIn: "15m" }
                    );
                    const reset_link = `${process.env.PROTOCOL}://${process.env.HOSTNAME}/login?reset_token=${reset_token}`;

                    await mail(
                        req.body.email,
                        "Wachtwoord resetten",
                        `
                    <h1>Wachtwoord resetten</h1><br>
                    <p>Uw wachtwoord is gereset door een beheerder.</p>
                    <p>U moet voor u weer kan inloggen op Activadis een wachtwoord instellen.</p>
                    <p>Dit kunt u <a href="${reset_link}">hier</a> doen.</p>
                    <p>Deze link verloopt over 15 minuten.</p>
                    `
                    );
                } else {
                    const isAdmin = req.body.admin === '1' ? 1 : 0;
                    let role = null;
                    if (req.body.role && req.body.role !== '') {
                        role = parseInt(req.body.role);
                    }
                    
                    let gebruiker;
                    try {
                        gebruiker = await database.query(
                            "UPDATE gebruiker SET email = ?, firstname = ?, lastname = ?, isAdmin = ?, role = ? WHERE id = ?",
                            [req.body.email, req.body.firstname, req.body.lastname, isAdmin, role, req.body.id]
                        );
                    } catch (dbError) {
                        if (dbError.message.includes('cannot be null') && role === null) {
                            // Only use 0 if role was actually null (no role selected)
                            gebruiker = await database.query(
                                "UPDATE gebruiker SET email = ?, firstname = ?, lastname = ?, isAdmin = ?, role = ? WHERE id = ?",
                                [req.body.email, req.body.firstname, req.body.lastname, isAdmin, 0, req.body.id]
                            );
                        } else {
                            throw dbError;
                        }
                    }
                    res.send(gebruiker);
                }
            }
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).send("Error updating user");
        }
    });

    app.delete(url, async (req, res) => {
        if (!(await verifyAdmin(req.query.token))) return res.status(401).send("Unauthorized");
        if (req.query.id) {
            await database.query("DELETE FROM inschrijving WHERE gebruiker = ?", [req.query.id]);

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

function checkPassword(password) {
    const validations = [
        {
            id: "lengthRestriction",
            isValid: (pwd) => pwd.length >= 8
        },
        {
            id: "uppercaseRestriction",
            isValid: (pwd) => /[A-Z]/.test(pwd)
        },
        {
            id: "numberRestriction",
            isValid: (pwd) => /[0-9]/.test(pwd)
        },
        {
            id: "specialRestriction",
            isValid: (pwd) => /[^a-zA-Z0-9]/.test(pwd)
        }
    ];

    return !validations.some(({ isValid }) => !isValid(password));
}