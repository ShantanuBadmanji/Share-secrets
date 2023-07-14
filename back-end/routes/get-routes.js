//jshint esversion:6
require('dotenv').config();
const {User, Admin, Secret} = require('../database/schema');
const bodyParser = require('body-parser');
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const _ = require('lodash');



const router = express.Router();

router.get('/', (req, res, next) => {
    res.render('home');
});
router.get('/secrets', (req, res, next) => {
    res.redirect('community/global');

});
router.get('/community/:communityName', async (req, res, next) => {
    if(!req.isAuthenticated()) {
        return res.redirect("/login");
    }

    const secrets =
        await Secret.find(
            {community: _.lowerCase(req.params.communityName)},
            {_id: 0, secret: 1}
        ).exec();

    const user = await User.findById({_id: req.user.id}).exec();

    res.render('community', {
        communitySecrets: secrets,
        communityName: req.params.communityName,
        userCommunities: user.communities
    });
});


router.get('/submit', (req, res, next) => {
    if(!req.isAuthenticated()) {
        return res.redirect("/login");
    }
    res.render('submit');
});
router.get('/:communityName/submit', (req, res, next) => {
    if(!req.isAuthenticated()) {
        return res.redirect("/login");
    }
    res.render('submit', {
        communityName: req.params.communityName
    });
});
router.get('/join-community', (req, res, next) => {
    if(!req.isAuthenticated()) {
        return res.redirect("/login");
    }
    Admin.findOne({username: myUsername, password: myPassword})
        .then(admin => {
            res.render(
                'join-community',
                {communities: admin.communities, createError: null, joinError: null}
            );
        });
});


router.get('/login', (req, res, next) => {
    // console.log('login: ',req.session.messag);
    res.render('login', {err: null});
});
router.get('/register', (req, res, next) => {
    res.render('register', {err: null});
});
router.get('/logout', (req, res, next) => {
    req.logout(err => {
        if(err)
            return res.send(`logout ERROR: ${err.message}`);
    });
    res.redirect('/');
});


module.exports = router;
