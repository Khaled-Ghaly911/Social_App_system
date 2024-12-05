const User = require('../models/user');
const { validationResult, Result } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const sequelize = require('sequelize');
const randomString = require('randomstring');
require('dotenv').config();
const redis = require('redis');
const redisClient = redis.createClient();

redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
    console.error('Redis error:', err);
});

redisClient.connect(); 

async function storeOtp(email, otp) {
    try {
        await redisClient.setEx(email, 300, otp);
        console.log(`OTP stored in Redis for ${email}`);
    } catch (err) {
        console.error('Error storing OTP in Redis:', err);
        throw new Error('Failed to store OTP.');
    }
}

async function retrieveOtp(email) {
    try {
        const otp = await redisClient.get(email);
        return otp;
    } catch (err) {
        console.error('Error retrieving OTP from Redis:', err);
        throw new Error('Failed to retrieve OTP.');
    }
}

async function deleteOtp(email) {
    try {
        await redisClient.del(email);
    } catch (err) {
        console.error('Error deleting OTP from Redis:', err);
        throw new Error('Failed to delete OTP.');
    }
}


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
///////////////////////////////////////////////////////functions
async function sendEmail(to, subject, text) {
    const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: email,
        subject: subject,
        text: text
    }
    try{
        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${to}`);
    } catch (error) {
        console.error(`Error sending email: ${error.message}`);
        throw new Error('Email Sending Failed');
    }    
}
/////////////////////////////////////////////////////


//////////////////////////////////////////////////routesLogic
exports.signup = async (req, res, next) => {
    const { email, name, password } = req.body;
    
    try {
        const hashedPass = await bcrypt.hash(password, 12);
        
        const newUser = await User.create({
            email: email,
            name: name,
            password: hashedPass
        });
        

        const otp = generateOTP();
        await storeOtp(email, otp);
        await sendEmail(email, `OTP Verification`, `Your OTP is : ${otp}`);
        
        res.status(201).json({
            message: 'User created successfully! Check your email for verification.',
            userId: newUser.id
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'User creation failed' });
    }
};

exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email: email } });
        let isVerified = user.isVerified;
        if (!user) {
            return res.status(404).json({ message: 'Invalid email or password.' })
        }

        if(!isVerified) {
            return res.status(400).json({ message: 'Account is not verivied yet' });
        }

        const isAuthenticated = await bcrypt.compare(password, user.password);
        
        const token = jwt.sign({
            email: email,
            id: user.id,
        }, process.env.JWT_SECRET, { expiresIn: '1d' })

        if (isAuthenticated) {
            return res.status(200).json({ 
                message: 'Login successful!',
                token: token
            });
        } else {
            return res.status(400).json({ message: 'password is incorrect!' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({message: `Login failed.`});
    }
};

exports.verifyOtp = async (req, res, next) => {
    const { email, otp } = req.body;

    try {
        const storedOtp = await retrieveOtp(email);

        if (!storedOtp || storedOtp !== otp) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        await deleteOtp(email);
        
        const user = await User.findOne({ where: { email: email } });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (user.isVerified) {
            return res.status(200).json({ message: 'Email is already verified.' });
        }

        user.isVerified = true;
        await user.save();

        console.log('User is verified!');
        res.status(200).json({ message: 'Email verified successfully.' });        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Verification failed.'});
    }
}


exports.resetPassword = async (req, res, next) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({where: {email: email}});

        if(!user) {
            res.status(404).json('user not found!');
        }

        const otp = generateOTP();
        await storeOtp(email, otp);
        sendEmail(email, 'Password Reset OTP', `your OTP is : ${otp}`);
        res.status(200).json({message: 'OTP sent successfully.'});
    } catch(err) {
        console.error(err);
        res.status(500).json({message: 'Failed to send reset OTP'});
    }
};

exports.verifyResetPass = async(req, res, next) => {
    const { email, otp, newPass } = req.body;
    
    try {
        const storedOtp = await retrieveOtp(email);
        if(!storeOtp || storedOtp !== otp) {
            return res.status(400).json({ message: 'Invalid or expired otp.' });
        }
   
        await deleteOtp(email);
            
        const user = await User.findOne({where: {email: email}});
        
        hashedPass = await bcrypt.hash(newPass, 12);

        if(!user) {
            return res.status(404).json({message: 'user not found'});
        }

                
        await User.update({password: hashedPass},{where: {email: email}})
        res.status(200).json({message: 'Password updated succefully'});
    } catch(err) {
        console.error(err);
        res.status(500).json({message: 'password reset failed'});
    } 
}

exports.resetEmail = async (req, res, next) => {
    const { newEmail, email } = req.body;

    try {
        if(!email || !newEmail) {
            return res.status(404).json({message: 'Both current and new email addresses are required.'});
        }

        const user = await User.findOne({where: {email: email}});
        if(!user) {
            res.status(404).json('user not found!');
        }

        user.email = newEmail;
        user.isVerified = false;
        await user.save();

        const otp = generateOTP();
        await storeOtp(newEmail, otp);

        await sendEmail(newEmail, 'Email Reset Verification', `Your OTP is: ${otp}`)
        res.status(200).json({message: 'OTP sent successfully'});
    } catch(err) {
        console.error(err);
        res.status(500).json({message: 'Failed to reset email.'});
    }
}

exports.verifyResetEmail = async(req, res, next) => {
    const { newEmail, otp } = req.body;
    try {
        const storedOtp = await retrieveOtp(newEmail);

        if(!storedOtp || storedOtp !== otp) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        await deleteOtp(newEmail);
        const user = await User.findOne({where: {email: newEmail}});

        if(!user) {
            return res.status(404).json({message: 'user not found'});
        }

        user.isVerified = true;
        user.save();
        res.status(200).json({message: `account's email changed successfully`});

    } catch(err) {
        console.error(err);
        res.status(500).json({message: 'Failed to verify email reset.'});
    } 
}

exports.reqOtp = async (req, res, next) => {
    const { email } = req.body;
    try {
        if (!email) {
            return res.status(400).json({ message: 'Email is required to request OTP.' });
        }
        const otp = generateOTP();
        await storeOtp(email);

        await sendEmail(email, 'Your OTP Code', `Your OTP is: ${otp}`);
        res.status(200).json({ message: 'OTP sent successfully' });
    } catch(err) {
        console.error(err);
    }
}
////////////////////////////////////////////////////////////////////////////
// snap shoot of old verification


// exports.verify = async (req, res, next) => {
//     const token = req.params.token;
    
//     const decoded = jwt.verify(token, 'verificationCode');
    
//     console.log(decoded);
    
//     if (!decoded.email) {
//         return res.status(400).json({ message: 'Invalid token or email missing in token.' });
//     }
    
//     try {
//         const user = await User.findOne({ where: { email: decoded.email } });

//         if (!user) {
//             return res.status(404).json({ message: 'User not found.' });
//         }

//         if (user.isVerified) {
//             return res.status(200).json({ message: 'Email is already verified.' });
//         }

//         user.isVerified = true;
//         await user.save();

//         console.log('User is verified!');
//         res.status(200).json({ message: 'User verified successfully.' });

//     } catch (err) {
//         console.log(err);
//         res.status(400).json({
//             message: 'Email verification failed. The link may be invalid or expired.',
//         });
//     };
// };

// to be used :)
// const errors = validationResult(req);
// if(!errors.isEmpty()) {
//     return res.status(400).json({errors: errors.array()});
// }