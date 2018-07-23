const mongoose = require('mongoose');

const Test = mongoose.model('Test', {
    text: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    }
});

module.exports = {Test}