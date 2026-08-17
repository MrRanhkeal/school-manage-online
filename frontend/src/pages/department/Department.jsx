import React from 'react';
import { useTranslation } from 'react-i18next';
import CrudManager from '../../components/common/CrudManager';
import { ENDPOINTS } from '../../services/endpoints';
import { ROLES } from '../../utils/constants';

export default function Department() {
    const { t } = useTranslation();

    return (
        <CrudManager
            title={t('nav.departments')}
            endpoint={ENDPOINTS.departments}
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
                    id: 'name',
                    label: t('name') || 'Name',
                    minWidth: 200,
                },
                {
                    id: 'code',
                    label: t('code') || 'Code',
                    minWidth: 120,
                },
                {
                    id: 'locations',
                    label: t('locations') || 'Locations',
                    minWidth: 250,
                    render: (row) => row.locations || '—',
                },
                {
                    id: 'teacherCount',
                    label: t('teachers') || 'Teachers',
                    align: 'right',
                    minWidth: 100,
                    render: (row) => row.teacherCount ?? 0,
                },
                {
                    id: 'staffCount',
                    label: t('staff') || 'Staff',
                    align: 'right',
                    minWidth: 100,
                    render: (row) => row.staffCount ?? 0,
                },
                {
                    id: 'courseCount',
                    label: t('courses') || 'Courses',
                    align: 'right',
                    minWidth: 100,
                    render: (row) => row.courseCount ?? 0,
                },
                {
                    id: 'createdAt',
                    label: 'Created',
                    minWidth: 180,
                    render: (row) =>
                        row.createdAt
                            ? new Date(row.createdAt).toLocaleDateString()
                            : '—',
                },
            ]}
            formFields={[
                {
                    name: 'name',
                    label: 'Department Name',
                    type: 'text',
                    required: true,
                    half: true,
                },
                {
                    name: 'code',
                    label: 'Department Code',
                    type: 'text',
                    required: true,
                    half: true,
                    helperText: 'Must be unique',
                },
                {
                    name: 'locations',
                    label: 'Locations',
                    type: 'text',
                    multiline: true,
                    rows: 3,
                },
            ]}
            transformSubmit={(values) => ({
                name: values.name?.trim(),
                code: values.code?.trim().toUpperCase(),
                locations: values.locations?.trim() || null,
            })}
        />
    );
}