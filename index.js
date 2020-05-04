const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");
const config = require("./Mongo/Database")
const users = require("./Routes/users");
const comments = require("./Routes/comments")
const cors = require('cors')
require('dotenv').config();

mongoose.connect(config.DB, {useNewUrlParser: true, useUnifiedTopology: true}).then(
    () => {
        console.log('Database is connected')
    },
    err => {
        console.log('Can not connect to the database:' + err)
    }
);

const app = express();

app.use(cors())
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(passport.initialize());
require("./auth/passport")(passport);

app.use("/api/users", users);
app.use("/api/comments", comments);


const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});
