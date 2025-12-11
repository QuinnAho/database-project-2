
import React, { useEffect, useMemo, useState } from 'react';
import PageLayout from '../PageLayout';
import api, { getErrorMessage } from '../api';

const now = new Date();
const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

const AdminPortal = () => {
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [authState, setAuthState] = useState(() => ({
    role: localStorage.getItem('role'),
    token: localStorage.getItem('token'),
    name: localStorage.getItem('adminName') || ''
  }));
  const [status, setStatus] = useState({ type: '', message: '' });
  const [requests, setRequests] = useState([]);
  const [requestDetails, setRequestDetails] = useState({});
  const [quotesByRequest, setQuotesByRequest] = useState({});
  const [quoteForms, setQuoteForms] = useState({});
  const [rejectReasons, setRejectReasons] = useState({});
  const [negotiationForms, setNegotiationForms] = useState({});
  const [orders, setOrders] = useState([]);
  const [completionForms, setCompletionForms] = useState({});
  const [bills, setBills] = useState([]);
  const [billRevisionForms, setBillRevisionForms] = useState({});
  const [analytics, setAnalytics] = useState({
    frequentClients: [],
    uncommittedClients: [],
    prospectiveClients: [],
    largestJobs: [],
    overdueBills: [],
    badClients: [],
    goodClients: []
  });
  const [quoteMonth, setQuoteMonth] = useState(defaultMonth);
  const [acceptedQuotes, setAcceptedQuotes] = useState([]);

  const isAuthenticated = authState.role === 'admin' && Boolean(authState.token);
  const authHeaders = useMemo(() => {
    if (!authState.token) return undefined;
    return { Authorization: `Bearer ${authState.token}` };
  }, [authState.token]);
  const assetBaseUrl = useMemo(() => (api.defaults.baseURL || '').replace(/\/$/, ''), []);

  const resolvePhotoUrl = url => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `${assetBaseUrl}${url}`;
  };

  const handleLoginChange = event => {
    const { name, value } = event.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async event => {
    event.preventDefault();
    setStatus({ type: '', message: '' });

    try {
      const response = await api.post('/api/auth/admin/login', loginForm);
      const { token, admin } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', 'admin');
      localStorage.setItem('adminName', admin.fullName || admin.username);
      setAuthState({ role: 'admin', token, name: admin.fullName || admin.username });
      setLoginForm({ username: '', password: '' });
      setStatus({ type: 'success', message: 'Logged in as Anna. Dashboard data loaded.' });
      await fetchAllAdminData(token);
    } catch (error) {
      setStatus({ type: 'error', message: getErrorMessage(error, 'Login failed.') });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('adminName');
    setAuthState({ role: null, token: '', name: '' });
    setRequests([]);
    setOrders([]);
    setBills([]);
    setAnalytics({
      frequentClients: [],
      uncommittedClients: [],
      prospectiveClients: [],
      largestJobs: [],
      overdueBills: [],
      badClients: [],
      goodClients: []
    });
    setAcceptedQuotes([]);
  };

  const fetchRequests = async (tokenOverride) => {
    if (!authHeaders && !tokenOverride) return;
    const headers = tokenOverride ? { Authorization: `Bearer ${tokenOverride}` } : authHeaders;
    const response = await api.get('/api/requests/admin', { headers });
    setRequests(response.data.requests || []);
  };

  const fetchOrders = async (tokenOverride) => {
    if (!authHeaders && !tokenOverride) return;
    const headers = tokenOverride ? { Authorization: `Bearer ${tokenOverride}` } : authHeaders;
    const response = await api.get('/api/orders/admin', { headers });
    setOrders(response.data.orders || []);
  };

  const fetchBills = async (tokenOverride) => {
    if (!authHeaders && !tokenOverride) return;
    const headers = tokenOverride ? { Authorization: `Bearer ${tokenOverride}` } : authHeaders;
    const response = await api.get('/api/bills/admin', { headers });
    setBills(response.data.bills || []);
  };

  const loadAnalytics = async (tokenOverride) => {
    if (!authHeaders && !tokenOverride) return;
    const headers = tokenOverride ? { Authorization: `Bearer ${tokenOverride}` } : authHeaders;
    const endpoints = [
      { key: 'frequentClients', url: '/api/analytics/frequent-clients', prop: 'clients' },
      { key: 'uncommittedClients', url: '/api/analytics/uncommitted-clients', prop: 'clients' },
      { key: 'prospectiveClients', url: '/api/analytics/prospective-clients', prop: 'clients' },
      { key: 'largestJobs', url: '/api/analytics/largest-jobs', prop: 'jobs' },
      { key: 'overdueBills', url: '/api/analytics/overdue-bills', prop: 'bills' },
      { key: 'badClients', url: '/api/analytics/bad-clients', prop: 'clients' },
      { key: 'goodClients', url: '/api/analytics/good-clients', prop: 'clients' }
    ];

    const results = await Promise.all(endpoints.map(endpoint => api.get(endpoint.url, { headers })));
    const nextAnalytics = {};
    results.forEach((response, index) => {
      const key = endpoints[index].key;
      const prop = endpoints[index].prop;
      nextAnalytics[key] = response.data[prop] || [];
    });
    setAnalytics(nextAnalytics);
  };

  const loadAcceptedQuotes = async (tokenOverride) => {
    if (!authHeaders && !tokenOverride) return;
    const headers = tokenOverride ? { Authorization: `Bearer ${tokenOverride}` } : authHeaders;
    const [year, month] = quoteMonth.split('-').map(Number);
    if (!year || !month) return;
    const response = await api.get(`/api/analytics/accepted-quotes?month=${month}&year=${year}`, { headers });
    setAcceptedQuotes(response.data.quotes || []);
  };

  const fetchAllAdminData = async (tokenOverride) => {
    await Promise.all([fetchRequests(tokenOverride), fetchOrders(tokenOverride), fetchBills(tokenOverride), loadAnalytics(tokenOverride), loadAcceptedQuotes(tokenOverride)]);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllAdminData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAcceptedQuotes();
    }
  }, [quoteMonth]);

  const handleRejectRequest = async requestId => {
    const reason = rejectReasons[requestId];
    if (!reason) {
      setStatus({ type: 'error', message: 'Please include a reason before rejecting a request.' });
      return;
    }
    try {
      await api.post(`/api/requests/${requestId}/reject`, { reason }, { headers: authHeaders });
      setStatus({ type: 'success', message: 'Request rejected.' });
      fetchRequests();
    } catch (error) {
      setStatus({ type: 'error', message: getErrorMessage(error, 'Unable to reject the request.') });
    }
  };

  const updateQuoteForm = (requestId, field, value) => {
    setQuoteForms(prev => ({
      ...prev,
      [requestId]: {
        ...prev[requestId],
        [field]: value
      }
    }));
  };

  const handleCreateQuote = async requestId => {
    const form = quoteForms[requestId];
    if (!form || !form.quotedPrice || !form.scheduledDate || !form.scheduledStartTime || !form.scheduledEndTime) {
      setStatus({ type: 'error', message: 'Please fill out price and schedule before sending a quote.' });
      return;
    }
    try {
      await api.post(
        '/api/quotes',
        {
          requestId,
          quotedPrice: Number(form.quotedPrice),
          scheduledDate: form.scheduledDate,
          scheduledStartTime: form.scheduledStartTime,
          scheduledEndTime: form.scheduledEndTime,
          notes: form.notes || undefined
        },
        { headers: authHeaders }
      );
      setStatus({ type: 'success', message: 'Quote sent to the client.' });
      updateQuoteForm(requestId, 'quotedPrice', '');
      fetchRequests();
    } catch (error) {
      setStatus({ type: 'error', message: getErrorMessage(error, 'Unable to create the quote.') });
    }
  };

  const handleViewQuotes = async requestId => {
    try {
      const response = await api.get(`/api/quotes/request/${requestId}`, { headers: authHeaders });
      setQuotesByRequest(prev => ({ ...prev, [requestId]: response.data.quotes || [] }));
    } catch (error) {
      setStatus({ type: 'error', message: getErrorMessage(error, 'Unable to load the quotes for that request.') });
    }
  };

  const handleLoadRequestDetails = async requestId => {
    try {
      const response = await api.get(`/api/requests/${requestId}`, { headers: authHeaders });
      setRequestDetails(prev => ({ ...prev, [requestId]: response.data }));
    } catch (error) {
      setStatus({ type: 'error', message: getErrorMessage(error, 'Unable to load request details.') });
    }
  };

  const updateNegotiationForm = (quoteId, field, value) => {
    setNegotiationForms(prev => ({
      ...prev,
      [quoteId]: {
        ...prev[quoteId],
        [field]: value
      }
    }));
  };

  const handleNegotiateQuote = async (event, quoteId) => {
    event.preventDefault();
    const form = negotiationForms[quoteId];
    if (!form || !form.message) {
      setStatus({ type: 'error', message: 'Please type a message before responding to a quote.' });
      return;
    }
    try {
      await api.post(
        `/api/quotes/${quoteId}/negotiate`,
        {
          message: form.message,
          proposedPrice: form.proposedPrice || undefined,
          proposedDate: form.proposedDate || undefined,
          proposedTime: form.proposedTime || undefined
        },
        { headers: authHeaders }
      );
      setNegotiationForms(prev => ({ ...prev, [quoteId]: { message: '', proposedPrice: '', proposedDate: '', proposedTime: '' } }));
      setStatus({ type: 'success', message: 'Response recorded.' });
      fetchRequests();
    } catch (error) {
      setStatus({ type: 'error', message: getErrorMessage(error, 'Unable to add the negotiation response.') });
    }
  };

  const updateCompletionForm = (orderId, field, value) => {
    setCompletionForms(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [field]: value
      }
    }));
  };

  const handleCompleteOrder = async orderId => {
    const form = completionForms[orderId];
    if (!form || !form.amount || !form.dueDate) {
      setStatus({ type: 'error', message: 'Start by entering the bill amount and due date.' });
      return;
    }
    try {
      await api.post(
        `/api/orders/${orderId}/complete`,
        {
          amount: Number(form.amount),
          discount: form.discount ? Number(form.discount) : 0,
          dueDate: form.dueDate,
          notes: form.notes || undefined
        },
        { headers: authHeaders }
      );
      setStatus({ type: 'success', message: 'Order updated and bill generated.' });
      fetchOrders();
      fetchBills();
    } catch (error) {
      setStatus({ type: 'error', message: getErrorMessage(error, 'Unable to mark the order as completed.') });
    }
  };

  const updateBillRevisionForm = (billId, field, value) => {
    setBillRevisionForms(prev => ({
      ...prev,
      [billId]: {
        ...prev[billId],
        [field]: value
      }
    }));
  };

  const handleReviseBill = async billId => {
    const form = billRevisionForms[billId];
    if (!form) {
      setStatus({ type: 'error', message: 'Enter at least one update before saving.' });
      return;
    }
    try {
      await api.post(
        `/api/bills/${billId}/revise`,
        {
          amount: form.amount ? Number(form.amount) : undefined,
          discount: form.discount ? Number(form.discount) : undefined,
          status: form.status || undefined,
          message: form.message || undefined,
          proposedAmount: form.proposedAmount ? Number(form.proposedAmount) : undefined
        },
        { headers: authHeaders }
      );
      setStatus({ type: 'success', message: 'Bill updated.' });
      fetchBills();
    } catch (error) {
      setStatus({ type: 'error', message: getErrorMessage(error, 'Unable to update the bill right now.') });
    }
  };

  return (
    <PageLayout
      title="Anna's dashboard"
      subtitle="Review requests, send quotes, monitor orders, and run analytics."
      actionSlot={
        isAuthenticated ? (
          <button type="button" className="btn btn-secondary" onClick={handleLogout}>
            Log out
          </button>
        ) : null
      }
    >
      {!isAuthenticated ? (
        <section className="form-card">
          <h2 className="section-heading">Admin sign in</h2>
          <p className="section-subtext">Use the admin credentials seeded in the database.</p>
          {status.message && <div className={`status-banner ${status.type}`}>{status.message}</div>}
          <form onSubmit={handleLogin} className="stacked-form">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={loginForm.username}
              onChange={handleLoginChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={handleLoginChange}
              required
            />
            <button type="submit" className="btn btn-primary">
              Sign in
            </button>
          </form>
        </section>
      ) : (
        <>
          {status.message && <div className={`status-banner ${status.type}`} style={{ marginBottom: 20 }}>{status.message}</div>}
          <section className="glass-card" style={{ marginBottom: 28 }}>
            <h2 className="section-heading">Incoming service requests</h2>
            <div className="stacked-list">
              {requests.map(request => {
                const form = quoteForms[request.request_id] || {};
                const detail = requestDetails[request.request_id];
                return (
                  <article key={request.request_id} className="request-card">
                    <header>
                      <div>
                        <h3>Request #{request.request_id}</h3>
                        <p className="section-subtext">
                          {request.cleaning_type} • {request.number_of_rooms} rooms • {request.service_address}
                        </p>
                      </div>
                      <span className={`status-pill status-${request.status}`}>{request.status}</span>
                    </header>
                    <p className="section-subtext">
                      Preferred {request.preferred_date} at {request.preferred_time}. Proposed ${request.proposed_budget}.
                    </p>
                    <p className="section-subtext">Client: {request.first_name} {request.last_name} ({request.email})</p>
                    {request.special_notes && <p className="section-subtext">Notes from client: {request.special_notes}</p>}
                    {request.rejection_reason && <p className="section-subtext">Rejection reason: {request.rejection_reason}</p>}
                    <div className="request-actions">
                      <button type="button" className="btn btn-secondary" onClick={() => handleViewQuotes(request.request_id)}>
                        View quotes
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={() => handleLoadRequestDetails(request.request_id)}>
                        Load photos
                      </button>
                    </div>
                    {detail?.photos?.length > 0 && (
                      <div className="photo-grid">
                        {detail.photos.map(photo => (
                          <img key={photo.photoId} src={resolvePhotoUrl(photo.url)} alt="Request" loading="lazy" />
                        ))}
                      </div>
                    )}
                    <div className="grid-two">
                      <div className="stacked-form">
                        <h4>Send quote</h4>
                        <input
                          type="number"
                          placeholder="Quoted price"
                          value={form.quotedPrice || ''}
                          onChange={event => updateQuoteForm(request.request_id, 'quotedPrice', event.target.value)}
                        />
                        <input
                          type="date"
                          value={form.scheduledDate || ''}
                          onChange={event => updateQuoteForm(request.request_id, 'scheduledDate', event.target.value)}
                        />
                        <input
                          type="time"
                          value={form.scheduledStartTime || ''}
                          onChange={event => updateQuoteForm(request.request_id, 'scheduledStartTime', event.target.value)}
                        />
                        <input
                          type="time"
                          value={form.scheduledEndTime || ''}
                          onChange={event => updateQuoteForm(request.request_id, 'scheduledEndTime', event.target.value)}
                        />
                        <textarea
                          placeholder="Optional note"
                          value={form.notes || ''}
                          onChange={event => updateQuoteForm(request.request_id, 'notes', event.target.value)}
                        />
                        <button type="button" className="btn btn-primary" onClick={() => handleCreateQuote(request.request_id)}>
                          Send quote
                        </button>
                      </div>
                      <div className="stacked-form">
                        <h4>Reject request</h4>
                        <textarea
                          placeholder="Reason"
                          value={rejectReasons[request.request_id] || ''}
                          onChange={event =>
                            setRejectReasons(prev => ({ ...prev, [request.request_id]: event.target.value }))
                          }
                        />
                        <button type="button" className="btn btn-secondary" onClick={() => handleRejectRequest(request.request_id)}>
                          Reject
                        </button>
                      </div>
                    </div>
                    {(quotesByRequest[request.request_id] || []).length > 0 && (
                      <div className="quote-list">
                        {(quotesByRequest[request.request_id] || []).map(quote => {
                          const negotiation = negotiationForms[quote.quote_id] || {};
                          return (
                            <div key={quote.quote_id} className="quote-card">
                              <div className="quote-header">
                                <strong>Quote #{quote.quote_id}</strong>
                                <span className={`status-pill status-${quote.status}`}>{quote.status}</span>
                              </div>
                              <p className="section-subtext">
                                ${quote.quoted_price} on {quote.scheduled_date} ({quote.scheduled_start_time}-{quote.scheduled_end_time})
                              </p>
                              {quote.notes && <p className="section-subtext">Note: {quote.notes}</p>}
                              {quote.negotiations?.length > 0 && (
                                <div className="negotiation-thread">
                                  {quote.negotiations.map(entry => (
                                    <div key={entry.negotiation_id} className="negotiation-entry">
                                      <span className="pill">{entry.sender_type}</span>
                                      <p>{entry.message}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <form className="stacked-form" onSubmit={event => handleNegotiateQuote(event, quote.quote_id)}>
                                <textarea
                                  placeholder="Reply to client"
                                  value={negotiation.message || ''}
                                  onChange={event => updateNegotiationForm(quote.quote_id, 'message', event.target.value)}
                                />
                                <div className="grid-two">
                                  <input
                                    type="number"
                                    placeholder="Adjusted price"
                                    value={negotiation.proposedPrice || ''}
                                    onChange={event => updateNegotiationForm(quote.quote_id, 'proposedPrice', event.target.value)}
                                  />
                                  <input
                                    type="date"
                                    value={negotiation.proposedDate || ''}
                                    onChange={event => updateNegotiationForm(quote.quote_id, 'proposedDate', event.target.value)}
                                  />
                                  <input
                                    type="time"
                                    value={negotiation.proposedTime || ''}
                                    onChange={event => updateNegotiationForm(quote.quote_id, 'proposedTime', event.target.value)}
                                  />
                                </div>
                                <button type="submit" className="btn btn-secondary">
                                  Send response
                                </button>
                              </form>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="glass-card" style={{ marginBottom: 28 }}>
            <h2 className="section-heading">Orders</h2>
            <div className="stacked-list">
              {orders.map(order => {
                const form = completionForms[order.order_id] || {};
                return (
                  <article key={order.order_id} className="request-card">
                    <header>
                      <div>
                        <h3>Order #{order.order_id}</h3>
                        <p className="section-subtext">
                          Quote #{order.quote_id} • Client {order.first_name} {order.last_name}
                        </p>
                      </div>
                      <span className={`status-pill status-${order.status}`}>{order.status}</span>
                    </header>
                    <p className="section-subtext">
                      Scheduled {order.scheduled_date} ({order.scheduled_start_time}-{order.scheduled_end_time}) at ${order.final_price}
                    </p>
                    <div className="stacked-form">
                      <h4>Mark complete & bill</h4>
                      <input
                        type="number"
                        placeholder="Bill amount"
                        value={form.amount || ''}
                        onChange={event => updateCompletionForm(order.order_id, 'amount', event.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Discount"
                        value={form.discount || ''}
                        onChange={event => updateCompletionForm(order.order_id, 'discount', event.target.value)}
                      />
                      <input
                        type="date"
                        value={form.dueDate || ''}
                        onChange={event => updateCompletionForm(order.order_id, 'dueDate', event.target.value)}
                      />
                      <textarea
                        placeholder="Completion notes"
                        value={form.notes || ''}
                        onChange={event => updateCompletionForm(order.order_id, 'notes', event.target.value)}
                      />
                      <button type="button" className="btn btn-primary" onClick={() => handleCompleteOrder(order.order_id)}>
                        Complete order
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="glass-card" style={{ marginBottom: 28 }}>
            <h2 className="section-heading">Bills</h2>
            <div className="stacked-list">
              {bills.map(bill => {
                const form = billRevisionForms[bill.bill_id] || {};
                return (
                  <article key={bill.bill_id} className="bill-card">
                    <header>
                      <div>
                        <h3>Bill #{bill.bill_id}</h3>
                        <p className="section-subtext">
                          Order #{bill.order_id} • Client #{bill.client_id} • Due {bill.due_date}
                        </p>
                      </div>
                      <span className={`status-pill status-${bill.status}`}>{bill.status}</span>
                    </header>
                    <p className="section-subtext">
                      Original ${bill.amount} • Discount ${bill.discount} • Final ${bill.final_amount}
                    </p>
                    {bill.notes && <p className="section-subtext">Notes: {bill.notes}</p>}
                    <div className="stacked-form">
                      <h4>Revise bill or respond</h4>
                      <input
                        type="number"
                        placeholder="New amount"
                        value={form.amount || ''}
                        onChange={event => updateBillRevisionForm(bill.bill_id, 'amount', event.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="New discount"
                        value={form.discount || ''}
                        onChange={event => updateBillRevisionForm(bill.bill_id, 'discount', event.target.value)}
                      />
                      <select
                        value={form.status || bill.status}
                        onChange={event => updateBillRevisionForm(bill.bill_id, 'status', event.target.value)}
                      >
                        {['pending', 'paid', 'disputed', 'revised'].map(option => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <textarea
                        placeholder="Message to client"
                        value={form.message || ''}
                        onChange={event => updateBillRevisionForm(bill.bill_id, 'message', event.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Counter amount (optional)"
                        value={form.proposedAmount || ''}
                        onChange={event => updateBillRevisionForm(bill.bill_id, 'proposedAmount', event.target.value)}
                      />
                      <button type="button" className="btn btn-secondary" onClick={() => handleReviseBill(bill.bill_id)}>
                        Save changes
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="glass-card">
            <div className="analytics-header">
              <div>
                <h2 className="section-heading">Analytics</h2>
                <p className="section-subtext">All SQL statements live in <code>sql.txt</code>. Adjust the month filter for accepted quotes.</p>
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="quoteMonth">
                  Accepted quotes month
                </label>
                <input id="quoteMonth" type="month" value={quoteMonth} onChange={event => setQuoteMonth(event.target.value)} />
              </div>
            </div>
            <div className="analytics-grid">
              <article className="analytics-card">
                <h3>Frequent clients</h3>
                <ul>
                  {analytics.frequentClients.map(client => (
                    <li key={client.client_id}>
                      {client.first_name} {client.last_name} — {client.completed_orders} completed
                    </li>
                  ))}
                </ul>
              </article>
              <article className="analytics-card">
                <h3>Uncommitted clients</h3>
                <ul>
                  {analytics.uncommittedClients.map(client => (
                    <li key={client.client_id}>
                      {client.first_name} {client.last_name} — {client.request_count} requests
                    </li>
                  ))}
                </ul>
              </article>
              <article className="analytics-card">
                <h3>Prospective clients</h3>
                <ul>
                  {analytics.prospectiveClients.map(client => (
                    <li key={client.client_id}>
                      {client.first_name} {client.last_name} — registered {new Date(client.created_at).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              </article>
              <article className="analytics-card">
                <h3>Largest job</h3>
                <ul>
                  {analytics.largestJobs.map(job => (
                    <li key={job.request_id}>
                      #{job.request_id} — {job.number_of_rooms} rooms for {job.first_name} {job.last_name}
                    </li>
                  ))}
                </ul>
              </article>
              <article className="analytics-card">
                <h3>Overdue bills</h3>
                <ul>
                  {analytics.overdueBills.map(bill => (
                    <li key={bill.bill_id}>
                      Bill #{bill.bill_id} — ${bill.final_amount} ({bill.first_name} {bill.last_name})
                    </li>
                  ))}
                </ul>
              </article>
              <article className="analytics-card">
                <h3>Bad clients</h3>
                <ul>
                  {analytics.badClients.map(client => (
                    <li key={client.client_id}>
                      {client.first_name} {client.last_name}
                    </li>
                  ))}
                </ul>
              </article>
              <article className="analytics-card">
                <h3>Good clients</h3>
                <ul>
                  {analytics.goodClients.map(client => (
                    <li key={client.client_id}>
                      {client.first_name} {client.last_name}
                    </li>
                  ))}
                </ul>
              </article>
              <article className="analytics-card">
                <h3>Accepted quotes</h3>
                <ul>
                  {acceptedQuotes.map(quote => (
                    <li key={quote.quote_id}>
                      Quote #{quote.quote_id} — ${quote.quoted_price} ({quote.first_name} {quote.last_name})
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </section>
        </>
      )}
    </PageLayout>
  );
};

export default AdminPortal;
