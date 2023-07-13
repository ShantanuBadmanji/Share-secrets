
const mongoose = require('mongoose');

const myUsername = encodeURIComponent(process.env.MY_USERNAME);
const myPassword = encodeURIComponent(process.env.MY_PASSWORD);
const cluster = process.env.MY_CLUSTER;
const database = process.env.MY_DATABASE;
const url = `mongodb+srv://${myUsername}:${myPassword}@${cluster}/${database}`;


module.exports = function () {
    mongoose
        // .connect(`mongodb://127.0.0.1:27017/${database}`, { useNewUrlParser: true })
        .connect(url, { useNewUrlParser: true })
        .then(() => console.log(`db connected.`))
        .catch(err => console.log(err.message))
}
