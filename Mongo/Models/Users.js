const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        required: false
    },
    dateOfBirth: {
        type: Date,
        required: false
    },
    socialLinks: {
        type: [String],
        length: 3,
        required: false,
    },
    friends: {
        type: [String],
        length: 5000,
        required: false
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('users', UserSchema);

module.exports = User;
