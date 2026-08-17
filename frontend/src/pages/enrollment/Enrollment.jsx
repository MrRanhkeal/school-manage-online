import React from 'react';
import { Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CrudManager from '../../components/common/CrudManager';
import useOptions from '../../hooks/useOptions';
import { ENDPOINTS } from '../../services/endpoints';
import { ROLES } from '../../utils/constants';
import { capitalize, fullName } from '../../utils/helpers';

const ENROLLMENT_STATUSES = ['active', 'dropped', 'completed'];

export default function Enrollment() {
    const { t } = useTranslation();

    const studentOptions = useOptions(
        ENDPOINTS.students.list,
        (stu) =>
            stu.studentCode
                ? `${fullName(stu)} (${stu.studentCode})`
                : fullName(stu)
    );

    const courseOptions = useOptions(
        ENDPOINTS.courses.list,
        (course) => `${course.code} - ${course.title}`
    );

    return (
        <CrudManager
            title={t('nav.enrollments')}
            endpoint={ENDPOINTS.enrollments}
            searchable={false}
            writeRoles={[ROLES.ADMIN, ROLES.STAFF]}
            deleteRoles={[ROLES.ADMIN]}
            columns={[
                {
                    id: 'index',
                    label: '#',
                    render: (_, __, index) => index + 1,
                },
                {
                    id: 'student',
                    label: 'Student',
                    minWidth: 180,
                    render: (r) =>
                        r.student ? fullName(r.student) : r.studentId,
                },
                {
                    id: 'course',
                    label: 'Course',
                    minWidth: 200,
                    render: (r) =>
                        r.course ? `${r.course.code} - ${r.course.title}` : r.courseId,
                },
                {
                    id: 'status',
                    label: 'Status',
                    render: (r) => (
                        <Chip
                            size="small"
                            label={capitalize(r.status || 'active')}
                            color={
                                r.status === 'dropped'
                                    ? 'default'
                                    : r.status === 'completed'
                                        ? 'success'
                                        : 'primary'
                            }
                        />
                    ),
                },
            ]}
            filters={[
                {
                    name: 'courseId',
                    label: 'Course',
                    options: courseOptions,
                },
                {
                    name: 'status',
                    label: 'Status',
                    options: ENROLLMENT_STATUSES,
                },
            ]}
            formFields={[
                {
                    name: 'studentId',
                    label: 'Student',
                    type: 'select',
                    options: studentOptions,
                    required: true,
                    half: true,
                    resolve: (row) => row.studentId ?? row.student?.id ?? '',
                },
                {
                    name: 'courseId',
                    label: 'Course',
                    type: 'select',
                    options: courseOptions,
                    required: true,
                    half: true,
                    resolve: (row) => row.courseId ?? row.course?.id ?? '',
                },
                {
                    name: 'status',
                    label: 'Status',
                    type: 'select',
                    options: ENROLLMENT_STATUSES,
                    half: true,
                },
            ]}
        />
    );
}