
const mongoose = require('mongoose');

const passportLocalMongoose = require('passport-local-mongoose');
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    facebookId: String,
    secrets: String,
    communities: [String]
});

userSchema.plugin(passportLocalMongoose);

exports.User = new mongoose.model('User', userSchema);

const adminSchema = new mongoose.Schema({
    username: String,
    password: String,
    communities: [{
        name: String,
        code: String
    }]
});
adminSchema.plugin(passportLocalMongoose);

exports.Admin = new mongoose.model('Admin', adminSchema);


//  secrets schema
const secretSchema = new mongoose.Schema({
    secret: {
        type: String,
        required: true
    },
    authorId: String,
    community: String
});


exports.Secret = new mongoose.model('Secret', secretSchema);