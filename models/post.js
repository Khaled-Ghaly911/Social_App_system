const { Sequelize, DataTypes} = require('sequelize');
const sequelize = require('../util/database');

const Post = sequelize.define('post', {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.STRING,
        allowNull: false
    },
    author: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isPublic: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    }
})

module.exports = Post