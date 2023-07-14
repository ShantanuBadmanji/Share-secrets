//jshint esversion:6
require('dotenv').config();
const {User, Admin, Secret} = require('../database/schema');
const bodyParser = require('body-parser');
const express = require('express');
const ejs = require('ejs');
const exp = require('constants');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const _ = require('lodash');



passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, {
            id: user.id,
            username: user.username,
            picture: user.picture
        });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});



// google strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // callbackURL: "http://localhost:3000/auth/google/secrets"
    callbackURL: "https://share-secrets-pwbi.onrender.com/auth/google/secrets"
},
    function (accessToken, refreshToken, profile, cb) {
        console.log('google:\n', profile);
        User
            .findOne({googleId: profile._json.sub})
            .then(user => {
                if(!user) {
                    user = new User({
                        username: profile._json.name,
                        googleId: profile._json.sub,
                        communities: ["global"]
                    });
                    user.save();
                }
                return cb(null, user);
            })
            .catch(err => cb(err, null));
    }
));

// facebook strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    // callbackURL: "http://localhost:3000/auth/facebook/secrets"
    callbackURL: "https://share-secrets-pwbi.onrender.com/auth/facebook/secrets"
},
    function (accessToken, refreshToken, profile, cb) {
        console.log('facebook: ', profile);
        User
            .findOne({facebookId: profile.id})
            .then(user => {
                if(!user) {
                    user = new User({
                        // username: profile.displayName,
                        facebookId: profile.id,
                        communities: ["global"]
                    });
                    user.save();
                }
                return cb(null, user);
            })
            .catch(err => cb(err, null));
    }
));

const router = express.Router();


router.get('/google',
    passport.authenticate('google', {scope: ['profile', 'email']})
);
router.get('/google/secrets',
    passport.authenticate('google', {failureRedirect: '/login'}),
    function (req, res,next) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    }
);


router.get('/facebook',
    passport.authenticate('facebook'));

router.get('/facebook/secrets',
    passport.authenticate('facebook', {failureRedirect: '/login'}),
    function (req, res,next) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });

module.exports = router;
