const mongoose = require('mongoose');

const Test = mongoose.model('Test', {
    text: {
        type: String
    }
});

module.exports = {Test}