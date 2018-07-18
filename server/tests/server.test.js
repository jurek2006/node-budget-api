const expect = require('expect');
const request = require('supertest');

const {app} = require('./../server');

describe('GET /', () => {
    
    it('should get response from route /', (done) => {
        request(app)
        .get('/')
        .expect(200)
        .end(done);
    }); 

});
