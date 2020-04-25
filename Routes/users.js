const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../Mongo/Database");
const User = require("../Mongo/Models/Users");
const authorize = require('../Auth/JWTAuth');


router.post("/register", (req, res) => {
    User.findOne({email: req.body.email}).then(user => {
        if (user) {
            return res.status(400).json({email: "Email already exists"});
        }
        const newUser = new User({
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
                    .then(user => res.json(user))
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
    User.findOne({"_id": req.body.uid}, {"_id": 0, name: 1, email: 1, date: 1}).then(rsp => {
        return res.status(200).json(rsp);
    }).catch(e => {
        res.status(401).json(e);
    })
})

module.exports = router;
