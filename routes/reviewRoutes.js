const express = require('express');
const reviewController = require('./../contollers/reviewControllers');
const authController = require('./../contollers/authController');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictAccessTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );
router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(reviewController.updateReview)
  .delete(
    authController.protect,
    authController.restrictAccessTo('user'),
    reviewController.deleteReview
  );
module.exports = router;
