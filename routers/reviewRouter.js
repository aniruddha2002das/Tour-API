const express = require('express');
const router = express.Router({ mergeParams: true });
const { getAllReview, getReview, createReview, deleteReview, updateReview,setTourUserIds } = require('../controller/reviewController');
const { protect, restrictTo } = require('../controller/authController');

router.use(protect);
router.route('/').get(getAllReview).post(restrictTo('user'),setTourUserIds,createReview);
router.route('/:id').get(getReview).delete(restrictTo('user','admin'),deleteReview).patch(restrictTo('user','admin'),updateReview);

module.exports = router;