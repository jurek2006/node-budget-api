const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');

const {Test} = require('./../../models/test');
const {User} = require('./../../models/user');

const tests = [
    {_id: new ObjectID(), text: 'First test item'},
    {_id: new ObjectID(), text: 'Second test item'}
];

const populateTests = done => {
    Test.remove({}).then(() => {
        return Test.insertMany(tests);
    }).then(() => done());
}

const userOneId = new ObjectID();
const userTwoId = new ObjectID();
const users = [{
    _id: userOneId,
    email: 'valid@node.pl',
    password: 'topSecret',
    tokens: [{
            access: 'auth',
            token: jwt.sign({_id: userOneId.toHexString(), access: 'auth'}, process.env.JWT_SECRET).toString()
    }]
}, {
    _id: userTwoId,
    email: 'notvalid@node.pl',
    password: 'jakieshaslo',
}];

const populateUsers = done => {
    User.remove({}).then(() => {
        const userOne = new User(users[0]).save();
        const userTwo = new User(users[1]).save();
        return Promise.all([userOne, userTwo]);
    }).then(() => done());
};


module.exports = {tests, populateTests, users, populateUsers};