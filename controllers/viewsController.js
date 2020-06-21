const Tour = require('../models/tourModels');
const User = require('../models/userModels');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.alerts = (req, res, next) => {
  const { alert } = req.query;

  if (alert === 'booking')
    res.locals.alert =
      "your booking was successful! Please check your eamil for confrimation. if Your booking doesn't show up here immediately, Please come back later";

  next();
};

exports.getOverview = catchAsync(async (req, res, next) => {
  //.1) Get data from collection
  const tours = await Tour.find();
  //.2) Build template

  //.3) render the template using data from 1
  res.status(200).render('overview', {
    title: 'All tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.slug) filter = { slug: req.params.slug };
  //.1) get tour document from collection
  const tour = await Tour.findOne(filter).populate({
    path: 'reviews',
    fields: 'review rating user'
  });

  if (!tour) {
    return new AppError('There is no tour with that name', 404);
  }
  const title = tour.name;
  res.status(200).render('tour', {
    title,
    tour
  });
});

exports.getLoginForm = catchAsync(async (req, res) => {
  res.status(200).render('login', {
    title: 'Login into your account'
  });
});

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your Account'
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1.) Find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  // 2.) Find tours with returned ids
  const tourIDs = bookings.map(el => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email
    },
    {
      new: true,
      runValidators: true
    }
  );
  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser
  });
});
