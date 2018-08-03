require('./config/config.js');
const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');

const {mongoose} = require('./db/mongoose');
const {Test} = require('./models/test');
const {User} = require('./models/user');
const {BudgetOperation} = require('./models/budgetOperation');
const {authenticate} = require('./middleware/authenticate');
const {ObjectID} = require('mongodb');

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

// ROUTES BUDGET OPERATIONS

// route tworzenia wpisu (operacji) do budżetu dla zautentyfikowanego użytkownika
app.post('/budget/add', authenticate, async (req, res) => {
    try{
        const newOperation = new BudgetOperation({
            value: req.body.value,
            date: req.body.date,
            description: req.body.description,
            _creator: req.user //ustawiane przez authenticate
        });
        
        const operation = await newOperation.save();
        res.send(operation);
    } catch(err){
        res.status(400).send(err);
    }
});

// route pobierania wszystkich operacji dla zautentyfikowanego użytkownika
app.get('/budget', authenticate, async (req, res) => {
    try{
        let allOperations = await BudgetOperation.find({
            _creator: req.user //ustawiane przez authenticate
        });
        res.send(allOperations);
    } catch(err){
        res.status(400).send(err);
    }
});

// route pobierania szczegółów operacji o zadanym id
app.get('/budget/:id', authenticate, async (req, res) => {
    const id = req.params.id;
    if(!ObjectID.isValid(id)){
        return res.status(404).send();
    }
    try{
        const operation = await BudgetOperation.findOne({
            _id: id,
            _creator: req.user //ustawiane przez authenticate
        });
        if(!operation){
            return res.status(404).send();
        }
        res.send({operation});
    } catch(err){
        res.status(400).send(err);
    }
});


// ROUTES USER

// route do tworzenia użytkownika
app.post('/users', (req, res) => {
    const user = new User(_.pick(req.body, ['email', 'password']));

    user.save()
    .then(user => {
        return user.generateAuthToken();
    })
    .then(token => {
        res.header('x-auth', token).send(user);
    })
    .catch(err => {
        res.status(400).send(err);
    });
});

// route do logowania użytkownika
app.post('/users/login', (req, res) => {
    const body = _.pick(req.body, ['email', 'password']);

    // weryfikowanie czy użytkownik o takim email i haśle istnieje
    User.findByCredentials(body.email, body.password).then(user => {
        // utworzenie nowego tokenu dla użytkownika i jego zwrócenie w nagłówku odpowiedzi
        return user.generateAuthToken().then(token => {
            res.header('x-auth', token).send(user);
        });
    }).catch(err => {
        res.status(400).send();
    })
});

// route do wylogowania użytkownika (wymaga autentykacji)
app.delete('/users/me/token', authenticate, (req, res) => {
    req.user.removeToken(req.token).then(() => {
        res.status(200).send();
    }).catch(err => res.status(400).send());
});

// prywatna route GET /users/me - wymaga autentykacji
app.get('/users/me', authenticate, (req, res) => {
    res.send(req.user);
});


if(!module.parent){
    app.listen(port, () => {
        console.log(`Server started on port ${port}`);
    });
}

module.exports = {app}