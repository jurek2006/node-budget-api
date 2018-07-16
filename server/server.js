const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Witaj w node-budget-app');
});


if(!module.parent){
    app.listen(3000, () => console.log('Server sterted on port 3000'));
}

module.exports = {app}