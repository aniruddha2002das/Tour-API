const AppError = require('./../utils/appError');

const handelCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message,400);
}

const handelJWTError = () => new AppError('Invalid Token. Please Login again !! 😔😔 ', 401);

const handelJWTExpiredError = () => new AppError('Your token has expired. Please Login again !! 🙃🙃🙃 ', 401);

const handleDuplicateFieldsDB = err => {
    const value = err.match(/(["'])(\\?.)*?\1/);
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400);
};

const sendErrorDev = (err,res) => {
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        error: err,
        stack: err.stack 
    });
}



const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
  
      // Programming or other unknown error: don't leak error details
    } else {
      // 1) Log error
      console.error('ERROR 💥', err);
  
      // 2) Send generic message
      res.status(500).json({
        status: 'error',
        message: 'Something went very wrong 💥💥💥💥💥💥 !!'
      });
    }
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if(process.env.NODE_ENV === 'development'){
        sendErrorDev(err, res);
    }
    else if(process.env.NODE_ENV === 'production'){
        let error = { ...err };
        if (err.name === 'CastError') error = handelCastErrorDB(error);
        if (err.code === 11000) error = handleDuplicateFieldsDB(err.message);
        if(err.name === 'JsonWebTokenError') error = handelJWTError();
        if(err.name === 'TokenExpiredError') error = handelJWTExpiredError();
        sendErrorProd(error, res);
    }
}







