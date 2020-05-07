const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ChatSchema = new Schema({
    fromID: {
        type: String,
        required: true
    },
    toID: {
        type: String,
        required: true
    }
});

const Chat = mongoose.model('chat', ChatSchema);

module.exports = Chat;
