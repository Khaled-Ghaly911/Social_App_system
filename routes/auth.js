const express = require('express');
const router = express.Router();
const authController = require('../controller/auth');
const { body } = require('express-validator');
const rateLimiter = require('express-rate-limit');
const { body } = require('express-validator');

const otpRateLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: 'Too many OTP requests. Please try again later.' },
    StandardHeaders: true,
    legacyHeaders: false
})

router.post('/signup', [
    body('email')
        .trim()
        .isEmail(),
    body('name')
        .trim()
        .isLength({ min: 3, max: 150 }),
    body('password')
        .trim()
        .isLength({ min: 8, max: 50 })
], authController.signup)

router.post('/verifyOtp',[
    body('email')
    .trim()
    .isEmail(),
    body('otp')
    .trim()
    .isLength({min: 4, max: 4})
], otpRateLimiter, authController.verifyOtp)

router.post('/login', [
    body('email')
        .trim()
        .isEmail(),
    body('password')
        .trim()
        .isLength({ min: 8, max: 50 })
], authController.login);

router.post('/resetPassword', [
    body('email')
        .trim()
        .isEmail()
], otpRateLimiter, authController.resetPassword);

router.post('/verifyResetPass', [
    body('email')
        .trim()
        .isEmail(),
    body('otp')
        .trim()
        .isLength({ min: 4, max: 4 }),
    body('newPass')
        .trim()
        .isLength({ min: 8, max: 50 })
], otpRateLimiter, authController.verifyResetPass);

router.post('/resetEmail', [
    body('email')
        .trim()
        .isEmail(),
    body('newEmail')
        .trim()
        .isEmail()
], otpRateLimiter, authController.resetEmail);

router.post('/verifyResetEmail', [
    body('newEmail')
        .trim()
        .isEmail(),
    body('otp')
        .trim()
        .isLength({ min: 4, max: 4 })
], otpRateLimiter, authController.verifyResetEmail);

router.post('/reqOtp', [
    body('email')
        .trim()
        .isEmail()
], otpRateLimiter, authController.reqOtp);//old version

// router.get('/verify/:token', authController.verify);//old version

module.exports = router;