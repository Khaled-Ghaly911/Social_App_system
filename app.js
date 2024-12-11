require('dotenv').config();

const express = require('express');
const Post = require('./models/post');
const User = require('./models/user');
const Comment = require('./models/comment');

//Association
User.hasMany(Post, {
    foreignKey: 'userId'
});
Post.belongsTo(User);

Post.hasMany(Comment, {
    foreignKey: 'postId'
});
Comment.belongsTo(Post);


const app = express();

const bodyParser = require('body-parser');

//import router
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/post');
const commentRoutes = require('./routes/comment');

app.use(bodyParser.json());

app.use('/auth', authRoutes);
app.use('/post', postRoutes);
app.use('/comment', commentRoutes);

app.listen(3000);
