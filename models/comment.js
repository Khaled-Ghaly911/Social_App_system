const { Sequelize, DataTypes} = require('sequelize');
const sequelize = require('../util/database');

const Comment = sequelize.define('comment',{
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    author: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fromGuest: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    }
})

module.exports = Comment;