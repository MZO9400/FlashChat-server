const express = require("express");
const router = express.Router();
const Chat = require("../Mongo/Models/Chat");
const authorize = require('../Auth/JWTAuth');
const decode = require('jwt-decode');

router.post("/getChatID", authorize, async (req, res) => {
    let token = (req.headers['x-access-token'] || req.headers['authorization']);
    if (!token) {
        return res.status(401).json({error: "Please log in again to post comments"});
    }
    token = token.slice(7, token.length);
    const decoded = decode(token);
    const fromID = decoded.id;
    const toID = req.body.id;
    const chatID = (await Chat.findOne({fromID: toID, toID: fromID}, {_id: 1}).exec()) || (await Chat.findOne({
        toID,
        fromID
    }, {_id: 1}).exec());
    if (chatID._id)
        return res.status(200).json({chatID});
    else
        return res.status(401).json({error: "Can only chat with friends"});
})

module.exports = router;