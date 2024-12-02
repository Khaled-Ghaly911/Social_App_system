const express = require('express');
const router = express.Router();
const authController = require('../controller/auth');
const { body } = require('express-validator');

router.get('/verify/:token', authController.verify);

router.post('/signup', authController.signup)




module.exports = router;