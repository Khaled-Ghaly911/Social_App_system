const Sequelize = require('sequelize');

const sequelize = new Sequelize('social_app', 'postgres', '123456', {
  dialect: 'postgres',
  host: 'localhost',
  port: 5432,
  ssl: false,
  logging: console.log,
});

sequelize.sync();

module.exports = sequelize;  // Use ES modules export syntax
