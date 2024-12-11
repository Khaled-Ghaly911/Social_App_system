const express = require('express');
const router = express.Router();
const commentsController = require('../controller/comment');
const { body } = require('express-validator')


router.get('/comments', commentsController.getComments);

router.post('/createComment', [
    body('content')
        .trim()
        .isLength({ min: 5, max: 500 })
], commentsController.createComment);

module.exports = router;