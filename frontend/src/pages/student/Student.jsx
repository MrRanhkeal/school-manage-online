import React, { useState, useCallback, useEffect } from 'react';
import { Chip, IconButton, Tooltip, InputAdornment, Box, Stack, TextField, MenuItem, Button, Alert, CircularProgress, Typography } from '@mui/material';
import AddCardIcon from '@mui/icons-material/AddCard';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import CrudManager from '../../components/common/CrudManager';
import Modal from '../../components/common/Modal';
import useAuth from '../../hooks/useAuth';
import useOptions from '../../hooks/useOptions';
import api, { unwrap } from '../../services/api';
import { ENDPOINTS } from '../../services/endpoints';
import { LEVELS, GENDERS, STUDENT_STATUSES, ROLES } from '../../utils/constants';
import { fullName, capitalize, formatDate, getApiError } from '../../utils/helpers';
import { isDate, isNumber } from '../../utils/validators';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const STATUS_COLORS = {
  enrolled: 'success',
  graduated: 'info',
  withdrawn: 'default',
  suspended: 'error',
};

const EMPTY_PAYMENT_FORM = { studentId: '', amount: '', currency: 'USD', description: '' };

export default function Student() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const classOptions = useOptions(
    ENDPOINTS.classes.list,
    (c) => `${c.name} (${c.academicYear})`
  );
  // The payments route is admin/staff only (see App.jsx).
  const canSeePayments = [ROLES.ADMIN, ROLES.STAFF].includes(user?.role);
  const [showPassword, setShowPassword] = useState(false);

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState(EMPTY_PAYMENT_FORM);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [paymentFormError, setPaymentFormError] = useState('');
  
  // Active QR dialog (freshly created payment)
  const [activePayment, setActivePayment] = useState(null);
  const [pollError, setPollError] = useState('');
  const [now, setNow] = useState(Date.now());
  const POLL_MS = 4000;

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const openPaymentModal = (studentId) => {
    setPaymentForm({ ...EMPTY_PAYMENT_FORM, studentId: String(studentId) });
    setPaymentFormError('');
    setActivePayment(null);
    setPollError('');
    setPaymentModalOpen(true);
  };

  const handleCreatePayment = async () => {
    const amount = Number(paymentForm.amount);
    if (!paymentForm.studentId) {
      setPaymentFormError('Select the student this payment is for');
      return;
    }
    if (!amount || amount <= 0) {
      setPaymentFormError('Amount must be a positive number');
      return;
    }
    if (paymentForm.currency === 'KHR' && !Number.isInteger(amount)) {
      setPaymentFormError('KHR amounts must be whole numbers');
      return;
    }
    setCreatingPayment(true);
    setPaymentFormError('');
    try {
      const res = await api.post(ENDPOINTS.payments.create, {
        studentId: Number(paymentForm.studentId),
        amount,
        currency: paymentForm.currency,
        description: paymentForm.description || undefined,
      });
      setActivePayment(unwrap(res));
      setPollError('');
    } catch (err) {
      setPaymentFormError(getApiError(err));
    } finally {
      setCreatingPayment(false);
    }
  };

  const checkStatus = useCallback(async (md5) => {
    try {
      const res = await api.get(ENDPOINTS.payments.check(md5));
      const updated = unwrap(res);
      setPollError('');
      setActivePayment((prev) => (prev && prev.md5 === updated.md5 ? updated : prev));
      return updated;
    } catch (err) {
      setPollError(getApiError(err));
      return null;
    }
  }, []);

  // While the QR dialog shows a pending payment, poll Bakong for settlement.
  useEffect(() => {
    if (!activePayment || activePayment.status !== 'pending') return undefined;
    const poll = setInterval(() => checkStatus(activePayment.md5), POLL_MS);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [activePayment, checkStatus]);

  const handleForceComplete = async () => {
    if (!activePayment) return;
    try {
      const res = await api.post(ENDPOINTS.payments.forceComplete(activePayment.md5));
      setActivePayment(unwrap(res));
      setPollError('');
    } catch (err) {
      setPollError(getApiError(err));
    }
  };

  const secondsLeft = activePayment?.expire ? Math.max(0, Math.round((Number(activePayment.expire) - now) / 1000)) : null;

  return (
    <>
    <CrudManager
      title={t('nav.students')}
      endpoint={ENDPOINTS.students}
      writeRoles={[ROLES.ADMIN, ROLES.STAFF]}
      deleteRoles={[ROLES.ADMIN]}
      columns={[
        {
          id: 'index', label: '#', render: (item, data, index) => index + 1,
          // render: (_, __, index) => index + 1,
        },
        { id: 'studentCode', label: 'Code' },
        { id: 'name', label: 'Name', render: (r) => fullName(r), minWidth: 160 },
        { id: 'level', label: 'Level', render: (r) => capitalize(r.level) },
        { id: 'class', label: 'Class', render: (r) => r.class?.name || '—' },
        { id: 'gradeYear', label: 'Grade' },
        { id: 'enrollmentYear', label: 'Enrolled' },
        {
          id: 'dateOfBirth',
          label: 'Date of birth',
          render: (r) => formatDate(r.dateOfBirth),
        },
        {
          id: 'status',
          label: 'Status',
          render: (r) => (
            <Chip
              size="small"
              label={capitalize(r.status || 'enrolled')}
              color={STATUS_COLORS[r.status] || 'default'}
            />
          ),
        },
        ...(canSeePayments
          ? [
            {
              id: 'payments',
              label: 'Payments',
              align: 'center',
              render: (r) => (
                <Tooltip title="Create payment for this student">
                  <IconButton
                    size="small"
                    onClick={() => openPaymentModal(r.id)}
                  >
                    <AddCardIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ),
            },
          ]
          : []),
      ]}
      filters={[
        { name: 'level', label: 'Level', options: LEVELS },
        { name: 'classId', label: 'Class', options: classOptions },
        { name: 'status', label: 'Status', options: STUDENT_STATUSES },
      ]}
      formFields={[
        // { name: 'studentCode', label: 'Student code', required: true, half: true },
        { name: 'enrollmentYear', label: 'Enrollment year', type: 'number', required: true, half: true, validate: isNumber() },
        { name: 'firstName', label: 'First name', required: true, half: true },
        { name: 'lastName', label: 'Last name', required: true, half: true },
        { name: 'level', label: 'Level', type: 'select', options: LEVELS, required: true, half: true },
        { name: 'gradeYear', label: 'Grade year', type: 'number', half: true, validate: isNumber() },
        { name: 'dateOfBirth', label: 'Date of birth', type: 'date', half: true, validate: isDate() },
        { name: 'gender', label: 'Gender', type: 'select', options: GENDERS, half: true },
        { name: 'classId', label: 'Class', type: 'select', options: classOptions, half: true },
        { name: 'email', label: 'Email', type: 'email', half: true },
        {
          name: 'password',
          label: 'Student password',
          type: showPassword ? 'text' : 'password',
          half: true,
          createOnly: true,
          validate: (v, all) => {
            if (v && v.length < 8) return 'At least 8 characters';
            if (v && !all.email) return 'Email is required to create the account';
            return '';
          },
          InputProps: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword((p) => !p)}
                  onMouseDown={(e) => e.preventDefault()}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          },
        },
        {
          name: 'guardianName', label: 'Guardian name', half: true
        },
        { name: 'guardianPhone', label: 'Guardian phone', half: true },
      ]}
    />

    {/* Payment creation modal */}
    <Modal
      open={paymentModalOpen}
      onClose={() => setPaymentModalOpen(false)}
      title={activePayment ? "Scan with Bakong" : "New Bakong payment"}
      actions={
        activePayment ? (
          <>
            {activePayment.status === 'pending' && (
              <Button color="warning" onClick={handleForceComplete}>
                Force complete (test)
              </Button>
            )}
            <Button variant="contained" onClick={() => setPaymentModalOpen(false)}>
              Close
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleCreatePayment} disabled={creatingPayment}>
              {creatingPayment ? <CircularProgress size={22} /> : 'Generate KHQR'}
            </Button>
          </>
        )
      }
    >
      {activePayment ? (
        <Stack spacing={2} alignItems="center" sx={{ py: 1 }}>
          <Typography variant="h6">
            {Number(activePayment.amount).toFixed(2)} {activePayment.currency}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Student ID: {activePayment.studentId}
          </Typography>

          <Box
            sx={{
              p: 2,
              bgcolor: '#fff',
              borderRadius: 2,
              opacity: activePayment.status === 'expired' ? 0.35 : 1,
            }}
          >
            <QRCodeSVG value={activePayment.qr} size={220} />
          </Box>

          {activePayment.status === 'pending' && (
            <Stack spacing={1} alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  Waiting for payment…
                  {secondsLeft !== null &&
                    ` expires in ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`}
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Scan the QR with any Bakong-enabled banking app.
              </Typography>
            </Stack>
          )}
          {activePayment.status === 'completed' && (
            <Alert severity="success" sx={{ width: '100%' }}>
              Payment received{activePayment.paidAt ? ` at ${formatDate(Number(activePayment.paidAt))}` : ''}.
            </Alert>
          )}
          {activePayment.status === 'expired' && (
            <Alert severity="error" sx={{ width: '100%' }}>
              This QR has expired — create a new payment.
            </Alert>
          )}
          {pollError && (
            <Alert severity="warning" sx={{ width: '100%' }}>
              Status check failed: {pollError}
            </Alert>
          )}
        </Stack>
      ) : (
        <Stack spacing={2} sx={{ mt: 1 }}>
          {paymentFormError && <Alert severity="error">{paymentFormError}</Alert>}
          <TextField
            label="Student"
            disabled
            fullWidth
            value={paymentForm.studentId ? `${paymentForm.studentId}` : ''}
            helperText="Payment will be created for the selected student"
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="Amount"
              type="number"
              fullWidth
              autoFocus
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))}
            />
            <TextField
              label="Currency"
              select
              sx={{ minWidth: 120 }}
              value={paymentForm.currency}
              onChange={(e) => setPaymentForm((f) => ({ ...f, currency: e.target.value }))}
            >
              <MenuItem value="USD">USD</MenuItem>
              <MenuItem value="KHR">KHR</MenuItem>
            </TextField>
          </Stack>
          <TextField
            label="Description"
            fullWidth
            multiline
            minRows={2}
            value={paymentForm.description}
            onChange={(e) => setPaymentForm((f) => ({ ...f, description: e.target.value }))}
          />
        </Stack>
      )}
    </Modal>
    </>
  );
}
