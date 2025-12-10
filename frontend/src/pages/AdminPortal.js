import React, { useState, useEffect } from 'react';
import api, { withAuth } from '../api';

const analyticsConfig = [
  { key: 'frequentClients', label: 'Frequent clients', endpoint: '/analytics/frequent-clients', dataKey: 'clients' },
  { key: 'uncommittedClients', label: 'Uncommitted clients', endpoint: '/analytics/uncommitted-clients', dataKey: 'clients' },
  { key: 'prospectiveClients', label: 'Prospective clients', endpoint: '/analytics/prospective-clients', dataKey: 'clients' },
  { key: 'largestJobs', label: 'Largest jobs', endpoint: '/analytics/largest-jobs', dataKey: 'jobs' },
  { key: 'overdueBills', label: 'Overdue bills', endpoint: '/analytics/overdue-bills', dataKey: 'bills' },
  { key: 'badClients', label: 'Bad clients', endpoint: '/analytics/bad-clients', dataKey: 'clients' },
  { key: 'goodClients', label: 'Good clients', endpoint: '/analytics/good-clients', dataKey: 'clients' }
];

const AdminPortal = () => {
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [token, setToken] = useState(() => localStorage.getItem('adminToken'));
  const [admin, setAdmin] = useState(() => {
    const stored = localStorage.getItem('adminProfile');
    return stored ? JSON.parse(stored) : null;
  });
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [quoteForm, setQuoteForm] = useState({
    quotedPrice: '',
    scheduledDate: '',
    scheduledStartTime: '09:00',
    scheduledEndTime: '11:00',
    notes: ''
  });
  const [analytics, setAnalytics] = useState({});
  const [monthFilter, setMonthFilter] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [acceptedQuotes, setAcceptedQuotes] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadRequests = async () => {
    if (!token) return;
    try {
      const { data } = await api.get('/requests/admin', withAuth(token));
      setRequests(data.requests || []);
    } catch (err) {
      setError('Unable to load service requests.');
    }
  };

  const loadAnalytics = async () => {
    if (!token) return;
    try {
      const entries = await Promise.all(
        analyticsConfig.map(async cfg => {
          const { data } = await api.get(cfg.endpoint, withAuth(token));
          return [cfg.key, data];
        })
      );
      setAnalytics(Object.fromEntries(entries));
    } catch (err) {
      setError('Analytics could not be refreshed.');
    }
  };

  const loadAcceptedQuotes = async () => {
    if (!token) return;
    try {
      const { month, year } = monthFilter;
      const { data } = await api.get(`/analytics/accepted-quotes?month=${month}&year=${year}`, withAuth(token));
      setAcceptedQuotes(data.quotes || []);
    } catch (err) {
      setError('Could not load accepted quotes.');
    }
  };

  useEffect(() => {
    loadAcceptedQuotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthFilter, token]);

  useEffect(() => {
    loadRequests();
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleLogin = async e => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/admin/login', loginData);
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminProfile', JSON.stringify(data.admin));
      setToken(data.token);
      setAdmin(data.admin);
      setLoginData({ username: '', password: '' });
      setMessage('Admin session established.');
    } catch (err) {
      setError(err.response?.data?.message || 'Admin login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminProfile');
    setToken(null);
    setAdmin(null);
    setRequests([]);
    setAnalytics({});
    setAcceptedQuotes([]);
  };

  const handleReject = async requestId => {
    const reason = window.prompt('Add a brief note about the rejection:');
    if (!reason) return;
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await api.post(`/requests/${requestId}/reject`, { reason }, withAuth(token));
      setMessage('Request rejected.');
      loadRequests();
    } catch (err) {
      setError('Could not reject request.');
    } finally {
      setLoading(false);
    }
  };

  const openQuoteForm = request => {
    setSelectedRequest(request);
    setQuoteForm({
      quotedPrice: request.proposed_budget,
      scheduledDate: request.preferred_date?.split('T')[0] || '',
      scheduledStartTime: '09:00',
      scheduledEndTime: '11:00',
      notes: ''
    });
  };

  const handleQuoteSubmit = async e => {
    e.preventDefault();
    if (!selectedRequest) return;
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await api.post(
        '/quotes',
        {
          requestId: selectedRequest.request_id,
          ...quoteForm
        },
        withAuth(token)
      );
      setMessage('Quote shared with client.');
      setSelectedRequest(null);
      loadRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create quote.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="portal-card">
      <header className="portal-header">
        <h2>Admin Console</h2>
        {admin && (
          <div className="session-badge">
            <span>{admin.fullName || admin.username}</span>
            <button type="button" onClick={handleLogout} className="text-btn">
              Sign out
            </button>
          </div>
        )}
      </header>

      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert danger">{error}</div>}

      {!admin ? (
        <form onSubmit={handleLogin} className="panel">
          <h3>Admin sign in</h3>
          <label>
            Username
            <input
              value={loginData.username}
              onChange={e => setLoginData({ ...loginData, username: e.target.value })}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={loginData.password}
              onChange={e => setLoginData({ ...loginData, password: e.target.value })}
              required
            />
          </label>
          <button type="submit" className="primary-btn" disabled={loading}>
            Access console
          </button>
        </form>
      ) : (
        <>
          <div className="panel">
            <h3>Incoming requests</h3>
            {requests.length === 0 ? (
              <p className="muted">No requests in the queue.</p>
            ) : (
              <div className="table">
                <div className="table-row table-header">
                  <span>Client</span>
                  <span>Address</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>
                {requests.map(req => (
                  <div className="table-row" key={req.request_id}>
                    <div>
                      <strong>{req.first_name} {req.last_name}</strong>
                      <small>{req.email}</small>
                    </div>
                    <span>{req.service_address}</span>
                    <span className="chip neutral">{req.status}</span>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="text-btn"
                        onClick={() => openQuoteForm(req)}
                      >
                        Prepare quote
                      </button>
                      <button
                        type="button"
                        className="text-btn danger"
                        onClick={() => handleReject(req.request_id)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedRequest && (
            <form onSubmit={handleQuoteSubmit} className="panel">
              <h3>Quote for {selectedRequest.first_name} {selectedRequest.last_name}</h3>
              <div className="grid-2 compact">
                <label>
                  Quoted price
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={quoteForm.quotedPrice}
                    onChange={e => setQuoteForm({ ...quoteForm, quotedPrice: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Scheduled date
                  <input
                    type="date"
                    value={quoteForm.scheduledDate}
                    onChange={e => setQuoteForm({ ...quoteForm, scheduledDate: e.target.value })}
                    required
                  />
                </label>
              </div>
              <div className="grid-2 compact">
                <label>
                  Start time
                  <input
                    type="time"
                    value={quoteForm.scheduledStartTime}
                    onChange={e => setQuoteForm({ ...quoteForm, scheduledStartTime: e.target.value })}
                    required
                  />
                </label>
                <label>
                  End time
                  <input
                    type="time"
                    value={quoteForm.scheduledEndTime}
                    onChange={e => setQuoteForm({ ...quoteForm, scheduledEndTime: e.target.value })}
                    required
                  />
                </label>
              </div>
              <label>
                Notes
                <textarea
                  rows={2}
                  value={quoteForm.notes}
                  onChange={e => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                />
              </label>
              <div className="actions">
                <button type="button" className="text-btn" onClick={() => setSelectedRequest(null)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={loading}>
                  Send quote
                </button>
              </div>
            </form>
          )}

          <div className="panel">
            <div className="panel-heading">
              <h3>Accepted quotes</h3>
              <div className="grid-2 compact gap">
                <label>
                  Month
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={monthFilter.month}
                    onChange={e => setMonthFilter({ ...monthFilter, month: Number(e.target.value) })}
                  />
                </label>
                <label>
                  Year
                  <input
                    type="number"
                    value={monthFilter.year}
                    onChange={e => setMonthFilter({ ...monthFilter, year: Number(e.target.value) })}
                  />
                </label>
              </div>
            </div>
            {acceptedQuotes.length === 0 ? (
              <p className="muted">No accepted quotes for the selected month.</p>
            ) : (
              <ul className="list">
                {acceptedQuotes.map(quote => (
                  <li key={quote.quote_id}>
                    Quote #{quote.quote_id} · {quote.first_name} {quote.last_name} ·
                    ${Number(quote.quoted_price).toFixed(2)}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="panel">
            <h3>Insights</h3>
            <div className="insights-grid">
              {analyticsConfig.map(cfg => (
                <article key={cfg.key} className="insight-card">
                  <h4>{cfg.label}</h4>
                  {(() => {
                    const rows = analytics[cfg.key]?.[cfg.dataKey] || [];
                    if (rows.length === 0) {
                      return <p className="muted small">No data yet.</p>;
                    }
                    const preview = rows.slice(0, 3);
                    return (
                      <>
                        <p className="muted small">{rows.length} result(s)</p>
                        <ul className="list compact">
                          {preview.map((row, index) => (
                            <li key={index}>{JSON.stringify(row)}</li>
                          ))}
                        </ul>
                      </>
                    );
                  })()}
                </article>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default AdminPortal;
