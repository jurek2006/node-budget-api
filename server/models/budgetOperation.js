const mongoose = require('mongoose');

const BudgetOperation = mongoose.model('BudgetOperation', {
    value: {
        type: Number,
        required: true,
    }, 
    date: {
        type: Date,
        required: true
    },
    description: {
        type: String,
        trim: true
    }
});

module.exports = {BudgetOperation}