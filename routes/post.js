const express = require('express');
const router = express.Router();
const isAuth  = require('../middleware/is-auth');
const postController = require('../controller/post')

router.get('/posts', postController.getPosts);

router.post('/createPost', isAuth, postController.createPost);

module.exports = router;