const User = require('../models/user');
const { validationResult, Result } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { where } = require('sequelize');
const randomString = require('randomstring');
require('dotenv').config();

//store email and its otp
const otpCache = {};

//generating OTP function
function generateOTP() {
    return randomString.generate({ length: 4, charset: 'numeric' });
}



const transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE,
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    }
})

function sendOtp(email, otp) {
    const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: email,
        subject: 'OTP Verification',
        text: `Your OTP for verification is ${otp}`
    }

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err);
            const error = new Error('Email sending failed');
            throw error;
        }

        console.log('your Email sent successfully');
        console.log(info);
    });
}



exports.signup = async (req, res, next) => {
    const { email, name, password } = req.body;

    try {
        const hashedPass = await bcrypt.hash(password, 12);

        const newUser = await User.create({
            email: email,
            name: name,
            password: hashedPass
        });

        const token = jwt.sign({ email: email }, 'verificationCode', { expiresIn: '1h' });

        const mailConfigurations = {
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: 'Your email verification',
            text: `Hi! There, You have recently visited 
                    our website and entered your email.
                    you signup successfully we will send you email for otp
                    Thanks`
        };

        await transporter.sendMail(mailConfigurations);
        console.log('Email sent successfully.');

        // Send a success response
        res.status(201).json({
            message: 'User created successfully! Check your email for verification.',
            userId: newUser.id
        });

    } catch (err) {
        // Log the error
        console.error(err);

        // Send an error response
        if (err instanceof jwt.JsonWebTokenError) {
            return res.status(500).json({ message: 'Error generating JWT token.' });
        }
        if (err instanceof bcrypt.BcryptError) {
            return res.status(500).json({ message: 'Error hashing the password.' });
        }

        // General error message
        res.status(500).json({ message: 'User creation failed' });
    }
};

exports.verify = async (req, res, next) => {
    const token = req.params.token;

    const decoded = jwt.verify(token, 'verificationCode');

    console.log(decoded);

    // Check if email exists in decoded token
    if (!decoded.email) {
        return res.status(400).json({ message: 'Invalid token or email missing in token.' });
    }

    try {
        const user = await User.findOne({ where: { email: decoded.email } });

        // If the user is not found
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // If the user is already verified
        if (user.isVerified) {
            return res.status(200).json({ message: 'Email is already verified.' });
        }

        // Mark the user as verified
        user.isVerified = true;
        await user.save();

        // Return success response
        console.log('User is verified!');
        res.status(200).json({ message: 'User verified successfully.' });

    } catch (err) {
        console.log(err);
        res.status(400).json({
            message: 'Email verification failed. The link may be invalid or expired.',
        });
    };
};

exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email: email } });
        let isVerified = user.isVerified;
        if (!user) {
            return res.status(404).json({ message: 'user not found' })
        }

        if(!isVerified) {
            return res.status(400).json({ message: 'your account is not verivied yet' });
        }
        const isAuthenticated = await bcrypt.compare(password, user.password);
        

        const token = jwt.sign({
            email: email,
            id: user.id,
        }, process.env.JWT_SECRET, { expiresIn: '1d' })

        if (isAuthenticated) {
            return res.status(200).json({ 
                message: 'Password is correct!',
                token: token
             });
        } else {
            return res.status(400).json({ message: 'password is incorrect!' });
        }
    } catch (err) {
        throw err;
    }
}

exports.reqOtp = async (req, res, next) => {
    const { email } = req.body;
    const otp = generateOTP();
    otpCache[email] = otp;
    console.log(otpCache)

    sendOtp(email, otp);
    res.cookie('otpCache', otpCache, { maxAge: 300000, httpOnly: true });
    res.status(200).json({ message: 'OTP sent successfully' });
}

exports.verifyOtp = async (req, res, next) => {
    const { email, otp } = req.body;

    try {
        console.log(otpCache);
        if (!otpCache.hasOwnProperty(email)) {
            return res.status(400).json({ message: 'No OTPs For this Email' });
        }

        if (otpCache[email] === otp) {
            delete otpCache[email];
            try {
                const user = await User.findOne({ where: { email: email } });

                // If the user is not found
                if (!user) {
                    return res.status(404).json({ message: 'User not found.' });
                }

                // If the user is already verified
                if (user.isVerified) {
                    return res.status(200).json({ message: 'Email is already verified.' });
                }

                // Mark the user as verified
                user.isVerified = true;
                await user.save();

                // Return success response
                console.log('User is verified!');
                res.status(200).json({ message: 'User verified successfully.' });

            } catch (err) {
                console.log(err);
                res.status(400).json({
                    message: 'Email verification failed. The link may be invalid or expired.',
                });
            }
            res.status(200).json({ message: 'Otp verified successfully!' })
        }
    } catch (error) {
        console.log(error);
    }
}