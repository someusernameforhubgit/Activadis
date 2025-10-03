import 'dotenv/config'
import express from 'express';
import api from './database/api/api.js';
const port = process.env.PORT || 3000;
const app = express();
app.use(express.json());

app.use(express.static('gebruiker'));
app.use("/beheerder", express.static("beheerder")); 
app.use("/login", express.static("login"));
app.use("/css", express.static("css"));
app.use("/img", express.static("img"));
app.use("/reset", express.static("reset"));
app.use("/util", express.static("util/public"));

// Serve test page
app.get('/test-newlines', (req, res) => {
    res.sendFile('test-newlines.html', { root: '.' });
});

// Database
api(app);

app.listen(port, () => {
    console.log('Server listening on ' + process.env.PROTOCOL + '://' + process.env.HOSTNAME);
});
