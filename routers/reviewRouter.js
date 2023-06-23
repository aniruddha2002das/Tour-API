const express = require('express');
// mergeParams: true this is for merge params. When any use this router '/:tourID/review' tourRouter redirects to reviewRouter. But reviewRouter has no access on tourID. So to access this ID We have to enable {mergeParams: true} options.
const router = express.Router({ mergeParams: true });
const { getAllReview, getReview, createReview, deleteReview, updateReview,setTourUserIds } = require('../controller/reviewController');
const { protect, restrictTo } = require('../controller/authController');

// POST /tour/4389ufhyt823/review
// GET /tour/4389ufhyt823/review
router.use(protect);
router.route('/').get(getAllReview).post(restrictTo('user'),setTourUserIds,createReview);
router.route('/:id').get(getReview).delete(restrictTo('user','admin'),deleteReview).patch(restrictTo('user','admin'),updateReview);

module.exports = router;