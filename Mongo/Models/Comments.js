const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const CommentsSchema = new Schema({
    fromID: {
        type: String,
        required: true
    },
    toID: {
        type: String,
        required: true
    },
    title: {
        type: String
    },
    comment: {
        type: String,
        required: true
    },
    hidden: {
        type: Boolean,
        default: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    edited: {
        type: Boolean,
        default: false
    },
    editedTime: {
        type: Date
    }
});

const Comments = mongoose.model('comments', CommentsSchema);

module.exports = Comments;
