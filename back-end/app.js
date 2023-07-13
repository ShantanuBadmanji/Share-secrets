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
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const _ = require('lodash');

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


app.get('/', (req, res) => {
    res.render('home');
});
app.get('/secrets', (req, res) => {
    res.redirect('community/global');

});
app.get('/community/:communityName', async (req, res) => {
    if(!req.isAuthenticated()) {
        return res.redirect("/login");
    }

    const secrets =
        await Secret
            .find({community: _.lowerCase(req.params.communityName)}, {_id: 0, secret: 1})
            .exec();

    const user = await User.findById({_id: req.user.id}).exec();

    res.render('community', {
        communitySecrets: secrets,
        communityName: req.params.communityName,
        userCommunities: user.communities
    });
});


app.get('/submit', (req, res) => {
    if(!req.isAuthenticated()) {
        return res.redirect("/login");
    }
    res.render('submit');
});
app.get('/:communityName/submit', (req, res) => {
    if(!req.isAuthenticated()) {
        return res.redirect("/login");
    }
    res.render('submit', {
        communityName: req.params.communityName
    });
});
app.get('/join-community', (req, res) => {
    if(!req.isAuthenticated()) {
        return res.redirect("/login");
    }
    Admin.findOne({username: myUsername, password: myPassword})
        .then(admin => {
            res.render('join-community', {communities: admin.communities, createError: null, joinError: null});
        });
});














app.get('/login', (req, res) => {
    // console.log('login: ',req.session.messag);
    res.render('login', {err: null});
});
app.get('/register', (req, res) => {
    res.render('register', {err: null});
});
app.get('/logout', (req, res) => {
    req.logout(err => {
        if(err)
            return res.send(`logout ERROR: ${err.message}`);
    });
    res.redirect('/');
});




app.get('/auth/google',
    passport.authenticate('google', {scope: ['profile', 'email']})
);
app.get('/auth/google/secrets',
    passport.authenticate('google', {failureRedirect: '/login'}),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    }
);


app.get('/auth/facebook',
    passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', {failureRedirect: '/login'}),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });



app.post('/register', (req, res) => {
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
app.post('/login', (req, res, next) => {
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



// -----------------------------------------------------------------------------
app.post("/:communityName/submit", (req, res) => {
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
app.post("/join-community", async (req, res) => {
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
app.post("/create-community", async (req, res) => {
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


const port = process.env.PORT || 3000;
app.listen(3000,
    () => console.log(`Server listening on port ${port}.`));