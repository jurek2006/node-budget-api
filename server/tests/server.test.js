const _ = require('lodash');
const expect = require('expect');
const request = require('supertest');

const {app} = require('./../server');
const {Test} = require('./../models/test');
const {User} = require('./../models/user');
const {BudgetOperation} = require('./../models/budgetOperation');
const {tests, populateTests, users, populateUsers, budgetOperations, populateBudgetOperations} = require('./seed/seed');
const {ObjectID} = require('mongodb');

beforeEach(populateTests);
beforeEach(populateUsers);
beforeEach(populateBudgetOperations);


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

describe('POST /budget/add', () => {
    it('should add new budget operation for authenticated user', done => {
        const newOperation = {
            value: 999.11,
            date: '2017-07-18',
            description: "jakiś opis"
        }

        request(app)
        .post('/budget/add')
        .set('x-auth', users[0].tokens[0].token)
        .send(newOperation)
        .expect(200)
        .expect(res => {
            expect(res.body.value).toBe(newOperation.value);
            expect(res.body.description).toBe(newOperation.description);
            expect(new Date(res.body.date)).toEqual(new Date(newOperation.date));
        })
        .end(async (err, res) => {
            if(err){
                return done(err);
            }

            try{
                const allOperations = await BudgetOperation.find({
                    _creator: users[0]._id
                });
                expect(allOperations.length).toBe(3);
                const operationInDB = await BudgetOperation.findById(res.body._id);
                expect(operationInDB.value).toBe(newOperation.value);
                expect(operationInDB.description).toBe(newOperation.description);
                expect(new Date(operationInDB.date)).toEqual(new Date(newOperation.date));
                done();
            } catch(err){done(err)};
            
        });
    });

    it('should return 401 when user not authenticated', done => {
        const newOperation = {
            value: 999.11,
            date: '2017-07-18',
            description: "jakiś opis"
        }

        request(app)
        .post('/budget/add')
        .send(newOperation)
        .expect(401)
        .end(async (err, res) => {
            if(err){
                return done(err);
            }

            try{
                const allOperations = await BudgetOperation.find({});
                expect(allOperations.length).toBe(3);
                done();
            } catch(err){done(err)};
            
        });
    });

    it('should not create budget operation with invalid date', done => {
        const newOperation = {
            value: 999.11,
            date: 'inne',
            description: "jakiś opis"
        }

        request(app)
        .post('/budget/add')
        .set('x-auth', users[0].tokens[0].token)
        .send(newOperation)
        .expect(400)
        .end(async (err, res) => {
            if(err){
                return done(err);
            }

            try{
                const allOperations = await BudgetOperation.find({
                    _creator: users[0]._id
                });
                expect(allOperations.length).toBe(2);
                done();
            } catch(err){
                return done(err);
            }
        });
    });

    it('should not create budget operation without given data', done => {
        const newOperation = {
            value: 999.11,
            description: "jakiś opis"
        }

        request(app)
        .post('/budget/add')
        .set('x-auth', users[0].tokens[0].token)
        .send(newOperation)
        .expect(400)
        .end(async (err, res) => {
            if(err){
                return done(err);
            }

            try{
                const allOperations = await BudgetOperation.find({
                    _creator: users[0]._id
                });
                expect(allOperations.length).toBe(2);
                done();
            } catch(err){
                return done(err);
            }
        });
    });

    it('should not create budget operation with invalid value', done => {
        const newOperation = {
            value: 'wrong',
            date: '2017-07-18',
            description: "jakiś opis"
        }

        request(app)
        .post('/budget/add')
        .set('x-auth', users[0].tokens[0].token)
        .send(newOperation)
        .expect(400)
        .end(async (err, res) => {
            if(err){
                return done(err);
            }

            try{
                const allOperations = await BudgetOperation.find({
                    _creator: users[0]._id
                });
                expect(allOperations.length).toBe(2);
                done();
            } catch(err){
                return done(err);
            }
        });
    });

    it('should not create budget operation without given value', done => {
        const newOperation = {
            date: '2017-07-18',
            description: "jakiś opis"
        }

        request(app)
        .post('/budget/add')
        .set('x-auth', users[0].tokens[0].token)
        .send(newOperation)
        .expect(400)
        .end(async (err, res) => {
            if(err){
                return done(err);
            }

            try{
                const allOperations = await BudgetOperation.find({
                    _creator: users[0]._id
                });
                expect(allOperations.length).toBe(2);
                done();
            } catch(err){
                return done(err);
            }
        });
    });
});

describe('GET /budget', () => {
    it('should get all budget operations for authenticaten user', done => {
        request(app)
        .get('/budget')
        .set('x-auth', users[0].tokens[0].token)
        .expect(200)
        .expect(res => {
            expect(res.body.length).toBe(2);
            res.body.forEach(operation => {
                expect(operation._creator).toBe(users[0]._id.toHexString());
            });
        })
        .end(done);
    });

    it('should return 401 when user not authenticated', done => {
        request(app)
        .get('/budget')
        .expect(401)
        .expect(res => {
            expect(res.body).toEqual({});
        })
        .end(done);
    });
});

describe('GET /budget/:id', () => {
    it('should return operation data for given when creator of operation authenticated', done => {
        request(app)
        .get(`/budget/${budgetOperations[2]._id}`)
        .set('x-auth', users[2].tokens[0].token)
        .expect(200)
        .expect(res => {
            expect(res.body.operation).toBeDefined();
            expect(res.body.operation._creator).toMatch(budgetOperations[2]._creator.toHexString());
            expect(res.body.operation.value).toBe(budgetOperations[2].value);
            expect(res.body.operation.description).toBe(budgetOperations[2].description);
            expect(new Date(res.body.operation.date)).toEqual(new Date(budgetOperations[2].date));
        })
        .end(done);
    });

    it('should return 401 when different user than creator authenticated', done => {
        request(app)
        .get(`/budget/${budgetOperations[2]._id}`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(404)
        .expect(res => {
            expect(res.body.operation).not.toBeDefined();
        })
        .end(done);
    });

    it('should return 401 when user not authenticated', done => {
        request(app)
        .get(`/budget/${budgetOperations[2]._id}`)
        .expect(401)
        .expect(res => {
            expect(res.body.operation).not.toBeDefined();
        })
        .end(done);
    });

    it('should return 404 when invalid id given', done => {
        request(app)
        .get(`/budget/1234`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(404)
        .expect(res => {
            expect(res.body.operation).not.toBeDefined();
        })
        .end(done);
    });

    it('should return 404 when not existing operation id given', done => {
        request(app)
        .get(`/budget/${new ObjectID()}`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(404)
        .expect(res => {
            expect(res.body.operation).not.toBeDefined();
        })
        .end(done);
    });
});

describe('PATCH /budget/:id', () => {
    it('should change operation properties when creator authenticated', done => {

        const newOperationData = {
            value: 0.12,
            date: "2018-08-03",
            description: "zmienione wartości"
        }

        request(app)
        .patch(`/budget/${budgetOperations[2]._id}`)
        .set('x-auth', users[2].tokens[0].token)
        .send(newOperationData)
        .expect(200)
        .expect(res => {
            expect(res.body.operation._creator).toMatch(budgetOperations[2]._creator.toHexString());
            expect(res.body.operation.value).toBe(newOperationData.value);
            expect(res.body.operation.description).toBe(newOperationData.description);
            expect(new Date(res.body.operation.date)).toEqual(new Date(newOperationData.date));
        })
        .end((err, res) => {
            if(err){
                return done(err);
            }

            BudgetOperation.findById(budgetOperations[2]._id).then(operationInDb => {
                expect(operationInDb._creator.toHexString()).toMatch(budgetOperations[2]._creator.toHexString());
                expect(operationInDb.value).toBe(newOperationData.value);
                expect(operationInDb.description).toBe(newOperationData.description);
                expect(operationInDb.date).toEqual(new Date(newOperationData.date));
                done();
            }).catch(err => done(err));
            }
        );
    });

    it('should return 404 and empty response when not owner authenticated', done => {
        const newOperationData = {
            value: 0.12,
            date: "2018-08-03",
            description: "zmienione wartości"
        }

        request(app)
        .patch(`/budget/${budgetOperations[2]._id}`)
        .set('x-auth', users[0].tokens[0].token)
        .send(newOperationData)
        .expect(404)
        .expect(res => {
            expect(res.body.operation).toBeUndefined();
        })
        .end((err, res) => {
            if(err){
                return done(err);
            }

            BudgetOperation.findById(budgetOperations[2]._id).then(operationInDb => {
                expect(operationInDb._creator.toHexString()).toMatch(budgetOperations[2]._creator.toHexString());
                expect(operationInDb.value).toBe(budgetOperations[2].value);
                expect(operationInDb.description).toBe(budgetOperations[2].description);
                expect(operationInDb.date).toEqual(new Date(budgetOperations[2].date));
                done();
            }).catch(err => done(err));
            }
        );
    });

    it('should return 401 when user not authenticated', done => {
        const newOperationData = {
            value: 0.12,
            date: "2018-08-03",
            description: "zmienione wartości"
        }

        request(app)
        .patch(`/budget/${budgetOperations[2]._id}`)
        .send(newOperationData)
        .expect(401)
        .expect(res => {
            expect(res.body.operation).toBeUndefined();
        })
        .end((err, res) => {
            if(err){
                return done(err);
            }

            BudgetOperation.findById(budgetOperations[2]._id).then(operationInDb => {
                expect(operationInDb._creator.toHexString()).toMatch(budgetOperations[2]._creator.toHexString());
                expect(operationInDb.value).toBe(budgetOperations[2].value);
                expect(operationInDb.description).toBe(budgetOperations[2].description);
                expect(operationInDb.date).toEqual(new Date(budgetOperations[2].date));
                done();
            }).catch(err => done(err));
            }
        );
    });

    it('should change other operation properties when required value not given (creator authenticated)', done => {
        const newOperationData = {
            date: "2018-08-03",
            description: "zmienione wartości"
        }

        request(app)
        .patch(`/budget/${budgetOperations[2]._id}`)
        .set('x-auth', users[2].tokens[0].token)
        .send(newOperationData)
        .expect(200)
        .expect(res => {
            expect(res.body.operation._creator).toMatch(budgetOperations[2]._creator.toHexString());
            expect(res.body.operation.value).toBe(budgetOperations[2].value);
            expect(res.body.operation.description).toBe(newOperationData.description);
            expect(new Date(res.body.operation.date)).toEqual(new Date(newOperationData.date));
        })
        .end((err, res) => {
            if(err){
                return done(err);
            }

            BudgetOperation.findById(budgetOperations[2]._id).then(operationInDb => {
                expect(operationInDb._creator.toHexString()).toMatch(budgetOperations[2]._creator.toHexString());
                expect(operationInDb.value).toBe(budgetOperations[2].value);
                expect(operationInDb.description).toBe(newOperationData.description);
                expect(operationInDb.date).toEqual(new Date(newOperationData.date));
                done();
            }).catch(err => done(err));
            }
        );
    });

    it('should change other operation properties when required date not given (creator authenticated)', done => {
        const newOperationData = {
            value: 0.12,
            description: "zmienione wartości"
        }

        request(app)
        .patch(`/budget/${budgetOperations[2]._id}`)
        .set('x-auth', users[2].tokens[0].token)
        .send(newOperationData)
        .expect(200)
        .expect(res => {
            expect(res.body.operation._creator).toMatch(budgetOperations[2]._creator.toHexString());
            expect(res.body.operation.value).toBe(newOperationData.value);
            expect(res.body.operation.description).toBe(newOperationData.description);
            expect(new Date(res.body.operation.date)).toEqual(new Date(budgetOperations[2].date));
        })
        .end((err, res) => {
            if(err){
                return done(err);
            }

            BudgetOperation.findById(budgetOperations[2]._id).then(operationInDb => {
                expect(operationInDb._creator.toHexString()).toMatch(budgetOperations[2]._creator.toHexString());
                expect(operationInDb.value).toBe(newOperationData.value);
                expect(operationInDb.description).toBe(newOperationData.description);
                expect(operationInDb.date).toEqual(new Date(budgetOperations[2].date));
                done();
            }).catch(err => done(err));
            }
        );
    });

    it('should return 400 and not change operation properties when invalid value given (creator authenticated)', done => {
        const newOperationData = {
            value: 'not value',
            date: "2018-08-03",
            description: "zmienione wartości"
        }

        request(app)
        .patch(`/budget/${budgetOperations[2]._id}`)
        .set('x-auth', users[2].tokens[0].token)
        .send(newOperationData)
        .expect(400)
        .expect(res => {
            expect(res.body.operation).toBeUndefined();
        })
        .end((err, res) => {
            if(err){
                return done(err);
            }

            BudgetOperation.findById(budgetOperations[2]._id).then(operationInDb => {
                expect(operationInDb._creator.toHexString()).toMatch(budgetOperations[2]._creator.toHexString());
                expect(operationInDb.value).toBe(budgetOperations[2].value);
                expect(operationInDb.description).toBe(budgetOperations[2].description);
                expect(operationInDb.date).toEqual(new Date(budgetOperations[2].date));
                done();
            }).catch(err => done(err));
            }
        );
    });

    it('should not change operation properties when invalid date given (creator authenticated)', done => {
        const newOperationData = {
            value: 120,
            date: "not date",
            description: "zmienione wartości"
        }

        request(app)
        .patch(`/budget/${budgetOperations[2]._id}`)
        .set('x-auth', users[2].tokens[0].token)
        .send(newOperationData)
        .expect(400)
        .expect(res => {
            expect(res.body.operation).toBeUndefined();
        })
        .end((err, res) => {
            if(err){
                return done(err);
            }

            BudgetOperation.findById(budgetOperations[2]._id).then(operationInDb => {
                expect(operationInDb._creator.toHexString()).toMatch(budgetOperations[2]._creator.toHexString());
                expect(operationInDb.value).toBe(budgetOperations[2].value);
                expect(operationInDb.description).toBe(budgetOperations[2].description);
                expect(operationInDb.date).toEqual(new Date(budgetOperations[2].date));
                done();
            }).catch(err => done(err));
            }
        );
    });
});

describe('DELETE /budget/:id', () => {
    it('should delete operation as creator authenticated', done => {
        request(app)
        .delete(`/budget/${budgetOperations[2]._id}`)
        .set('x-auth', users[2].tokens[0].token)
        .expect(200)
        .expect(res => {
            expect(res.body.operation).toBeDefined();
        })
        .end(async (err, res) => {
            if(err){
                return done(err);
            }

            try{
                const operation = await BudgetOperation.findById(budgetOperations[2]._id);
                expect(operation).toBeNull();
                done();
            } catch(err){
                done(err);
            }
            
        });
    });

    it('should return 404 when different user than creator authenticated', done => {
        request(app)
        .delete(`/budget/${budgetOperations[2]._id}`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(404)
        .expect(res => {
            expect(res.body.operation).toBeUndefined();
        })
        .end(async (err, res) => {
            if(err){
                return done(err);
            }

            try{
                const operation = await BudgetOperation.findById(budgetOperations[2]._id);
                expect(operation).toBeDefined();
                done();
            } catch(err){
                done(err);
            }
            
        });
    });

    it('should return 401 when user not authenticated', done => {
        request(app)
        .delete(`/budget/${budgetOperations[2]._id}`)
        .expect(401)
        .expect(res => {
            expect(res.body.operation).toBeUndefined();
        })
        .end(async (err, res) => {
            if(err){
                return done(err);
            }

            try{
                const operation = await BudgetOperation.findById(budgetOperations[2]._id);
                expect(operation).toBeDefined();
                done();
            } catch(err){
                done(err);
            }
            
        });
    });

    it('should return 404 if todo not found', done => {
        request(app)
        .delete(`/budget/${new ObjectID()}`)
        .set('x-auth', users[2].tokens[0].token)
        .expect(404)
        .expect(res => {
            expect(res.body.operation).toBeUndefined();
        })
        .end(async (err, res) => {
            if(err){
                return done(err);
            }

            try{
                const operation = await BudgetOperation.findById(budgetOperations[2]._id);
                expect(operation).toBeDefined();
                done();
            } catch(err){
                done(err);
            }
            
        });
    });

    it('should return 404 for invalid operation id', done => {
        request(app)
        .delete(`/budget/1234`)
        .set('x-auth', users[2].tokens[0].token)
        .expect(404)
        .expect(res => {
            expect(res.body.operation).toBeUndefined();
        })
        .end(async (err, res) => {
            if(err){
                return done(err);
            }

            try{
                const operation = await BudgetOperation.findById(budgetOperations[2]._id);
                expect(operation).toBeDefined();
                done();
            } catch(err){
                done(err);
            }
            
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
