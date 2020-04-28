const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../Mongo/Database");
const User = require("../Mongo/Models/Users");
const authorize = require('../Auth/JWTAuth');
const decode = require('jwt-decode');

router.post("/register", (req, res) => {
    User.findOne({email: req.body.email}).then(user => {
        if (user) {
            return res.status(400).json({error: "Email already exists"});
        }
    })
    User.findOne({"_id": req.body.user}).then(user => {
        if (user) {
            return res.status(400).json({error: "Username already exists"});
        }
        const newUser = new User({
            "_id": req.body.user,
            name: req.body.name,
            email: req.body.email,
            password: req.body.password
        });
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newUser.password, salt, (err, hash) => {
                if (err) throw err;
                newUser.password = hash;
                newUser
                    .save()
                    .then(user => res.status(200).json(user))
                    .catch(err => console.log(err));
            });
        });
    });
});


router.post("/login", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({email}).then(user => {
        if (!user) {
            return res.status(404).json({error: "Email not found"});
        }
        bcrypt.compare(password, user.password).then(isMatch => {
            if (isMatch) {
                const payload = {
                    id: user.id,
                    name: user.name
                };
                jwt.sign(
                    payload,
                    keys.secretOrKey,
                    {
                        expiresIn: 3600
                    },
                    (err, token) => {
                        res.json({
                            success: true,
                            token: "Bearer " + token
                        });
                    }
                );
            } else {
                return res
                    .status(400)
                    .json({error: "Password incorrect"});
            }
        });
    });
});

router.post("/getInfo", authorize, (req, res) => {
    User.findOne({"_id": req.body.uid}, {"_id": 1, name: 1, email: 1, date: 1}).then(rsp => {
        return res.status(200).json(rsp);
    }).catch(e => {
        res.status(401).json(e);
    })
})
router.post("/getInfoPub", (req, res) => {
    User.findOne({"_id": req.body.uid}, {"_id": 1, name: 1}).then(rsp => {
        return res.status(200).json(rsp);
    }).catch(e => {
        res.status(401).json(e);
    })
})

router.post("/setInfo", authorize, (req, res) => {
    let token = (req.headers['x-access-token'] || req.headers['authorization']);
    if (!token)
        return res.status(401).json({error: "Please log in again to update this comment"});
    token = token.slice(7, token.length);
    const decoded = decode(token);
    const id = decoded.id;

    User.findOne({"_id": id}).then(rsp => {
        bcrypt.compare(req.body.currentPass, rsp.password).then(isMatch => {
            if (isMatch) {
                const updatedData = {
                    email: req.body.email,
                    name: req.body.name,
                }
                if (req.body.newPass) {
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(req.body.newPass, salt, (err, hash) => {
                            if (err) throw err;
                            updatedData.password = hash;
                            User.updateOne({"_id": id}, updatedData)
                                .then(response => {
                                    return res.status(200).json(response);
                                })
                                .catch(e => {
                                    return res.status(409).json({error: "Could not update data", e})
                                });
                        });
                    });
                } else {
                    User.updateOne({"_id": id}, updatedData).then(response => {
                        return res.status(200).json(response);
                    })
                        .catch(e => {
                            return res.status(409).json({error: "Could not update data", e})
                        });
                }
            } else {
                return res.status(401).json({error: "Password mismatch"});
            }
        })
    })
})
router.post("/toggleFriend", authorize, async (req, res) => {
    let token = (req.headers['x-access-token'] || req.headers['authorization']);
    if (!token)
        return res.status(401).json({error: "Session terminated. Please log in again"});
    token = token.slice(7, token.length);
    const decoded = decode(token);

    if (decoded.id === req.body._id) {
        return res.status(403).json({error: "You cannot add yourself"})
    }
    try {
        const sender = await User.findOne({_id: decoded.id}).exec();
        let friendIndex = sender.friends.indexOf(req.body._id);
        if (friendIndex === -1) {
            sender.friends.push(req.body._id);
            sender.save();
        } else {
            sender.friends.splice(friendIndex, 1);
            sender.save();
        }
        res.status(200).json({friendStatus: friendIndex === -1 ? "Sent request" : "Removed friend"})
    } catch (e) {
        res.status(500).json({error: "Internal server error", stack: e})
    }

})
router.post("/getFriendshipStatus", authorize, async (req, res) => {
    let token = (req.headers['x-access-token'] || req.headers['authorization']);
    if (!token)
        return res.status(401).json({error: "Session terminated. Please log in again"});
    token = token.slice(7, token.length);
    const decoded = decode(token);
    try {
        const checker = await User.findOne({_id: decoded.id}).exec();
        const checked = await User.findOne({_id: req.body.id}).exec();
        let friendshipStatus = "none";
        const checkedUserInCheckersList = checker.friends.indexOf(checked._id) !== -1;
        const checkerInCheckedUsersList = checked.friends.indexOf(checker._id) !== -1;
        if (checkedUserInCheckersList) {
            friendshipStatus = "pending";
        }
        if (checkedUserInCheckersList && checkerInCheckedUsersList) {
            friendshipStatus = "friends";
        }
        return res.status(200).json({friendshipStatus})
    } catch (e) {
        res.status(500).json({error: "Internal server error", stack: e})
    }
})

router.post("/populateWall", authorize, (req, res) => {
    User.aggregate([
        {
            '$lookup': {
                'from': 'comments',
                'localField': 'friends',
                'foreignField': 'fromID',
                'as': 'posts'
            }
        }, {
            '$project': {
                'posts': 1,
                '_id': 0
            }
        }, {
            '$unwind': {
                'path': '$posts'
            }
        }, {
            '$skip': req.body.page * req.body.limit
        }, {
            '$limit': req.body.limit
        }, {
            '$group': {
                '_id': null,
                'posts': {
                    '$push': '$posts'
                }
            }
        }, {
            '$project': {
                '_id': 0
            }
        }
    ])
        .then(resp => {
            console.log(resp);
            res.status(200).json(Boolean(resp.length) ? resp[0] : [{posts: []}])
        })
        .catch(err => res.status(500).json({error: "Couldn't fetch posts", stack: err}))
})
module.exports = router;
