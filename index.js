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

// Home Route
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: './gebruiker' });
});

// User Routes
app.get('/aankomend', (req, res) => {
    res.sendFile('aankomend.html', { root: './gebruiker' });
});
app.get('/ingeschreven', (req, res) => {
    res.sendFile('ingeschreven.html', { root: './gebruiker' });
});
app.get('/verleden', (req, res) => {
    res.sendFile('verleden.html', { root: './gebruiker' });
});
app.get('/activiteit/:id', (req, res) => {
    res.sendFile('activiteit.html', { root: './gebruiker' });
});

// Admin Routes
app.get('/beheerder' , (req, res) => {
    res.sendFile('index.html', { root: './beheerder' });
});
app.get('/beheerder/instellingen', (req, res) => {
    res.sendFile('instellingen.html', { root: './beheerder' });
});
app.get('/beheerder/gebruikers', (req, res) => {
    res.sendFile('gebruikers.html', { root: './beheerder' });
});
app.get('/beheerder/gebruikers/new', (req, res) => {
    res.sendFile('gebruiker-edit.html', { root: './beheerder' });
});
app.get('/beheerder/gebruikers/:id', (req, res) => {
    res.sendFile('gebruiker-view.html', { root: './beheerder' });
});
app.get('/beheerder/gebruikers/:id/edit', (req, res) => {
    res.sendFile('gebruiker-edit.html', { root: './beheerder' });
});
app.get('/beheerder/activiteiten', (req, res) => {
    res.sendFile('activiteiten.html', { root: './beheerder' });
});
app.get('/beheerder/activiteiten/new', (req, res) => {
    res.sendFile('activiteit-edit.html', { root: './beheerder' });
});
app.get('/beheerder/activiteiten/:id', (req, res) => {
    res.sendFile('activiteit-view.html', { root: './beheerder' });
});
app.get('/beheerder/activiteiten/:id/edit', (req, res) => {
    res.sendFile('activiteit-edit.html', { root: './beheerder' });
});
app.get('/beheerder/rollen', (req, res) => {
    res.sendFile('rollen.html', { root: './beheerder' });
});
app.get('/beheerder/rollen/new', (req, res) => {
    res.sendFile('rollen-edit.html', { root: './beheerder' });
});
app.get('/beheerder/rollen/:id', (req, res) => {
    res.sendFile('functie-view.html', { root: './beheerder' });
});
app.get('/beheerder/rollen/:id/edit', (req, res) => {
    res.sendFile('rollen-edit.html', { root: './beheerder' });
});

// Database
api(app);

app.listen(port, () => {
    console.log('Server listening on ' + process.env.PROTOCOL + '://' + process.env.HOSTNAME);
});
