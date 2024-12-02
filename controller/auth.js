const User = require('../models/user');
const { validationResult, Result } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { where } = require('sequelize');


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'khaledghaly000@gmail.com',
        pass: 'ldql dngy lknm jwru'
    }
})


exports.signup = async (req, res, next) => {
    const { email, name, password } = req.body;

    try {
        // Hash the password
        const hashedPass = await bcrypt.hash(password, 12);

        // Create a new user
        const newUser = await User.create({
            email: email,
            name: name,
            password: hashedPass
        });

        // Create a verification token
        const token = jwt.sign({ email: email }, 'verificationCode', { expiresIn: '1h' });

        // Setup email configurations
        const mailConfigurations = {
            from: 'khaledghaly000@gmail.com',
            to: email,
            subject: 'Your email verification',
            text: `Hi! There, You have recently visited 
                    our website and entered your email.
                    Please follow the given link to verify your email:
                    http://localhost:3000/auth/verify/${token}
                    Thanks`
        };

        // Send the email with the verification token
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

    try {
        // Verify the token
        const decoded = jwt.verify(token, 'verificationCode'); // Only verify once

        // Log the decoded object to make sure the email exists
        console.log(decoded);

        // Check if email exists in decoded token
        if (!decoded.email) {
            return res.status(400).json({ message: 'Invalid token or email missing in token.' });
        }

        // Find the user based on the decoded email
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
    }
};
