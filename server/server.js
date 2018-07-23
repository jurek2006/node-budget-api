require('./config/config.js');
const express = require('express');
const bodyParser = require('body-parser');

const {mongoose} = require('./db/mongoose');
const {Test} = require('./models/test');

const app = express();
app.use(bodyParser.json());
const port = process.env.PORT;

app.get('/', (req, res) => {
    res.send('Witaj w node-budget-app');
});

app.post('/test', (req, res) => {
    const newTest = new Test({
        text: req.body.text
    });

    newTest.save()
    .then(doc => {
        res.send(doc)
    })
    .catch(err => {
        res.status(400).send(err);
    });

});


if(!module.parent){
    app.listen(port, () => {
        console.log(`Server sterted on port ${port}`);
    });
}

module.exports = {app}