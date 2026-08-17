'use strict'
const sequelize = require("../config/database");
const { DataTypes } = require('sequelize');

const Staff = sequelize.define(
    'Staff',
    {
        id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        departmentId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, //FOREIGN KEY (departmentId) REFERENCES departments(id) ON DELETE SET NULL,
        fistName: { type: DataTypes.STRING(60), allowNull: false },
        lastName: { type: DataTypes.STRING(60), allowNull: false },
        email: { type: DataTypes.STRING(60), allowNull: false },
    },
    {
        tableName: 'staffs',
        indexes: [
            { unique: true, fields: ['department_id'] }
        ],
    }
)

module.exports = Staff;