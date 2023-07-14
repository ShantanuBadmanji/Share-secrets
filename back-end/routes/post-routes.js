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

router.post("/:communityName/submit", (req, res, next) => {
    console.log(req.body.secret);
    const revSecret = req.body.secret;
    const communityName = _.lowerCase(req.params.communityName);
    if(revSecret) {
        new Secret({
            secret: revSecret,
            authorId: req.user.id,
            community: communityName
        }).save()
            .then(() => res.redirect(`/community/${communityName}`))
            .catch((err) => res.send(`Submit error: ${err.message}`));
    } else {
        res.redirect(`/community/${communityName}`);
    }
});
router.post("/join-community", async (req, res, next) => {
    console.log(req.body);
    const communityName = _.lowerCase(req.body.communityName);
    const communityCode = req.body.communityCode;

    const admin = await Admin.findOne({}).exec();
    if(admin.communities.some(x => x.name === communityName && (x.code === '' || x.code === communityCode))) {
        const user = await User.findById({_id: req.user.id}).exec();
        if(!user.communities.includes(communityName)) {
            user.communities.push(communityName);
            user.save();
        }
        return res.redirect(`/community/${communityName}`);
    }
    else {
        return res.render("join-community", {communities: admin.communities, joinError: 'community-name or code is invalid', createError: null});
    }
    // User.UpdateOne({ username: myUsername, password: myPassword },{$push: communityName} ).exec();
});
router.post("/create-community", async (req, res, next) => {
    console.log(req.body);
    const communityName = _.lowerCase(req.body.communityName);
    const communityCode = req.body.communityCode;

    const admin = await Admin.findOne({}).exec();
    if(admin.communities.some(x => x.name === communityName)) {
        return res.render("join-community", {communities: admin.communities, joinError: null, createError: `${communityName} community already exists. Try joining the community.`});
    }
    else {
        admin.communities.push({
            name: communityName,
            code: communityCode
        });
        admin.save();

        const user = await User.findById({_id: req.user.id}).exec();
        user.communities.push(communityName);
        user.save();
        return res.redirect(`/community/${communityName}`);
    }
});


module.exports = router;
