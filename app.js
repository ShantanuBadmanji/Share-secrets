//jshint esversion:6
require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const ejs = require('ejs');
const exp = require('constants');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

//configure a session.
app.use(session({
    secret: process.env.SECRET,
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
}));
app.use(passport.initialize())
app.use(passport.session())

mongoose
    .connect('mongodb://127.0.0.1:27017/userDB', { useNewUrlParser: true })
    .then(() => console.log(`db connected.`))
    .catch(err => console.log(err.message))

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.get('/', (req, res) => {
    res.render('home');
})
app.get('/login', (req, res) => {
    res.render('login');
})
app.get('/register', (req, res) => {
    res.render('register');
})
app.get('/secrets', (req, res) => {
    if (!req.isAuthenticated()) {
        res.redirect("/login");
    }
    res.render('secrets');
})
app.get('/submit', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect("/login");
    }
    res.render('submit');
})
app.get('/logout', (req, res) => {
    req.logout(err => {
        if (err)
            return res.send(`logout ERROR: ${err.message}`)
    });
    res.redirect('/');
})




app.post('/register', (req, res) => {
    User.register(
        new User({ username: req.body.username }), req.body.password)
        .then(user => {
            req.login(user, (err) => {
                if (err) {
                    return res.send(err.message);
                }
            })
            res.redirect('/secrets');
        })
        .catch((err) => res.send(`registration error: ${err.message}`))
})
app.post('/login', passport.authenticate(
    'local',
    { successRedirect: '/secrets', failureRedirect: '/login' })
);
app.post("/submit", (req, res) => {
    res.send(`yet to bet set`)
})

const port = 3000
app.listen(3000,
    () => console.log(`Server listening on port ${port}.`));