const express = require('express');
const morgan = require("morgan");
const path = require('path');
const app = express();
const port = process.env.PORT || 8050;
const connectDB = require('./db/connect');
const tourRouter = require('./routers/tourRouter');
const userRouter = require('./routers/userRouter');
const reviewRouter = require('./routers/reviewRouter');
const viewRouter = require('./routers/viewRouter');
const AppError = require('./utils/appError');
const globalErrorHandeler = require('./controller/errorController');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');


// Set security HTTP headers
app.use(helmet());

app.set('view engine', 'pug');
app.set('views',path.join(__dirname, 'views'));

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));


// Very Very important
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10kb'}));

require("dotenv").config();

// For limiting the request.
// With this we can prevent BruteForce attacks and Denial of service  attacks
const limiter = rateLimit({
    // max requests 100 from a same IP in 1 hour.
    max: 300,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, Please try again in an hour 😞😞😞 !!'
})

// This limiter is basically a middleware function. This middleware will be applied to all /api requests
app.use('/api', limiter);

// Data sanitization against NoSQL queries injection. If I use {"$gt": ""} it without email we can access data only use password. This is only an example
app.use(mongoSanitize());// It besically removes all '$' sign from req.body and req.params

// Data sanitization against XSS attacks.
app.use(xss());// It clean input all malicious HTML code.

// Prevent Parameter polutions
app.use(hpp({
    whitelist: ['duration','ratingsQuantity','ratingsAverage']
}));

// app.get('/', (req, res) => {
//     res.status(200).send("Welcome in Natours Ultimate!");
// })

app.use(morgan('dev'));


app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    // console.log(req.headers);
    next();
});


// ROUTES

// app.use('/',viewRouter);
app.use('/api/v1/tour', tourRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/review', reviewRouter);


// To handel wrong routes
app.all('*', (req, res, next) => {
    // If we passs anything in next() Express will autometically know that it is error
    // It skips all middleware stack and direct go to global error handeling middleware 
    next(new AppError(`Can't find ${req.originalUrl} on this server!!`,404));

});

// Error handeling middleware It has 4 arguments
app.use(globalErrorHandeler);


const start = async () => {
    try {
        await connectDB(process.env.MONGODB_URL);
        app.listen(port, () => {
            console.log(`Server listening on ${port}`);
        });
    } catch (err) {
        console.log(err);
    }
};


start();
