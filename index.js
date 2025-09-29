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

// Serve test page
app.get('/test-newlines', (req, res) => {
    res.sendFile('test-newlines.html', { root: '.' });
});

app.get('/aankomend', (req, res) => {
    res.sendFile('aankomend.html', { root: './gebruiker' });
});

app.get('/ingeschreven', (req, res) => {
    res.sendFile('ingeschreven.html', { root: './gebruiker' });
});

app.get('/verleden', (req, res) => {
    res.sendFile('verleden.html', { root: './gebruiker' });
});

// Database
api(app);

app.listen(port, () => {
    console.log('Server listening on ' + process.env.PROTOCOL + '://' + process.env.HOSTNAME);
});
