require("dotenv").config();
const connectDB = require('./db/connect');
const Tour = require('./models/tourModel');
const data = require('./tour1.json');

const start = async () => {
    try{
        await connectDB(process.env.MONGODB_URL);
        await Tour.deleteMany();
        await Tour.create(data);
        console.log("Data is successfully inserted into the database.");
    }catch(err){
        console.log(err);
    }
}
start();