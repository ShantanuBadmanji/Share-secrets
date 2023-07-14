//jshint esversion:6
require('dotenv').config();
require('./database/connect')();
const {User, Admin, Secret} = require('./database/schema');
const bodyParser = require('body-parser');
const express = require('express');
const ejs = require('ejs');
const exp = require('constants');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const _ = require('lodash');

const localRouter = require('./auth/local');
const OAuthRouter = require('./auth/o-auth');
const getRouteRouter = require('./routes/get-routes');
const postRouteRouter = require('./routes/post-routes');



const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.set('view engine', 'ejs');

//configure a session.
app.use(session({
    secret: process.env.SECRET,
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
}));
app.use(passport.initialize());
app.use(passport.session());

const myUsername = encodeURIComponent(process.env.MY_USERNAME);
const myPassword = encodeURIComponent(process.env.MY_PASSWORD);







Admin.findOne({username: myUsername, password: myPassword})
    .then(user => {
        if(!user) {
            new Admin({
                username: myUsername,
                password: myPassword,
                communities: [{
                    name: "global",
                    code: ""
                }, {
                    name: "developers",
                    code: "webuildthings"
                }]
            }).save();
        }
    }
    );

app.use("/local", localRouter);
app.use("/auth", OAuthRouter);
app.use("/", getRouteRouter);
app.use("/", postRouteRouter);




const port = process.env.PORT || 3000;
app.listen(3000,
    () => console.log(`Server listening on port ${port}.`));