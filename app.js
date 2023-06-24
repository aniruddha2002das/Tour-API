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



app.use(helmet());

app.set('view engine', 'pug');
app.set('views',path.join(__dirname, 'views'));


app.use(express.static(path.join(__dirname, 'public')));


app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10kb'}));

require("dotenv").config();


const limiter = rateLimit({
    max: 300,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, Please try again in an hour 😞😞😞 !!'
})

app.use('/api', limiter);

app.use(mongoSanitize());
app.use(xss());

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


app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!!`,404));

});

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
