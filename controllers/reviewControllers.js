const Review = require('./../models/reviewModel');
const factory = require('./factoryControllers');

exports.setTourUserIds = (req, res, next) => {
  if (!req.body.id) req.body.id = req.params.tourId;
  if (!req.body.user) req.bod.user = req.user.id;
  next();
};
exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getone(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
