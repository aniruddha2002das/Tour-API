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

    // 2.)Filtered out unwanted fields names that are not allowed to be updated

    // Here we use findByIdAndUpdate() but before we do not use it because we are dealing sencetive data like password, So We should run all validators,middlewares which are helping to encrypted password. If we use findByIdAndUpdate() then all middlewares,validators does not work this function directly save data in database, password also will not be encrypted.But here we are not dealing with sencetive data so we can use it.
    const filterBody = filterObj(req.body,'name','email');
    // This filterBody we are using because some fields have in database that user can not give or update like 'role'. What will be the role that candidate can not fix. Candidates have some options that he/she can update like name , email
    

    // 3.) Update user document.
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

// This middleware helps If there is no id in params then it will take from protect and set in params.
// This middleware we are using because In case get me We have to pass the the user id into getOne() feunction. But in case of getMe, id is coming from JWT then we are use this middleware.
exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};


exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);
exports.deleteUser = factory.deleteOne(User);
// Do NOT update password with route.
exports.updateUser = factory.updateOne(User);

