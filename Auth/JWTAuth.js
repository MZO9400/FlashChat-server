const jwt = require('jsonwebtoken');
const config = require('../Mongo/Database');
const authorize = (req, res, next) => {
    let token = req.headers['x-access-token'] || req.headers['authorization'];
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Auth token is not supplied'
        });
    }
    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    }
    jwt.verify(token, config.secretOrKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                success: false,
                message: 'Token is not valid'
            });
        } else {
            req.decoded = decoded;
            next();
        }
    });
};
module.exports = authorize;