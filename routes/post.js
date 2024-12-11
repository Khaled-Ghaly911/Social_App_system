const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/is-auth');
const { body } = require('express-validator');

const postController = require('../controller/post')

router.get('/posts', postController.getPosts);

router.post('/createPost',[
    body('title')
    .trim()
    .isLength({min: 3, max: 150}),
    body('content')
    .trim()
    .isLength({min: 8, max: 5000}),
    body(isPublic)
    .isBoolean()
], isAuth, postController.createPost);

module.exports = router;