const User = require('../models/user');
const Comment = require('../models/comment');
const sequelize = require('../util/database');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator')

exports.getComments = async (req, res, next) => {
    const { postId } = req.body;
    try {
        const comments = await Comment.findAll({ where: { postId: postId }});
        if (comments.size === 0) {
            return res.status(200).json({ message: 'No Comments.', comments: comments });
        }

        res.status(200).json({ message: 'comments fetched successfully.', comments: comments });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'fetching comments failed!' });
    }
}

exports.createComment = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const errors = validationResult(req);
    if (errors) {
        return res.status(400).json({ message: 'validation errors', errors: errors });
    }
    const { guestEmail, content, postId, guestName } = req.body;

    try {
        if (authHeader) {
            const token = authHeader.split(' ')[1];


            if (!token) {
                return res.status(401).json({ message: 'Token missing, authorization denied' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const email = decoded.email;
            const userId = decoded.id;
            console.log(userId);
            const user = await User.findOne({ where: { id: userId } });
            if (!user) {
                return res.status(404).json({ message: 'user not found' });
            }
            const author = user.name;
            const comment = await Comment.create({
                author,
                content,
                email,
                postId: postId,
                fromGuest: false
            })

            return res.status(200).json({ message: 'comment created successfully for a user!', comment: comment });
        } else {//guest
            const author = guestName;
            const comment = await Comment.create({
                author,
                content,
                email: guestEmail,
                postId: postId,
                fromGuest: true
            })
            return res.status(200).json({ message: 'comment created successfully for a guest!' })
        }

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'comment creation failed!' })
    }
}