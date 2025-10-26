import { verifyAdmin } from "../../util/jwt-auth.js";
const url = "/api/role";

export default function RoleAPI(app, database) {
    app.get(url, async (req, res) => {
        // Verify user is authenticated (not necessarily admin) to load roles
        if (!req.query.token) {
            return res.status(401).send("Token required");
        }
        
        if (req.query.id) {
            // Get specific role by id
            const role = (await database.query("SELECT * FROM role WHERE id = ?", [req.query.id]))[0];
            res.send(role);
        } else {
            // Get all roles
            const roles = await database.query("SELECT * FROM role ORDER BY id");
            res.send(roles);
        }
    });

    app.post(url, async (req, res) => {
        if (!(await verifyAdmin(req.query.token))) return res.status(401).send("Unauthorized");
        const requiredFields = ['name'];
        const hasAllRequiredFields = requiredFields.every(field => req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== '');

        if (hasAllRequiredFields) {
            const role = await database.query(
                "INSERT INTO role (name) VALUES (?)",
                [req.body.name]
            );
            res.send(role);
        } else {
            res.status(400).send("One or more required fields are missing");
        }
    });

    app.put(url, async (req, res) => {
        if (!(await verifyAdmin(req.query.token))) return res.status(401).send("Unauthorized");
        const requiredFields = ['id', 'name'];
        const hasAllRequiredFields = requiredFields.every(field => req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== '');

        if (hasAllRequiredFields) {
            const role = await database.query(
                "UPDATE role SET name = ? WHERE id = ?",
                [req.body.name, req.body.id]
            );
            res.send(role);
        } else {
            res.status(400).send("One or more required fields are missing");
        }
    });

    app.delete(url, async (req, res) => {
        if (!(await verifyAdmin(req.query.token))) return res.status(401).send("Unauthorized");
        if (req.query.id) {
            const gebruikers = await database.query("SELECT * FROM gebruiker WHERE role = ?", [req.query.id]);
            if (gebruikers.length > 0) {
                res.status(400).send("Er zijn nog gebruikers met deze rol");
                return;
            }

            const role = await database.query("DELETE FROM role WHERE id = ?", [req.query.id]);
            res.send(role);
        } else {
            res.status(400).send("No id provided");
        }
    });
}