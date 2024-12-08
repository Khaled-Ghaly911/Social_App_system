require('dotenv').config();

const express = require('express');
const Post = require('./models/post');
const User = require('./models/user');

//Association
User.hasMany(Post, {
    foreignKey: 'userId'
});
Post.belongsTo(User);

const app = express();

const bodyParser = require('body-parser');

//import router
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/post');

app.use(bodyParser.json());

app.use('/auth', authRoutes);
app.use('/post', postRoutes);

app.listen(3000);
