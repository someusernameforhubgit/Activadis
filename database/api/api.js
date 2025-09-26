import ActiviteitAPI from "./activiteit.js";
import GebruikerAPI from "./gebruiker.js";
import BenodigdheidAPI from "./benodigdheid.js";
import InschrijvingAPI from "./inschrijving.js";
import LoginAPI from "./login.js";
import Database from "../database.js";
import AfbeeldingAPI from "./afbeelding.js";
const database = await Database.init();

function API(app) {
    app.get("/api", (req, res) => {
        if (database.testConnection()) {
            res.send({
                status: "online",
                requests: database.getRequestCount()
            });
        } else {
            res.status(500).send("Database is offline");
        }
    });
}

function startAPI(app) {
    API(app);
    ActiviteitAPI(app, database);
    GebruikerAPI(app, database);
    BenodigdheidAPI(app, database);
    InschrijvingAPI(app, database);
    LoginAPI(app, database);
    AfbeeldingAPI(app, database);
}

export default startAPI;