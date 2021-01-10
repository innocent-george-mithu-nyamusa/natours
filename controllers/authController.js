const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const Email = require('../utils/nodemailer');
const AppError = require('../utils/appError');

const signToken = id => {
  return jwt.sign({ id }, process.env.SECRET_KEY_JWT, {
    expiresIn: process.env.EXPIRES_IN_JWT
  });
};

const createSendToken = (user, statusCode, req, res) => {
  //create token with the payload of _id
  const token = signToken(user._id);

  //set cookie withthe name jwt
  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.COOKIE_JWT_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.header['x-forwarded-proto'] === 'https'
  });

  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  //Only accept the name, email, password, passwordConfirm
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  //Inform User of Sign Up, Send welcoming Email;
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  //Create and send Token
  createSendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //.1) Chekc if password and email are provided
  if (!email || !password) {
    return next(new AppError('Please provide email and Password', 400));
  }
  //.2) Query o find user with the email specified and add the password field
  const user = await User.findOne({ email }).select('+password');
  //.2B) Check if user exists and password is correct
  //using comparePasswords, an instance method which is available in all documents

  if (!user || !(await user.comparePasswords(password, user.password))) {
    return next(new AppError('Incorrect password or email', 401));
  }

  //.3) Send back token to user
  createSendToken(user, 200, req, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  //check if the request contains a VALID token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  const decoded = await promisify(jwt.verify)(
    token,
    process.env.SECRET_KEY_JWT
  );

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user belonging the token no longer exists'));
  }

  //Check if user changed password after token was issued
  if (currentUser.passwordChangedAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again', 401)
    );
  }
  //GRANT ACCESS TO PROTECTED USER
  req.user = currentUser;
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.SECRET_KEY_JWT
      );

      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      //Check if user changed password after token was issued
      if (currentUser.passwordChangedAfter(decoded.iat)) {
        return next();
      }
      //GRANT ACCESS TO PROTECTED USER
      req.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'kutsotsonyatokubuda', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({ status: 'success' });
};

exports.restrictAccessTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1. Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email', 404));
  }
  //2.generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //3. Send it to user's email

  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (valid for 10 min)',
    //   message
    // });
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpireAt = undefined;

    await user.save({ validateBeforeSave: false });
    return next(new AppError('There was an error sending this Email', 500));
  }
});

exports.passwordReset = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  createSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1.) Get user from Collection
  const user = await User.findById(req.body.id).select('+password');

  // 2.) Check if posted current password is correct
  if (!(await user.comparePasswords(req.body.passwordCurrent, user.password))) {
    return next(new AppError('You current password is not wrong', 401));
  }
  // 3.) if so , update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will work as intended

  // 4.) Log user in , Send JWT
  createSendToken(user, 201, req, res);
});
