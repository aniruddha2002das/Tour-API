const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError')
const factory = require('./../controller/handlerFactory');



exports.setTourUserIds = catchAsync(async (req,res,next) => {
    // Allowed nested routes.
    // If there is no ID of tour in body section, then take this ID from req.params
    if(!req.body.tour) req.body.tour = req.params.tourID;
    // If there is no ID of user in body section,then take this ID which coming from protect.
    if(!req.body.user) req.body.user = req.user.id;
    next();
});

exports.getReview = factory.getOne(Review);
exports.getAllReview = factory.getAll(Review);
exports.createReview = factory.createOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);

