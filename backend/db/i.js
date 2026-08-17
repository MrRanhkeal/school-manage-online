//class.model

`use strict`
const sequilize = require("../config/database");
const { DataTypes } = require('sequelize');
const Classe = sequilize.define(
    `Class`,
    {
        id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        name: { type: DataTypes.STRING(80), allowNull: false },
        level: {
            type: DataTypes.ENUM('primary', 'secondary', 'high_school', 'college'),
            allowNull: false,
        },
        gradeYear: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
        academicYear: { type: DataTypes.STRING(9), allowNull: false }, // e.g. "2025-2026"
        TeacherId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, field: 'teacher_id' }, //FOREIGN KEY (TeacherId) REFERENCES teachers(id) ON DELETE SET NULL homeroomTeacherId
        capacity: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 40 },
        roomNumber: { type: DataTypes.STRING(20), allowNull: true },
        status: {
            type: DataTypes.ENUM('active', 'archived'),
            allowNull: false,
            defaultValue: 'active',
        },
    },
    {
        tableName: 'classes',
        indexes: [
            { fields: ['level'] },
            { fields: ['academic_year'] },
            { fields: ['teacher_id'] },
            { unique: true, fields: ['name', 'academic_year'] },
        ],
    },
)
module.exports = Classe;

//course.model
`use strict`
const { DataTypes } = require('sequelize');
const sequilize = require('../config/database');
const Course = sequilize.define(
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
        classId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, //FOREIGN KEY (classID) REFERENCES classe(id) ON DELETE CASCADE,
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

//department.model
`use strict`
const { DataTypes } = require('sequelize');
const sequilize = require('../config/database');
const Department = sequilize.define(
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

//enrolment.model
`use strict`
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

//staff.model
`use strict`
const sequilize = require("../config/database");
const { DataTypes } = require('sequelize');
const Staff = sequilize.define(
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

//student.model
const sequelize = require("../config/database");
const { DataTypes } = require('sequelize');
const Student = sequelize.define(
    'Student',
    {
        id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        // Reference to auth-service user (no FK — cross-service boundary).
        userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, // reference to auth_db.users, by ID only
        studentCode: { type: DataTypes.STRING(20), allowNull: true },
        firstName: { type: DataTypes.STRING(60), allowNull: false },
        lastName: { type: DataTypes.STRING(60), allowNull: false },
        dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true },
        gender: { type: DataTypes.ENUM('male', 'female', 'other'), allowNull: true },
        level: {
            type: DataTypes.ENUM('primary', 'secondary', 'high_school', 'college'),
            allowNull: false
        },
        gradeYear: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true }, // e.g. grade 1..12 / year 1..4
        classId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, //FOREIGN KEY (classId) REFERENCES classes(id) ON DELETE SET NULL,
        enrollmentYear: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
        guardianName: { type: DataTypes.STRING(120), allowNull: true },
        guardianPhone: { type: DataTypes.STRING(30), allowNull: true },
        email: { type: DataTypes.STRING(160), allowNull: true },
        status: {
            type: DataTypes.ENUM('enrolled', 'graduated', 'withdrawn', 'suspended'),
            allowNull: false, defaultValue: 'enrolled'
        },
    },
    {
        tableName: 'students',
        indexes: [
            { unique: true, fields: ['student_code'] },
            { fields: ['level'] },
            { fields: ['class_id'] },
            { fields: ['enrollment_year'] },
            { fields: ['status'] },
            { fields: ['last_name', 'first_name'] },
        ],
    }
)
module.exports = Student;

//teacher.model
const sequelize = require("../config/database");
const { DataTypes } = require('sequelize');
const Teacher = sequelize.define(
    'Teacher',
    {
        id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        teacherCode: { type: DataTypes.STRING(20), allowNull: true },
        firstName: { type: DataTypes.STRING(60), allowNull: false },
        lastName: { type: DataTypes.STRING(60), allowNull: false },
        email: { type: DataTypes.STRING(160), allowNull: true },
        phone: { type: DataTypes.STRING(30), allowNull: true },
        departmentId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },//FOREIGN KEY (departmentId) REFERENCES department(id) ON DELETE SET NULL,
        specialization: { type: DataTypes.STRING(120), allowNull: true },
        hireDate: { type: DataTypes.DATEONLY, allowNull: true },
        status: {
            type: DataTypes.ENUM('active', 'on_leave', 'retired'),
            allowNull: false,
            defaultValue: 'active',
        },
    },
    {
        tableName: 'teachers',
        indexes: [
            { unique: true, fields: ['teacher_code'] },
            { fields: ['status'] },
            { fields: ['last_name', 'first_name'] },
        ],
    }
)
module.exports = Teacher;
