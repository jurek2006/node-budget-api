const expect = require('expect');
const request = require('supertest');

const {app} = require('./../server');
const {Test} = require('./../models/test');
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
        .end((err, red) => {
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

