const express = require('express');
const router = express.Router();

const { getAllTours, getTour, aliasTopTours, getTourStats, getMonthlyStats, createTour, deleteTour, updateTour,getToursWithin,getDistances } = require('../controller/tourController');
const { protect, restrictTo } = require('../controller/authController');
const reviewRouter = require('./reviewRouter');

router.route('/top-5-tours').get(aliasTopTours, getAllTours);
router.route('/').get(protect, getAllTours);
router.route("/:id").get(protect, getTour).delete(protect, restrictTo('admin', 'lead-guide'), deleteTour).patch(protect, restrictTo('admin', 'lead-guide'), updateTour);
router.route('/create-Tour').post(protect, restrictTo('admin', 'lead-guide'), createTour);
router.route('/tourStatus').get(getTourStats);
router.route('/tour-monthly-stat/:year').get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyStats);

// /tours-within/233/center/-40,45/unit/mi
router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(protect,getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(getDistances);


// It is nested routing
// POST '/3563fht981/review'
router.use('/:tourID/review', reviewRouter);
module.exports = router;