const express = require('express');

const app = express();

const bodyParser = require('body-parser');

//import router
const authRoutes = require('./routes/auth');

app.use(bodyParser.json());

app.use('/auth', authRoutes);

app.listen(3000);
