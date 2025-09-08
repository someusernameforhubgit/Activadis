const express = require('express');
const app = express();

app.use(express.static('gebruiker'));
app.use("/beheerder", express.static("beheerder"));
app.use("/login", express.static("login"));
app.use("/css", express.static("css"));
app.use("/img", express.static("img"));

app.use('/css', express.static('css'));

app.listen(3000, () => {
    console.log('Server listening on http://localhost:3000');
});
