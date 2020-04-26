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

router.post("/setInfo", authorize, (req, res) => {
    let token = (req.headers['x-access-token'] || req.headers['authorization']);
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


module.exports = router;
