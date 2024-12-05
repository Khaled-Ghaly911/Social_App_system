const express = require('express');
const router = express.Router();
const authController = require('../controller/auth');
const { body } = require('express-validator');
const rateLimiter = require('express-rate-limit');
const { StandardValidation } = require('express-validator');

const otpRateLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message:{ message: 'Too many OTP requests. Please try again later.' },
    StandardHeaders: true,
    legacyHeaders: false
})

router.post('/signup', authController.signup)

router.post('/verifyOtp', otpRateLimiter, authController.verifyOtp)

router.post('/login', authController.login);

router.post('/resetPassword', otpRateLimiter, authController.resetPassword);

router.post('/verifyResetPass', otpRateLimiter, authController.verifyResetPass);

router.post('/resetEmail', otpRateLimiter, authController.resetEmail);

router.post('/verifyResetEmail', otpRateLimiter, authController.verifyResetEmail);

router.post('/reqOtp', otpRateLimiter, authController.reqOtp);//old version

// router.get('/verify/:token', authController.verify);//old version

module.exports = router;