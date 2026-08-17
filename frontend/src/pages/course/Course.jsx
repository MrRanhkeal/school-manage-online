import React from 'react';
import { Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CrudManager from '../../components/common/CrudManager';
import useOptions from '../../hooks/useOptions';
import { ENDPOINTS } from '../../services/endpoints';
import { LEVELS, COURSE_STATUSES, ROLES } from '../../utils/constants';
import { capitalize, fullName } from '../../utils/helpers';
import { isNumber } from '../../utils/validators';

const STATUS_COLORS = {
  open: 'success',
  closed: 'warning',
  archived: 'default',
};

export default function Course() {
  const { t } = useTranslation();

  const teacherOptions = useOptions(
    ENDPOINTS.teachers.list,
    (teacher) =>
      teacher.teacherCode
        ? `${fullName(teacher)} (${teacher.teacherCode})`
        : fullName(teacher)
  );

  const classOptions = useOptions(
    ENDPOINTS.classes.list,
    (cls) => `${cls.name} (${cls.academicYear})`
  );

  const departmentOptions = useOptions(
    ENDPOINTS.departments.list,
    (department) => `${department.code} - ${department.name}`
  );

  return (
    <CrudManager
      title={t('nav.courses')}
      endpoint={ENDPOINTS.courses}
      searchable
      writeRoles={[ROLES.ADMIN, ROLES.STAFF]}
      deleteRoles={[ROLES.ADMIN]}
      columns={[
        {
          id: 'index',
          label: '#',
          render: (_, __, index) => index + 1,
        },
        {
          id: 'code',
          label: 'Code',
        },
        {
          id: 'title',
          label: 'Title',
          minWidth: 200,
        },
        {
          id: 'level',
          label: 'Level',
          render: (row) => capitalize(row.level),
        },
        {
          id: 'teacher',
          label: 'Teacher',
          minWidth: 180,
          render: (row) =>
            row.teacher ? fullName(row.teacher) : '—',
        },
        {
          id: 'class',
          label: 'Class',
          minWidth: 150,
          render: (row) => row.class?.name || '—',
        },
        {
          id: 'department',
          label: 'Department',
          minWidth: 180,
          render: (row) => row.department?.name || '—',
        },
        {
          id: 'credits',
          label: 'Credits',
          align: 'right',
        },
        {
          id: 'academicYear',
          label: 'Academic Year',
        },
        {
          id: 'status',
          label: 'Status',
          render: (row) => (
            <Chip
              size="small"
              label={capitalize(row.status || 'open')}
              color={STATUS_COLORS[row.status] || 'default'}
            />
          ),
        },
      ]}
      filters={[
        {
          name: 'level',
          label: 'Level',
          options: LEVELS,
        },
        {
          name: 'teacherId',
          label: 'Teacher',
          options: teacherOptions,
        },
        {
          name: 'classId',
          label: 'Class',
          options: classOptions,
        },
        {
          name: 'departmentId',
          label: 'Department',
          options: departmentOptions,
        },
        {
          name: 'academicYear',
          label: 'Academic Year',
          type: 'text',
        },
        {
          name: 'status',
          label: 'Status',
          options: COURSE_STATUSES,
        },
      ]}
      formFields={[
        {
          name: 'title',
          label: 'Title',
          required: true,
          half: true,
        },
        {
          name: 'level',
          label: 'Level',
          type: 'select',
          options: LEVELS,
          required: true,
          half: true,
        },
        {
          name: 'credits',
          label: 'Credits',
          type: 'number',
          half: true,
          validate: isNumber(),
        },
        {
          name: 'departmentId',
          label: 'Department',
          type: 'select',
          options: departmentOptions,
          required: true,
          half: true,
        },
        {
          name: 'academicYear',
          label: 'Academic Year',
          half: true,
          helperText: 'YYYY-YYYY',
          validate: (value) =>
            value && !/^\d{4}-\d{4}$/.test(value)
              ? 'Use YYYY-YYYY format'
              : '',
        },
        {
          name: 'teacherId',
          label: 'Teacher',
          type: 'select',
          options: teacherOptions,
          half: true,
        },
        {
          name: 'classId',
          label: 'Class',
          type: 'select',
          options: classOptions,
          half: true,
        },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          options: COURSE_STATUSES,
          half: true,
        },
        {
          name: 'description',
          label: 'Description',
        },
      ]}
      transformSubmit={(values) => ({
        ...values,
        credits:
          values.credits === ''
            ? null
            : Number(values.credits),

        teacherId:
          values.teacherId === ''
            ? null
            : Number(values.teacherId),

        classId:
          values.classId === ''
            ? null
            : Number(values.classId),

        departmentId:
          values.departmentId === ''
            ? null
            : Number(values.departmentId),

        academicYear:
          values.academicYear?.trim() || null,

        description:
          values.description?.trim() || null,
      })}
    />
  );
}