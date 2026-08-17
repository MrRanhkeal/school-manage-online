import React, { useState, useEffect, useCallback } from 'react';
import { Grid, Typography, Paper, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import useAuth from '../../hooks/useAuth';
import api, { unwrap } from '../../services/api';
import DashboardStats from '../../features/dashboard/DashboardStats';
import DashboardCharts from '../../features/dashboard/DashboardCharts';
import MessageItem from '../../features/messages/MessageItem';
import Calendar from './Calendar';
import Temperature from './temperature';
import Maps from './maps';


/** Dashboard landing page. */
export default function Home() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/notifications/recent');
      setMessages(unwrap(res) || []);
    } catch (err) {
      setError('Failed to load messages');
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {t('dashboard.welcome', { name: user?.fullName || '' })}
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <DashboardStats />
        </Grid>

        <Grid item xs={12}>
          <DashboardCharts />
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
          <Calendar />
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
          <Grid container spacing={2} direction="column">
            <Grid item>
              <Temperature />
            </Grid>
            <Grid item>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  {t('dashboard.messages')}
                </Typography>
                {loading ? (
                  <Typography variant="body2" color="text.secondary">
                    Loading messages...
                  </Typography>
                ) : error ? (
                  <Typography variant="body2" color="error">
                    {error}
                  </Typography>
                ) : messages.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No recent messages
                  </Typography>
                ) : (
                  messages.map((m, i) => (
                    <MessageItem key={i} message={m} />
                  ))
                )}
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Maps />
        </Grid>
      </Grid>
    </Box>
  );
}
