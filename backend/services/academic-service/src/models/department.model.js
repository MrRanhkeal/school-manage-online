'use strict'
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');


const Department = sequelize.define(
    'Department',
    {
        id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        code: { type: DataTypes.STRING(20), allowNull: true },
        name: { type: DataTypes.STRING(60), allowNull: false },
        locations: { type: DataTypes.STRING(60), allowNull: true },
    },
    {
        tableName: 'departments',
        indexes: [
            { unique: true, fields: ['code'] }
        ],
    }
);
module.exports = Department;