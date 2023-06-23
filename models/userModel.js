const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name! ']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email address!'],
        unique: true,
        lowercase: true,
        validators: [validator.isEmail, 'Please a valid email.']
    },
    photo: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide your password'],
        minlength: 4,
        select: false // To hide password from user.
    },
    confirmPassword: {
        type: String,
        required: [true, 'Please provide your password'],
        minlength: 4,
        // This is only works on CREATE and SAVE !!!
        validate: {
            validator: function (value) {
                return value === this.password;
            },
            message: 'Password is not same!!'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active:{
        type: Boolean,
        default: true,
        select: false // To hide password from user.
    }
});

userSchema.pre('save', async function (next) {
    // If password is not modified then we do not encrypt password
    if (!this.isModified('password')) return next();

    // Hash the password with cost 12
    this.password = await bcrypt.hash(this.password, 12);

    // Delete the confirmPassword field
    this.confirmPassword = undefined;

    next();
});

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();
    // We are subtracting the 1000 ms from date now because somtimes database becomes slow down and before saving data in passwordChangedAt field json web token is issued. Then problem will be occured user cannot signIn.
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

// This middleware will be used BEFORE when find will be searched and it returns that users which are active.
// Here we are using reguler expression /^find/ because to apply to every query that starts with "find" like findabddelete and findandupdate
userSchema.pre(/^find/, function (next) {
    // this is pointing to current query
    this.find({active: {$ne: false}});
    next();
});


// We are creating a instance method to match password with ecrypt password
// Instance method is a method that is gonna be available all documents of a certain collections.
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
}

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        // If JWTTimestamp < changedTimestamp then before password change token was issued
        return JWTTimestamp < changedTimestamp;
    }

    // False means NOT changed
    return false;
};


userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    console.log({ resetToken }, this.passwordResetToken);
    return resetToken;
}


const User = mongoose.model('User', userSchema);

module.exports = User;