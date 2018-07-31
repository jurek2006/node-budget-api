const expect = require('expect');
const request = require('supertest');

const {app} = require('./../server');
const {Test} = require('./../models/test');
const {User} = require('./../models/user');
const {tests, populateTests, users, populateUsers} = require('./seed/seed');

beforeEach(populateTests);
beforeEach(populateUsers);

describe('GET /', () => {
    
    it('should get response from route /', (done) => {
        request(app)
        .get('/')
        .expect(200)
        .end(done);
    }); 

});

describe('POST /test', () => {

    it('should create new test in database', done => {
        const newText = 'Tekst testowy';
        
        request(app)
        .post('/test')
        .send({text: newText})
        .expect(200)
        .expect(res => {
            expect(res.body.text).toBe(newText);
        })
        .end((err, res) => {
            if(err){
                return done(err);
            }

            Test.find().then(tests => {
                expect(tests.length).toBe(3);
                expect(tests[2].text).toBe(newText);
                done();
            }).catch(err => done(err));
        });
    });

    it('should not create test in database when invalid data given', done => {
        request(app)
        .post('/test')
        .send({})
        .expect(400)
        .end((err, res) => {
            if(err){
                return done(err);
            }

            Test.find().then(tests => {
                expect(tests.length).toBe(2);
                done();
            }).catch(err => done(err));
        });
    });
});

describe('GET /users/me', () => {
    it('should return user if authenticated', done => {
        request(app)
        .get('/users/me')
        .set('x-auth', users[0].tokens[0].token)
        .expect(200)
        .expect(res => {
            expect(res.body._id).toBe(users[0]._id.toHexString());
            expect(res.body.email).toBe(users[0].email);
        })
        .end(done);
    });

    it('should return 401 if not authenticated', done => {
        request(app)
        .get('/users/me')
        .expect(401)
        .expect(res => {
            expect(res.body).toEqual({});
        })
        .end(done);
    });
});

describe('POST /users', () => {
    it('should create a user', done => {
        const newUser = {
            email: 'tester@testowy.pl',
            password: 'jsk@12345'
        }

        request(app)
        .post('/users')
        .send(newUser)
        .expect(200)
        .expect(res => {
            expect(res.header['x-auth']).toBeDefined();
            expect(res.body._id).toBeDefined();
            expect(res.body.email).toBe(newUser.email);
        })
        .end((err, res) => {
            if(err){
                return done(err);
            }

            User.findOne({email: newUser.email}).then(user => {
                expect(user).toBeDefined();
                expect(user.password.length).toBeGreaterThan(0);
                expect(user.password).not.toBe(newUser.password);
                done();
            }).catch(err => done(err));
        });
    });

    it('should return validation errors if email invalid', done => {
        const newUser = {
            email: 'testertestowy.pl',
            password: 'jsk12345'
        }

        request(app)
        .post('/users')
        .send(newUser)
        .expect(400)
        .end((err, res) => {
            if(err){
                return done(err);
            }

            User.findOne({email: newUser.email}).then(user => {
                expect(user).toBeNull();
                done();
            }).catch(err => done(err));
        });
    });

    it('should return validation errors if password too short', done => {
        const newUser = {
            email: 'tester@testowy.pl',
            password: '12345'
        }

        request(app)
        .post('/users')
        .send(newUser)
        .expect(400)
        .end((err, res) => {
            if(err){
                return done(err);
            }

            User.findOne({email: newUser.email}).then(user => {
                expect(user).toBeNull();
                done();
            }).catch(err => done(err));
        });
    });

    it('should not create user if email is use', done => {
        const newUser = {
            email: users[0].email,
            password: 'jsk12345'
        }

        request(app)
        .post('/users')
        .send(newUser)
        .expect(400)
        .end((err, res) => {
            if(err){
                return done(err);
            }

            User.find({email: newUser.email}).then(users => {
                expect(users.length).toBe(1);
                done();
            }).catch(err => done(err));
        });
    });
});

describe('POST /users/login', () => {
    it('should login user and return auth token', done => {
        request(app)
        .post('/users/login')
        .send({
            email: users[0].email,
            password: users[0].password
        })
        .expect(200)
        .expect(res => {
            expect(res.headers['x-auth']).toBeDefined();
        })
        .end((err, res) => {
            if(err){
                return done(err);
            }

            User.findById(users[0]._id).then(user => {
                expect(user.tokens).toContainEqual(
                    expect.objectContaining({
                        access: 'auth',
                        token: res.headers['x-auth']
                }));
                
                done();
            }).catch(err => done(err));
        });
    });

    it('should reject invalid login', done => {
        request(app)
        .post('/users/login')
        .send({
            email: users[0].email,
            password: 'wrongPass'
        })
        .expect(400)
        .expect(res => {
            expect(res.headers['x-auth']).toBeUndefined();
        })
        .end((err, res) => {
            if(err){
                return done(err);
            }

            User.findById(users[0]._id).then(user => {
                expect(user.tokens.length).toBe(1);
                done();
            }).catch(err => done(err));
        });
    });
});

describe('DELETE /users/me/token', () => {
    it('should remove auth token on logout', done => {
        request(app)
        .delete('/users/me/token')
        .set('x-auth', users[0].tokens[0].token)
        .expect(200)
        .end((err, res) => {
            if(err){
                return done(err);
            }

            User.findById(users[0]._id).then(user => {
                expect(user.tokens.length).toBe(0);
                done();
            }).catch(err => {
                done(err);
            });
        });
    });
});
