'use strict';

const sequelize = require('../config/database');
const Teacher = require('./teacher.model');
const SchoolClass = require('./classe.model');
const Student = require('./student.model');
const Course = require('./course.model');
const Department = require('./department.model');
const Staff = require('./staff.model');
const Enrollment = require('./enrollment.model');

// ---------------------------------------------------------------------------
// Associations (all FKs stay inside academic_db; userId refs to auth_db are
// deliberately NOT associated — cross-service boundary, ID-only).
// ---------------------------------------------------------------------------

// A teacher can be the homeroom teacher of many classes (classes.teacher_id).
Teacher.hasMany(SchoolClass, {
    as: 'homeroomClasses',
    foreignKey: 'TeacherId', //homeroomTeacherId
    onDelete: 'SET NULL',
});
SchoolClass.belongsTo(Teacher, {
    as: 'homeroomTeacher',
    foreignKey: 'TeacherId', //homeroomTeacherId
});

// A class holds many students (students.class_id).
SchoolClass.hasMany(Student, {
    as: 'students',
    foreignKey: 'classId',
    onDelete: 'SET NULL',
});
Student.belongsTo(SchoolClass, {
    as: 'class',
    foreignKey: 'classId',
});

// A teacher teaches many courses (courses.teacher_id).
Teacher.hasMany(Course, {
    as: 'courses',
    foreignKey: 'teacherId',
    onDelete: 'SET NULL',
});
Course.belongsTo(Teacher, {
    as: 'teacher',
    foreignKey: 'teacherId',
});

// A class has many courses on its schedule (courses.class_id).
SchoolClass.hasMany(Course, {
    as: 'courses',
    foreignKey: 'classId',
    onDelete: 'CASCADE',
});
Course.belongsTo(SchoolClass, {
    as: 'class',
    foreignKey: 'classId',
});

// A department has many teachers (teachers.department_id).
Department.hasMany(Teacher, {
    as: 'teachers',
    foreignKey: 'departmentId',
    onDelete: 'SET NULL',
});
Teacher.belongsTo(Department, {
    as: 'department',
    foreignKey: 'departmentId',
});

// A department has many staff members (staffs.department_id).
Department.hasMany(Staff, {
    as: 'staffMembers',
    foreignKey: 'departmentId',
    onDelete: 'SET NULL',
});
Staff.belongsTo(Department, {
    as: 'department',
    foreignKey: 'departmentId',
});

// A department has many courses (courses.department_id).
Department.hasMany(Course, {
    as: 'courses',
    foreignKey: 'departmentId',
    onDelete: 'CASCADE',
});
Course.belongsTo(Department, {
    as: 'department',
    foreignKey: 'departmentId',
});

// A student has many enrollments (enrollments.student_id),
// and a course has many enrollments (enrollments.course_id).
Student.hasMany(Enrollment, {
    as: 'enrollments',
    foreignKey: 'studentId',
    onDelete: 'SET NULL',
});
Enrollment.belongsTo(Student, {
    as: 'student',
    foreignKey: 'studentId',
});

Course.hasMany(Enrollment, {
    as: 'enrollments',
    foreignKey: 'courseId',
    onDelete: 'SET NULL',
});
Enrollment.belongsTo(Course, {
    as: 'course',
    foreignKey: 'courseId',
});

// Many-to-many convenience association: a student is enrolled in many
// courses, and a course has many students, through the enrollments table.
Student.belongsToMany(Course, {
    as: 'enrolledCourses',
    through: Enrollment,
    foreignKey: 'studentId',
    otherKey: 'courseId',
});
Course.belongsToMany(Student, {
    as: 'enrolledStudents',
    through: Enrollment,
    foreignKey: 'courseId',
    otherKey: 'studentId',
});

module.exports = {
    sequelize,
    Teacher,
    SchoolClass,
    Student,
    Course,
    Department,
    Staff,
    Enrollment,
};


// 'use strict';

// const sequelize = require('../config/database');
// const Teacher = require('./teacher.model');
// const SchoolClass = require('./classe.model');
// const Student = require('./student.model');
// const Course = require('./course.model');

// // ---------------------------------------------------------------------------
// // Associations (all FKs stay inside academic_db; userId refs to auth_db are
// // deliberately NOT associated — cross-service boundary, ID-only).
// // ---------------------------------------------------------------------------

// // A teacher can be the homeroom teacher of many classes (classes.teacher_id).
// Teacher.hasMany(SchoolClass, {
//     as: 'homeroomClasses',
//     foreignKey: 'TeacherId', //homeroomTeacherId
//     onDelete: 'SET NULL',
// });
// SchoolClass.belongsTo(Teacher, {
//     as: 'homeroomTeacher',
//     foreignKey: 'TeacherId', //homeroomTeacherId
// });

// // A class holds many students (students.class_id).
// SchoolClass.hasMany(Student, {
//     as: 'students',
//     foreignKey: 'classId',
//     onDelete: 'SET NULL',
// });
// Student.belongsTo(SchoolClass, {
//     as: 'class',
//     foreignKey: 'classId',
// });

// // A teacher teaches many courses (courses.teacher_id).
// Teacher.hasMany(Course, {
//     as: 'courses',
//     foreignKey: 'teacherId',
//     onDelete: 'SET NULL',
// });
// Course.belongsTo(Teacher, {
//     as: 'teacher',
//     foreignKey: 'teacherId',
// });

// // A class has many courses on its schedule (courses.class_id).
// SchoolClass.hasMany(Course, {
//     as: 'courses',
//     foreignKey: 'classId',
//     onDelete: 'CASCADE',
// });
// Course.belongsTo(SchoolClass, {
//     as: 'class',
//     foreignKey: 'classId',
// });

// module.exports = { sequelize, Teacher, SchoolClass, Student, Course };