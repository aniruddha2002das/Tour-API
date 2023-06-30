const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
const dotenv = require("dotenv");
dotenv.config();

process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});

const connectDB = async (url) => {
    mongoose.connect(url,{
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    console.log("Connection is complete with Database.");
}

process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    // app.close(() => {
    //   process.exit(1);
    // });
});

module.exports = connectDB;
