const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError')
const factory = require('./../controller/handlerFactory');

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    // Object.keys(obj) this will return a array.
    Object.keys(obj).forEach(ele => {
        if(allowedFields.includes(ele)){
            newObj[ele] = obj[ele];
        }
    })

    return newObj;
}


exports.updateMe = catchAsync(async (req, res, next) => {
    // 1.) Create error if user POSTs password data.
    if (req.body.password || req.body.ConfirmPassword) {
        return next(new AppError('This route is not for password updates. Please use /updateMyPassword.', 400));
    }

    const filterBody = filterObj(req.body,'name','email');
    const updateUser = await User.findByIdAndUpdate(req.user.id, filterBody, { new: true, runValidators: true });

    res.status(200).json({
        status: 'success',
        data: {
            user: updateUser
        }
    });

})


exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, {active: false});

    res.status(204).json({
        status: 'success',
        data: null
    });
})

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};


exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);
exports.deleteUser = factory.deleteOne(User);
// Do NOT update password with route.
exports.updateUser = factory.updateOne(User);

