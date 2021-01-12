const express = require('express');
const reviewController = require('./../controllers/reviewControllers');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictAccessTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictAccessTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictAccessTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;
