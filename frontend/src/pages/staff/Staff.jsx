import React from 'react';
import { useTranslation } from 'react-i18next';
import CrudManager from '../../components/common/CrudManager';
import useOptions from '../../hooks/useOptions';
import { ENDPOINTS } from '../../services/endpoints';
import { ROLES } from '../../utils/constants';
import { fullName } from '../../utils/helpers';

export default function Staff() {
    const { t } = useTranslation();

    const departmentOptions = useOptions(
        ENDPOINTS.departments.list,
        (dept) => dept.name
    );

    return (
        <CrudManager
            title={t('nav.staff')}
            endpoint={ENDPOINTS.staff}
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
                    label: 'Name',
                    minWidth: 160,
                    render: (r) => fullName(r),
                },
                {
                    id: 'email',
                    label: 'Email',
                    minWidth: 200,
                },
                {
                    id: 'department',
                    label: 'Department',
                    minWidth: 150,
                    render: (r) =>
                        r.department
                            ? r.department.name
                            : '—',
                },
            ]}
            filters={[
                {
                    name: 'departmentId',
                    label: 'Department',
                    options: departmentOptions,
                },
            ]}
            formFields={[
                {
                    name: 'firstName',
                    label: 'First Name',
                    required: true,
                    half: true,
                },
                {
                    name: 'lastName',
                    label: 'Last Name',
                    required: true,
                    half: true,
                },
                {
                    name: 'email',
                    label: 'Email',
                    required: true,
                    half: true,
                    validate: (v) =>
                        v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
                            ? 'Enter a valid email'
                            : '',
                },
                {
                    name: 'departmentId',
                    label: 'Department',
                    type: 'select',
                    options: departmentOptions,
                    half: true,
                    resolve: (row) => row.departmentId ?? row.department?.id ?? '',
                },
            ]}
        />
    );
}