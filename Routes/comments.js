const express = require("express");
const router = express.Router();
const Comments = require("../Mongo/Models/Comments");
const Users = require("../Mongo/Models/Users");
const authorize = require('../Auth/JWTAuth');
const decode = require('jwt-decode');

router.post("/postNew", authorize, (req, res) => {
    let token = (req.headers['x-access-token'] || req.headers['authorization']);
    if (!token) {
        return res.status(401).json({error: "Please log in again to post comments"})
    }
    token = token.slice(7, token.length);
    const decoded = decode(token);
    const _id = decoded.id;
    Users.findOne({_id: req.body.userID}).then(user => {
        if (!user) {
            return res.status(404).json({error: "User not found"})
        }
        const comment = new Comments({
            fromID: _id,
            toID: req.body.userID,
            comment: req.body.comment,
        })
        if (req.body.title) {
            comment.title = req.body.title;
        }
        comment.save()
            .then(com => {
                return res.status(200).json(com);
            })
            .catch(er => {
                return res.status(500).json({error: "Could not post comment at this time", stack: er})
            })
    })
})

router.post("/toggleVisibility", authorize, (req, res) => {
    let token = (req.headers['x-access-token'] || req.headers['authorization']);
    if (!token)
        return res.status(401).json({error: "Please log in again to authorize this comment"});
    token = token.slice(7, token.length);
    const decoded = decode(token);
    const {id} = decoded;
    Users.findOne({_id: id}).then(toUser => {
        Comments.findOne({_id: req.body._id})
            .then(comment => {
                if (!comment) return res.status(404).json({error: "Comment not found"});
                if (comment.toID !== toUser._id) return res.status(401).json({
                    error: "You can only toggle visibility on comments that are on your profile"
                })
                comment.hidden = !comment.hidden;
                comment.updateOne()
                    .then(rsp => {
                        return res.status(200).json(rsp)
                    })
                    .catch(er => {
                        return res.status(500).json({error: "Could not authorize comment at this time", stack: er})
                    })
            })
            .catch(er => {
                return res.status(404).json({error: "Comment not found", stack: er})
            })
    })
})

router.post("/getAll", (req, res) => {
    Comments.aggregate([
        {
            '$match': {
                'fromID': req.body.userID
            }
        }, {
            '$lookup': {
                'from': 'users',
                'localField': 'fromID',
                'foreignField': '_id',
                'as': 'userInfo'
            }
        }, {
            '$unwind': {
                'path': '$userInfo'
            }
        }, {
            '$addFields': {
                'name': '$userInfo.name'
            }
        }, {
            '$project': {
                '__v': 0,
                'userInfo': 0
            }
        }
    ])
        .then(response => {
            res.status(200).json(response);
        })
        .catch(er => {
            return res.status(500).json({
                error: "Could not fetch comments for " + req.body.userID + " at this time",
                stack: er
            })
        })
})

router.post("/delete", authorize, (req, res) => {
    let token = (req.headers['x-access-token'] || req.headers['authorization']);
    if (!token)
        return res.status(401).json({error: "Please log in again to remove this comment"});
    token = token.slice(7, token.length);
    const decoded = decode(token);
    const {id} = decoded;
    Comments.deleteOne({_id: req.body._id, toID: id})
        .then(response => {
            return res.status(200).json(response);
        })
        .catch(er => {
            return res.status(500).json({error: "Could not remove comment", stack: er})
        })
})

router.post("/edit", authorize, (req, res) => {
    let token = (req.headers['x-access-token'] || req.headers['authorization']);
    if (!token)
        return res.status(401).json({error: "Please log in again to update this comment"});
    token = token.slice(7, token.length);
    const decoded = decode(token);
    const fromID = decoded.id;
    Comments.findOneAndUpdate({_id: req.body._id, fromID}, {
        $set: {
            title: req.body.title,
            comment: req.body.comment,
            edited: true,
            editedTime: Date.now(),
            hidden: true
        }
    })
        .then(rsp => {
            return res.status(200).json(rsp);
        })
})

module.exports = router;
