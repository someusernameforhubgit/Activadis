import { verifyAdmin } from "../../util/jwt-auth.js";
const url = "/api/activiteit";

export default function ActiviteitAPI(app, database) {
    app.get(url, async (req, res) => {
        if (req.query.id) {
            const activiteit = (await database.query("SELECT * FROM activiteit WHERE id = ? AND hidden = 0", [req.query.id]))[0];
            if (activiteit) {
                // Fetch corresponding images for this activity
                const afbeeldingen = await database.query("SELECT * FROM afbeeldingen WHERE activiteitId = ?", [activiteit.id]);
                activiteit.afbeeldingen = afbeeldingen;
            }
            res.send(activiteit);
        } else {
            const activiteiten = await database.query("SELECT * FROM activiteit WHERE hidden = 0");
            // Fetch images for each activity
            for (let activiteit of activiteiten) {
                const afbeeldingen = await database.query("SELECT * FROM afbeeldingen WHERE activiteitId = ?", [activiteit.id]);
                activiteit.afbeeldingen = afbeeldingen;
            }
            res.send(activiteiten);
        }
    });

    app.post(url, async (req, res) => {
        if (!(await verifyAdmin(req.query.token))) return res.status(401).send("Unauthorized");
        
        const requiredFields = ['naam', 'locatie', 'omschrijving', 'begin', 'eind', 'kost', 'max', 'min'];
        
        // Check required fields (excluding eten since it can be 0/false)
        const missingFields = requiredFields.filter(field => {
            const value = req.body[field];
            return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
        });

        // Validate eten field specifically (can be 0, 1, true, false)
        if (req.body.eten === undefined || req.body.eten === null) {
            missingFields.push('eten');
        }

        if (missingFields.length === 0) {
            try {
                const activiteit = await database.query(
                    "INSERT INTO activiteit (naam, locatie, eten, omschrijving, begin, eind, kost, max, min, afbeelding, hidden) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
                    [req.body.naam, req.body.locatie, req.body.eten, req.body.omschrijving, req.body.begin, req.body.eind, req.body.kost, req.body.max, req.body.min, req.body.afbeelding, req.body.hidden ? 1 : 0]
                );
                res.send(activiteit);
            } catch (error) {
                console.error('Database error:', error);
                res.status(500).send("Database error occurred while creating activity");
            }
        } else {
            console.log("Missing fields:", missingFields, "Request body:", req.body);
            res.status(400).send("One or more required fields are missing: " + missingFields.join(", "));
        }
    });

    app.put(url, async (req, res) => {
        if (!(await verifyAdmin(req.query.token))) return res.status(401).send("Unauthorized");
        
        const requiredFields = ['id', 'naam', 'locatie', 'omschrijving', 'begin', 'eind', 'kost', 'max', 'min'];
        
        // Check required fields (excluding eten and hidden since they can be 0/false)
        const missingFields = requiredFields.filter(field => {
            const value = req.body[field];
            return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
        });

        // Validate eten and hidden fields specifically (can be 0, 1, true, false)
        if (req.body.eten === undefined || req.body.eten === null) {
            missingFields.push('eten');
        }
        if (req.body.hidden === undefined || req.body.hidden === null) {
            missingFields.push('hidden');
        }
        
        if (missingFields.length === 0) {
            try {
                const activiteit = await database.query(
                    "UPDATE activiteit SET naam = ?, locatie = ?, eten = ?, omschrijving = ?, begin = ?, eind = ?, kost = ?, max = ?, min = ?, afbeelding = ?, hidden = ? WHERE id = ?", 
                    [req.body.naam, req.body.locatie, req.body.eten, req.body.omschrijving, req.body.begin, req.body.eind, req.body.kost, req.body.max, req.body.min, req.body.afbeelding, req.body.hidden ? 1 : 0, req.body.id]
                );
                res.send(activiteit);
            } catch (error) {
                console.error('Database error:', error);
                res.status(500).send("Database error occurred while updating activity");
            }
        } else {
            console.log("Missing fields:", missingFields, "Request body:", req.body);
            res.status(400).send("One or more required fields are missing: " + missingFields.join(", "));
        }
    });

    app.delete(url, async (req, res) => {
        if (!(await verifyAdmin(req.query.token))) return res.status(401).send("Unauthorized");
        if (req.query.id) {
            const activiteit = await database.query("DELETE FROM activiteit WHERE id = ?", [req.query.id]);
            res.send(activiteit);
        } else {
            res.status(400).send("No id provided");
        }
    });
}
