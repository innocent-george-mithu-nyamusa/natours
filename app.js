const path = require('path');
const express = require('express');
const morgan = require('morgan');

//Authentication
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

//Own modules
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const userRouter = require('./routes/userRoutes');
const tourRouter = require('./routes/tourRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');

const app = express();

app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//Implement cross origin resource Sharing (CORS)
app.use(cors());
//gives Access-Control-Allow-Origin
//Example: When the api is hosted on api.natours.com and the frontend is on natours.com
//this requires cors since both resources are considered to be on different domains.
//Implement:
// app.use(cors({
//   origin: 'https://www.natours.com'
// }))

//this gives access to all routes to share Resources
//in other words other domains can make request/ can CONSUME the natours api without restrictions
app.options('*', cors());

//You can also allow access to certain resources through its routes for cors like so
//app.options('/api/v1/tours', cors())
//Serving static file from the public directory
app.use(express.static(path.join(__dirname, 'public')));

//Set http headers
app.use(helmet());

//Data sanitization against NoSql query injection
app.use(mongoSanitize());

//Data sanitization againts XSS
app.use(xss());

//Prevent Parameter pollution
app.use(
  hpp([
    'duration',
    'ratingsQuantity',
    'ratingsAverage',
    'maxGroupSize ',
    'difficulty',
    'price'
  ])
);

app.use(compression());

//Set Node Environment
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// HOT:;
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from the same IP, Please try again in an hour!'
});

//Set limit of request for api from single IP address
app.use('/api', limiter);

app.use(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookCheckout
);

//Body parser reading data into req.body
app.use(express.json({ limit: '10kb' }));

//Access data sent to server from Form
//the Extended attribute allows you to use complex functionality
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

//Cookie parser passes cookie data
app.use(cookieParser());

// app.use((req, res, next) => {
//   req.requestTime = new Date().toISOString();
//   // console.log(req.headers);
//   next();
// });

//ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Cannot Find ${req.originalUrl} on this server!`
  // });
  console.log('handle ');
  next(new AppError(`Cannot Find ${req.originalUrl} on this server!`));
});

//GLOBAL ERROR HANDLING
app.use(globalErrorHandler);
module.exports = app;
