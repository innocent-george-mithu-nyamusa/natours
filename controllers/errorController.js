const AppError = require('./../utils/appError');

const handleCastError = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token Please log in Again', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again', 400);
const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate value: ${value}. Please use another value`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data ${errors.join('. ')}`;
  return new AppError(message, 400);
};

//Send different error information based on whether it is for API or for the Rendered Website

const sendErrorDev = (error, req, res) => {
  //Check to see if the url starts with the word 'api'
  //if it does send the following response

  if (req.originalUrl.startsWith('/api')) {
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
      error: error,
      stack: error.stack
    });
  }
  //Send the following response for the Rendered Website

  return res.status(error.statusCode).render('error', {
    title: 'Something went wrong',
    msg: error.message
  });
};

const sendErrorProd = (error, req, res) => {
  // 1.) For the Api

  if (req.originalUrl.startsWith('/api')) {
    //A) If an error is an Operation error, that is a trusted Error
    //   Send the error to the client

    if (error.isOperational) {
      return res.status(error.statusCode).json({
        status: error.status,
        message: error.message
      });
    }
    //Programming error or other unknown errors, Don't leak Details

    // log error to the console.
    //If i don't Log the error there won't be any way to see the error
    console.error('Error \u{2734}');

    //Send Generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very Wrong'
    });
  }
  // 2.) For the Rendered Website
  if (error.isOperational) {
    return res.status(error.statusCode).render('error', {
      title: 'Something went wrong',
      msg: error.message
    });
  }
  //Programming error or other unknown errors, Don't leak Details

  // log error to the console.
  //If i don't Log the error there won't be any way to see the error
  console.error('Error \u{2734}');

  //Send  a generic error message
  return res.status(error.statusCode).render('error', {
    title: 'Something went wrong',
    msg: 'Please try again later'
  });
};

module.exports = (err, req, res, next) => {
  //Since we are handling all errors in the app , some errors may come from NODE.js
  //SO we set a default of 500 (internal server Error) beacuse an error from the Node
  //Cannot display an error status Code

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  //
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastError(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};
