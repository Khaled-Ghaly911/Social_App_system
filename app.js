const express = require('express');
require('dotenv').config();

const app = express();

const bodyParser = require('body-parser');

//import router
const authRoutes = require('./routes/auth');

app.use(bodyParser.json());

app.use('/auth', authRoutes);

app.listen(3000);
