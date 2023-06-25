//jshint esversion:6
require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const ejs = require('ejs');
const exp = require('constants');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltCount = 10;

mongoose
    .connect("mongodb://127.0.0.1:27017/userDB")
    .then((res) => console.log(`SuccessFully connected ${res}`))
    .catch(err => console.log(err.message))


const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,
    }
});

const User = mongoose.model('User', userSchema);


const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('home');
})
app.get('/login', (req, res) => {
    res.render('login');
})
app.get('/register', (req, res) => {
    res.render('register');
})


app.post('/register', (req, res) => {
    // console.log(req.body)
    bcrypt
        .hash(req.body.password, saltCount)
        .then((hash) => {
            new User({
                email: req.body.username,
                password: hash
            })
                .save()
                .then(() => res.redirect('login'))
                .catch(err => res.send(err.message));
        })
        .catch(err => res.send(err.message));
})

app.post('/login', (req, res) => {
    // console.log(req.body);
    (async () => {
        try {
            const doc = await User.findOne({ email: req.body.username });
            if (!doc)
                res.send('Invalid username.')
            else {
                if (await bcrypt.compare(req.body.password, doc.password))
                    res.render('secrets');
                else
                    res.send('wrong password.');
            }
        } catch (err) {
            res.send(err.message);
        }
    })();
})


app.listen(3000,
    (arg) => console.log(`Successfully listening on port 3000 : ${arg}`))