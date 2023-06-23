const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError')
const sendEmail = require('./../utils/email');


const signToken = (id) => {
    // create a token
    // jwt.sign(payload, secretOrPrivateKey, [options, callback])
    // Here paylode is we are using new user id
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id)

    // Cookie setting
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        // this cookie only be sent when we use HTTPS
        // secure: true, (This part will be activated in production because there we use HTTPS)
        // This cookie is not accessible in web browsers It prevents cross-site scripting attacks
        httpOnly: true
    }

    if(process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);

    // Remove the password from output.This password is not saved in the database because we don't use save()
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
}

// Here error handeling will bre added.
exports.signUp = catchAsync(async (req, res, next) => {
    const newUser = await User.create(req.body);
    createSendToken(newUser, 201, res);
})


exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1.) Check if email ans password exists
    if (!email || !password) {
        // Here error handeling code will be injected.
        return next(new AppError('Please provide email or password 🙃🙃🙃 !!', 400));
    }

    // 2.) check if email and password correct

    // We have to check in database. As we hide the password in model then it does not return password back. Then we explicitly select password field
    const user = await User.findOne({ email }).select('+password');

    if (!user || !await user.correctPassword(password, user.password)) {
        // Here error handeling code will be injected.
        return next(new AppError('Incorrect Email or Password 😔😔😔😔 !!', 401));
    }

    // 3.) If everything is OK then send token to client.
    createSendToken(user, 200, res);
});


exports.protect = catchAsync(async (req, res, next) => {
    // 1.) Getting token Id check of it's there
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        // Here error handeling code will be injected.
        return next(new AppError('You are not logged in 🙃🙃🙃 !!', 401));
    }

    // 2.) Verification of token.

    // jwt verify function takes thke arguments 1.) token and 2.) JWT_SECRET 3.) A callback function. This call back function gonna run as soon as verification is completed. This verify is asynchronous function then when it verify this token, It will call callback function that we can specify. promisify(jwt.verify) It will return a promise.
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3.) Check if user still exists

    // After Sign up If user delete data from database still If we do not this layer security check, By old JWT token it can access data.
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(new AppError('This user belonging to this token does not no longer exist. ', 401));
    }

    // 4.) Check if user changed password after the token has issued

    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently change password! Please Long In !!', 401));
    }

    // GRANT ACCESS TO PROTECED ROUTE
    req.user = currentUser;
    next();
});

// Middleware function does not take argument then we have to use a wrapper function which return a middleware.
exports.restrictTo = (...role) => {
    return (req, res, next) => {
        // role ['admin','lead-guide'] 
        // If req.user.role is not in role ['admin','lead-guide'], then we return a error
        // This req.user is coming from protect 
        if (!role.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action !!🙃🙃🙃🙃', 403));
        }

        next();
    };
}

exports.forgetPassword = catchAsync(async (req, res, next) => {
    // 1.) Get user based POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('There is no user with this email adderess !!', 404));
    }

    // 2.) Genarate the random token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });


    // 3.) Send it to user's email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/user/resetPassword/${resetToken}`

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token (Valid for 10 min).',
            message
        })
        res.status(200).json({
            status: 'success',
            message: 'Token send to email !!'
        })
    }
    catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError('There war an error to sending mail. Please try again !!', 500));
    }
});




exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1.) Get User based on token.

    // req.params.token we are wrting param because this token is coming from reset url 
    const hashToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    // Check with hashToken and encrypted token are matching or not 
    const user = await User.findOne({ passwordResetToken: hashToken, passwordResetExpires: { $gt: Date.now() } })


    // 2.) If token has not expired, and there is user, set new password
    if (!user) {
        return next(new AppError('Token is invalid or has expired.!!', 400));
    }

    // set new password into password field.
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;

    // passwordResetToken and passwordResetExpires fields have to be undefined
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // save every changes into database.
    await user.save();


    // 3.) Update passwordChangedAt property from the user.
    // 4.) Log the user in and send JWT token
    createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1.) Get user from collections
    // As this update password feature only for authenticated user then we check user by his/ser ID
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
        next(new AppError('You are not authenticated !!', 404));
    }

    // 2.) Check if POSTed current password is correct
    // passwordCurrent this will be coming from request body.
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Incorrect Password 😔😔😔😔 !!', 401));
    }

    // 3.) If so, update password
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    await user.save();
    // User.findByIdAndUpdate() will NOT work as intended!

    // 4.) Log user in, send JWT token
    createSendToken(user, 200, res);

});