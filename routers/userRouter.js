const express = require('express');
const router = express.Router();
const multer = require('multer');
const { signUp, login, forgetPassword, resetPassword, updatePassword, protect, restrictTo } = require('../controller/authController');
const { getAllUsers, updateMe, deleteMe, deleteUser, updateUser, getMe, getUser } = require('./../controller/userController');

const upload = multer({dest: 'public/img/users'})

router.route('/signup').post(signUp);
router.route('/login').post(login);
router.route('/forgetPassword').post(forgetPassword);
router.route('/resetPassword/:token').patch(resetPassword);

// Protect all routers after this middleware.
router.use(protect); // This is a middleware then After running this middleware completely below routers will be running, All below routers are protected.

router.route('/updateMyPassword').patch(updatePassword);
router.route('/updateMe').patch(updateMe);
router.route('/deleteMe').delete(deleteMe);

router.use(restrictTo('admin'));

router.route('/me').get(getMe, getUser);
router.route('/getAllUsers').get(getAllUsers);
router.route('/:id').delete(deleteUser).patch(updateUser);

module.exports = router;