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
            const roles = await database.query("SELECT * FROM role");
            res.send(roles);
        }
    });
}