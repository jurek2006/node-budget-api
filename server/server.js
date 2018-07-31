require('./config/config.js');
const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');

const {mongoose} = require('./db/mongoose');
const {Test} = require('./models/test');
const {User} = require('./models/user');
const {authenticate} = require('./middleware/authenticate');

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
        console.log(err);
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