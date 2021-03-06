const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");
const users = require("./Routes/users");
const chats = require("./Routes/chats");
const comments = require("./Routes/comments")
const cors = require('cors')
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true}).then(
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
app.use("/api/chats", chats);


const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});
