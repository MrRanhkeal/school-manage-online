'use strict'
const sequelize = require('../config/database.js');
const { DataTypes } = require('sequelize');

const Enrollment = sequelize.define(
    'Enrollment',
    {
        id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        studentId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, //FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE SET NULL
        courseId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, //FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE SET NULL
        status: { type: DataTypes.ENUM('active', 'completed', 'dropped'), defaultValue: 'active' },
        grade: { type: DataTypes.STRING(5), allowNull: true },
    },
    {
        tableName: 'enrollments',
        indexes: [
            { unique: true, fields: ['student_id', 'course_id'] },
        ],
    }
);

module.exports = Enrollment;