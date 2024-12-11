const User = require('../models/user');
const Post = require('../models/post');
const sequelize = require('sequelize');
const {validationResult} = require('express-validator')

exports.getPosts = async (req, res, next) => {
    const { userId } = req.user;
    let posts;
    try {
        const user = await User.findOne({where: {id: userId}});
        if(!user.isVerified) {
            posts = await Post.findAll({where: {isPublic: true}})
            return res.status(200).json({message: 'posts downloaded successfull', posts: posts});
        } else if(user.isVerified) {
            posts = await Post.findAll();
            return res.status(200).json({message: 'posts downloaded successfull', posts: posts});
        }
    } catch(err) {
        console.error(err);
        res.status(400).json({message: 'failed in getting posts'});
    }
}

exports.createPost = async (req, res, next) => {
    const userId = req.user.id;
    const errors = validationResult(req);
    if(errors){
        return res.status(400).json({message: 'validation errors', errors: errors});
    }
    const {title, content, isPublic} = req.body;
    try {
        const user = await User.findOne({where: {id: userId}});
        
        if(!user) {
            res.status(404).json({message: 'User not found'});
        }

        if(!user.isVerified) {
            res.status(401).json({message: 'user is not verified'});
        }
        const author = user.name;
        const post = await Post.create({
            title,
            content,
            isPublic,
            author,
            userId: user.id
        })

        res.status(201).json({message: 'post created successfully!', post})
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: 'Server error occurred' });
    }
}  