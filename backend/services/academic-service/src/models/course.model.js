'use strict'
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Course = sequelize.define(
    'Course',
    {
        id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        code: { type: DataTypes.STRING(20), allowNull: true },
        title: { type: DataTypes.STRING(140), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        level: {
            type: DataTypes.ENUM('primary', 'secondary', 'high_school', 'college'),
            allowNull: false,
        },
        credits: { type: DataTypes.DECIMAL(4, 1), allowNull: false, defaultValue: 1.0 },
        teacherId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, //FOREIGN KEY (teacherId) REFERENCES teachers(id) ON DELETE SET NULL
        classId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, //FOREIGN KEY (classID) REFERENCES classes(id) ON DELETE CASCADE,
        departmentId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, //FOREIGN KEY (departmentId) REFERENCES department(id) ON DELETE CASCADE,
        academicYear: { type: DataTypes.STRING(9), allowNull: true },
        status: {
            type: DataTypes.ENUM('open', 'closed', 'archived'),
            allowNull: false,
            defaultValue: 'open',
        },
    },
    {
        tableName: 'courses',
        indexes: [
            { unique: true, fields: ['code'] },
            { fields: ['level'] },
            { fields: ['teacher_id'] },
            { fields: ['class_id'] },
            { fields: ['status'] },
        ],
    }
)
module.exports = Course;