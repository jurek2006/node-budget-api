require('./config/config.js');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
const port = process.env.PORT;

app.get('/', (req, res) => {
    res.send('Witaj w node-budget-app');
});


if(!module.parent){
    app.listen(port, () => {
        console.log(`Server sterted on port ${port}`);
    });
}

module.exports = {app}