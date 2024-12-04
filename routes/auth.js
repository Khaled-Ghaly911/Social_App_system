const express = require('express');
const router = express.Router();
const authController = require('../controller/auth');
const { body } = require('express-validator');


router.post('/signup', authController.signup)

router.post('/verifyOtp', authController.verifyOtp)

router.post('/login', authController.login);

router.post('/resetPassword', authController.resetPassword);

router.post('/verifyResetPass', authController.verifyResetPass);

// router.post('/reqOtp', authController.reqOtp);//old version
// router.get('/verify/:token', authController.verify);//old version

module.exports = router;