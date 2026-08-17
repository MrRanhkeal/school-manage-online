import React from 'react';
import { Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CrudManager from '../../components/common/CrudManager';
import useOptions from '../../hooks/useOptions';
import { ENDPOINTS } from '../../services/endpoints';
import { LEVELS, CLASS_STATUSES, ROLES } from '../../utils/constants';
import { capitalize, fullName } from '../../utils/helpers';
import { isNumber } from '../../utils/validators';

export default function Classroom() {
  const { t } = useTranslation();

  const teacherOptions = useOptions(
    ENDPOINTS.teachers.list,
    (tch) =>
      tch.teacherCode
        ? `${fullName(tch)} (${tch.teacherCode})`
        : fullName(tch)
  );

  return (
    <CrudManager
      title={t('nav.classes')}
      endpoint={ENDPOINTS.classes}
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
          id: 'name',
          label: 'Name',
          minWidth: 120,
        },
        {
          id: 'level',
          label: 'Level',
          render: (r) => capitalize(r.level),
        },
        {
          id: 'gradeYear',
          label: 'Grade',
        },
        {
          id: 'academicYear',
          label: 'Academic Year',
        },
        {
          id: 'homeroomTeacher',
          label: 'Homeroom Teacher',
          minWidth: 180,
          render: (r) =>
            r.homeroomTeacher
              ? fullName(r.homeroomTeacher)
              : '—',
        },
        {
          id: 'roomNumber',
          label: 'Room',
        },
        {
          id: 'capacity',
          label: 'Capacity',
          align: 'right',
        },
        {
          id: 'status',
          label: 'Status',
          render: (r) => (
            <Chip
              size="small"
              label={capitalize(r.status || 'active')}
              color={
                r.status === 'archived'
                  ? 'default'
                  : r.status === 'inactive'
                    ? 'warning'
                    : 'success'
              }
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
          name: 'status',
          label: 'Status',
          options: CLASS_STATUSES,
        },
      ]}
      formFields={[
        {
          name: 'name',
          label: 'Class Name',
          required: true,
          half: true,
        },
        {
          name: 'academicYear',
          label: 'Academic Year',
          required: true,
          half: true,
          helperText: 'e.g. 2025-2026',
          validate: (v) =>
            v && !/^\d{4}-\d{4}$/.test(v)
              ? 'Use the YYYY-YYYY format'
              : '',
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
          name: 'gradeYear',
          label: 'Grade Year',
          type: 'number',
          half: true,
          validate: isNumber(),
        },
        {
          name: 'TeacherId',
          label: 'Homeroom Teacher',
          type: 'select',
          options: teacherOptions,
          half: true,
          resolve: (row) => row.TeacherId ?? row.homeroomTeacher?.id ?? '',
        },
        {
          name: 'capacity',
          label: 'Capacity',
          type: 'number',
          half: true,
          validate: isNumber(),
        },
        {
          name: 'roomNumber',
          label: 'Room Number',
          half: true,
        },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          options: CLASS_STATUSES,
          half: true,
        },
      ]}
    />
  );
}