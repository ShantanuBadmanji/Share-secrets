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

// local strategy
passport.use(User.createStrategy());

const router = express.Router();


router.post('/register', (req, res, next) => {
    User.register(
        new User({username: req.body.username, communities: ['global']}), req.body.password)
        .then(user => {
            req.login(user, (err) => {
                if(err) {
                    return res.send(err.message);
                }
                res.redirect('/secrets');
            });
        })
        .catch(err => res.render('register', {err: err.message}));
});
router.post('/login', (req, res, next) => {
    passport.authenticate('local', function (err, user, info, status) {
        if(err) {
            console.log(err);
        } else if(!user) {
            return res.render('login', {err: info.message});
        }
        req.login(user, (err) => {
            if(err) {
                return res.send(err.message);
            }
            res.redirect('/secrets');
        });
    })(req, res, next);
});

module.exports = router;