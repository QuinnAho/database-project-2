import React, { useEffect, useMemo, useState } from 'react';
import PageLayout from '../PageLayout';
import api, { getErrorMessage } from '../api';

const cleaningOptions = ['basic', 'deep cleaning', 'move-out', 'other'];
const paymentOptions = ['credit_card', 'debit_card', 'cash', 'other'];

const initialRegisterForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  password: '',
  creditCardNumber: '',
  creditCardExpiry: '',
  creditCardCvv: ''
};

const registerFields = [
  { name: 'firstName', label: 'First name', type: 'text' },
  { name: 'lastName', label: 'Last name', type: 'text' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'phone', label: 'Phone', type: 'tel' },
  { name: 'address', label: 'Address', type: 'text' },
  { name: 'password', label: 'Password', type: 'password' },
  { name: 'creditCardNumber', label: 'Credit card number', type: 'text' },
  { name: 'creditCardExpiry', label: 'Card expiry (MM/YYYY)', type: 'text' },
  { name: 'creditCardCvv', label: 'Card CVV', type: 'password' }
];

const initialRequestForm = {
  serviceAddress: '',
  cleaningType: 'basic',
  numberOfRooms: 1,
  preferredDate: '',
  preferredTime: '09:00',
  proposedBudget: '',
  specialNotes: ''
};

const ClientPortal = () => {
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [requestForm, setRequestForm] = useState(initialRequestForm);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoLinks, setPhotoLinks] = useState(['']);
  const [requests, setRequests] = useState([]);
  const [quotesByRequest, setQuotesByRequest] = useState({});
  const [bills, setBills] = useState([]);
  const [registerFeedback, setRegisterFeedback] = useState({ type: '', message: '' });
  const [loginFeedback, setLoginFeedback] = useState({ type: '', message: '' });
  const [requestFeedback, setRequestFeedback] = useState({ type: '', message: '' });
  const [billingFeedback, setBillingFeedback] = useState({ type: '', message: '' });
  const [authState, setAuthState] = useState(() => ({
    role: localStorage.getItem('role'),
    token: localStorage.getItem('token'),
    name: localStorage.getItem('clientName') || ''
  }));
  const [negotiationForms, setNegotiationForms] = useState({});
  const [paymentForms, setPaymentForms] = useState({});
  const [disputeForms, setDisputeForms] = useState({});

  const isAuthenticated = authState.role === 'client' && Boolean(authState.token);
  const assetBaseUrl = useMemo(() => (api.defaults.baseURL || '').replace(/\/$/, ''), []);

  useEffect(() => {
    const availableSlots = Math.max(0, 5 - photoFiles.length);
    setPhotoLinks(prev => {
      if (availableSlots === 0) {
        return [];
      }
      if (prev.length === 0) {
        return [''];
      }
      if (prev.length > availableSlots) {
        return prev.slice(0, availableSlots);
      }
      return prev;
    });
  }, [photoFiles]);

  const authHeaders = useMemo(() => {
    if (!authState.token) {
      return undefined;
    }
    return { Authorization: `Bearer ${authState.token}` };
  }, [authState.token]);

  const resolvePhotoUrl = url => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `${assetBaseUrl}${url}`;
  };

  const fetchRequests = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get('/api/requests', { headers: authHeaders });
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error('Failed to load requests', error);
    }
  };

  const fetchBills = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get('/api/bills', { headers: authHeaders });
      setBills(response.data.bills || []);
    } catch (error) {
      console.error('Failed to load bills', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchRequests();
      fetchBills();
    } else {
      setRequests([]);
      setBills([]);
    }
  }, [isAuthenticated]);

  const handleRegisterChange = event => {
    const { name, value } = event.target;
    setRegisterForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async event => {
    event.preventDefault();
    setRegisterFeedback({ type: '', message: '' });
    try {
      await api.post('/api/auth/clients/register', registerForm);
      setRegisterFeedback({ type: 'success', message: 'Account created. You can log in now.' });
      setRegisterForm(initialRegisterForm);
    } catch (error) {
      setRegisterFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Registration failed. Double-check the form and try again.')
      });
    }
  };

  const handleLoginChange = event => {
    const { name, value } = event.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async event => {
    event.preventDefault();
    setLoginFeedback({ type: '', message: '' });
    try {
      const response = await api.post('/api/auth/clients/login', loginForm);
      const { token, client } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', 'client');
      localStorage.setItem('clientName', `${client.firstName} ${client.lastName}`);
      setAuthState({ role: 'client', token, name: `${client.firstName} ${client.lastName}` });
      setLoginFeedback({ type: 'success', message: 'Welcome back! We loaded your data.' });
      setLoginForm({ email: '', password: '' });
      fetchRequests();
      fetchBills();
    } catch (error) {
      setLoginFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Login failed. Check your email and password.')
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('clientName');
    setAuthState({ role: null, token: '', name: '' });
    setQuotesByRequest({});
    setRequests([]);
    setBills([]);
  };

  const handleRequestFormChange = event => {
    const { name, value } = event.target;
    setRequestForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoLinksChange = (index, value) => {
    setPhotoLinks(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addPhotoLinkField = () => {
    const availableSlots = Math.max(0, 5 - photoFiles.length);
    if (photoLinks.length >= availableSlots) return;
    setPhotoLinks(prev => [...prev, '']);
  };

  const handleRequestSubmit = async event => {
    event.preventDefault();
    if (!isAuthenticated) {
      setRequestFeedback({ type: 'error', message: 'Please log in before submitting a request.' });
      return;
    }

    setRequestFeedback({ type: '', message: '' });

    try {
      const formData = new FormData();
      Object.entries(requestForm).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      photoFiles.forEach(file => formData.append('photos', file));

      const manualUrls = photoLinks.map(link => link.trim()).filter(Boolean);
      if (manualUrls.length > 0) {
        formData.append('photoUrls', JSON.stringify(manualUrls));
      }

      await api.post('/api/requests', formData, {
        headers: {
          ...authHeaders,
          'Content-Type': 'multipart/form-data'
        }
      });

      setRequestFeedback({ type: 'success', message: 'Request submitted. We will notify you when Anna responds.' });
      setRequestForm(initialRequestForm);
      setPhotoFiles([]);
      setPhotoLinks(['']);
      fetchRequests();
    } catch (error) {
      setRequestFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Unable to submit the request right now.')
      });
    }
  };

  const handleFetchQuotes = async requestId => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get(`/api/quotes/request/${requestId}`, { headers: authHeaders });
      setQuotesByRequest(prev => ({ ...prev, [requestId]: response.data.quotes || [] }));
    } catch (error) {
      console.error('Failed to load quotes', error);
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
    const payload = negotiationForms[quoteId];
    if (!payload || !payload.message) return;

    try {
      await api.post(
        `/api/quotes/${quoteId}/negotiate`,
        {
          message: payload.message,
          proposedPrice: payload.proposedPrice || undefined,
          proposedDate: payload.proposedDate || undefined,
          proposedTime: payload.proposedTime || undefined
        },
        { headers: authHeaders }
      );

      setNegotiationForms(prev => ({ ...prev, [quoteId]: { message: '', proposedPrice: '', proposedDate: '', proposedTime: '' } }));
      fetchRequests();
      const requestId = Object.entries(quotesByRequest).find(([_, list]) =>
        (list || []).some(quote => quote.quote_id === quoteId)
      )?.[0];
      if (requestId) {
        handleFetchQuotes(Number(requestId));
      }
    } catch (error) {
      setRequestFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Unable to send the negotiation message.')
      });
    }
  };

  const handleAcceptQuote = async quoteId => {
    try {
      await api.post(`/api/quotes/${quoteId}/accept`, {}, { headers: authHeaders });
      setRequestFeedback({ type: 'success', message: 'Quote accepted. Your service order is scheduled.' });
      fetchRequests();
      fetchBills();
    } catch (error) {
      setRequestFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Unable to accept this quote.')
      });
    }
  };

  const handleRejectQuote = async quoteId => {
    try {
      await api.post(`/api/quotes/${quoteId}/reject`, {}, { headers: authHeaders });
      fetchRequests();
      setRequestFeedback({ type: 'success', message: 'Quote rejected.' });
    } catch (error) {
      setRequestFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Unable to reject the quote.')
      });
    }
  };

  const updatePaymentForm = (billId, field, value) => {
    setPaymentForms(prev => ({
      ...prev,
      [billId]: {
        ...prev[billId],
        [field]: value
      }
    }));
  };

  const updateDisputeForm = (billId, field, value) => {
    setDisputeForms(prev => ({
      ...prev,
      [billId]: {
        ...prev[billId],
        [field]: value
      }
    }));
  };

  const handlePayBill = async (event, billId) => {
    event.preventDefault();
    const form = paymentForms[billId] || {};
    try {
      await api.post(
        `/api/bills/${billId}/pay`,
        {
          amountPaid: Number(form.amountPaid || 0),
          paymentMethod: form.paymentMethod || 'credit_card',
          transactionId: form.transactionId || undefined
        },
        { headers: authHeaders }
      );
      setBillingFeedback({ type: 'success', message: 'Payment recorded. Thank you!' });
      fetchBills();
    } catch (error) {
      setBillingFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Unable to record the payment.')
      });
    }
  };

  const handleDisputeBill = async (event, billId) => {
    event.preventDefault();
    const form = disputeForms[billId] || {};
    if (!form.message) {
      setBillingFeedback({ type: 'error', message: 'Please include a message when disputing the bill.' });
      return;
    }
    try {
      await api.post(
        `/api/bills/${billId}/dispute`,
        {
          message: form.message,
          proposedAmount: form.proposedAmount ? Number(form.proposedAmount) : undefined
        },
        { headers: authHeaders }
      );
      setBillingFeedback({ type: 'success', message: 'Dispute submitted. Anna will respond soon.' });
      fetchBills();
    } catch (error) {
      setBillingFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Unable to submit the dispute right now.')
      });
    }
  };

  return (
    <PageLayout
      title="Client workspace"
      subtitle="Manage registrations, service requests, quotes, and billing from a single place."
      actionSlot={
        isAuthenticated ? (
          <button type="button" className="btn btn-secondary" onClick={handleLogout}>
            Log out
          </button>
        ) : null
      }
    >
      {!isAuthenticated && (
        <div className="grid-two" style={{ marginBottom: 32 }}>
          <section className="form-card">
            <h2 className="section-heading">Create an account</h2>
            <p className="section-subtext">Register with the details Anna needs to schedule your cleanings.</p>
            {registerFeedback.message && <div className={`status-banner ${registerFeedback.type}`}>{registerFeedback.message}</div>}
            <form onSubmit={handleRegister} className="stacked-form">
              {registerFields.map(field => (
                <div key={field.name} className="input-group">
                  <label className="input-label" htmlFor={field.name}>
                    {field.label}
                  </label>
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    value={registerForm[field.name]}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
              ))}
              <button type="submit" className="btn btn-primary">
                Register
              </button>
            </form>
          </section>

          <section className="form-card">
            <h2 className="section-heading">Log in</h2>
            <p className="section-subtext">Access your requests, quotes, and bills.</p>
            {loginFeedback.message && <div className={`status-banner ${loginFeedback.type}`}>{loginFeedback.message}</div>}
            <form onSubmit={handleLogin} className="stacked-form">
              <div className="input-group">
                <label className="input-label" htmlFor="loginEmail">
                  Email
                </label>
                <input id="loginEmail" type="email" name="email" value={loginForm.email} onChange={handleLoginChange} required />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="loginPassword">
                  Password
                </label>
                <input
                  id="loginPassword"
                  type="password"
                  name="password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Sign in
              </button>
            </form>
          </section>
        </div>
      )}

      {isAuthenticated && (
        <>
          <section className="glass-card" style={{ marginBottom: 28 }}>
            <h2 className="section-heading">Submit a service request</h2>
            <p className="section-subtext">Logged in as {authState.name || 'client'}.</p>
            {requestFeedback.message && <div className={`status-banner ${requestFeedback.type}`}>{requestFeedback.message}</div>}
            <form onSubmit={handleRequestSubmit} className="grid-two">
              <div className="stacked-form">
                <div className="input-group">
                  <label className="input-label" htmlFor="serviceAddress">
                    Service address
                  </label>
                  <input
                    id="serviceAddress"
                    name="serviceAddress"
                    value={requestForm.serviceAddress}
                    onChange={handleRequestFormChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="cleaningType">
                    Cleaning type
                  </label>
                  <select id="cleaningType" name="cleaningType" value={requestForm.cleaningType} onChange={handleRequestFormChange}>
                    {cleaningOptions.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="numberOfRooms">
                    Number of rooms
                  </label>
                  <input
                    id="numberOfRooms"
                    type="number"
                    name="numberOfRooms"
                    min="1"
                    value={requestForm.numberOfRooms}
                    onChange={handleRequestFormChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="preferredDate">
                    Preferred date
                  </label>
                  <input
                    id="preferredDate"
                    type="date"
                    name="preferredDate"
                    value={requestForm.preferredDate}
                    onChange={handleRequestFormChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="preferredTime">
                    Preferred time
                  </label>
                  <input
                    id="preferredTime"
                    type="time"
                    name="preferredTime"
                    value={requestForm.preferredTime}
                    onChange={handleRequestFormChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="proposedBudget">
                    Proposed budget ($)
                  </label>
                  <input
                    id="proposedBudget"
                    type="number"
                    min="0"
                    name="proposedBudget"
                    value={requestForm.proposedBudget}
                    onChange={handleRequestFormChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="specialNotes">
                    Special notes
                  </label>
                  <textarea id="specialNotes" name="specialNotes" value={requestForm.specialNotes} onChange={handleRequestFormChange} />
                </div>
              </div>

              <div className="stacked-form">
                <div className="input-group">
                  <label className="input-label" htmlFor="photoUploads">
                    Upload photos (max 5)
                  </label>
                  <input
                    id="photoUploads"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={event => setPhotoFiles(Array.from(event.target.files || []).slice(0, 5))}
                  />
                  <small className="field-hint">
                    {photoFiles.length > 0 ? `${photoFiles.length} selected` : 'Choose up to five images showing the home.'}
                  </small>
                </div>
                <div className="input-group">
                  <label className="input-label">Photo links (optional)</label>
                  {photoLinks.map((link, index) => (
                    <input
                      key={`photo-link-${index}`}
                      value={link}
                      onChange={event => handlePhotoLinksChange(index, event.target.value)}
                      placeholder="https://example.com/photo.jpg"
                    />
                  ))}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={addPhotoLinkField}
                    disabled={photoLinks.length >= Math.max(0, 5 - photoFiles.length)}
                    style={{ marginTop: 8 }}
                  >
                    Add another link
                  </button>
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: 'auto' }}>
                  Submit request
                </button>
              </div>
            </form>
          </section>

          <section className="glass-card" style={{ marginBottom: 28 }}>
            <h2 className="section-heading">Your service requests</h2>
            {requests.length === 0 && <p className="section-subtext">No requests yet. Fill out the form above to get started.</p>}
            <div className="stacked-list">
              {requests.map(request => (
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
                    Preferred on {request.preferred_date} at {request.preferred_time}. Budget ${request.proposed_budget}.
                  </p>
                  {request.special_notes && <p className="section-subtext">Notes: {request.special_notes}</p>}
                  {request.photos?.length > 0 && (
                    <div className="photo-grid">
                      {request.photos.map(photo => (
                        <img key={photo.photoId} src={resolvePhotoUrl(photo.url)} alt="Request" loading="lazy" />
                      ))}
                    </div>
                  )}
                  <div className="request-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => handleFetchQuotes(request.request_id)}>
                      View quotes
                    </button>
                  </div>
                  {(quotesByRequest[request.request_id] || []).length > 0 && (
                    <div className="quote-list">
                      {(quotesByRequest[request.request_id] || []).map(quote => {
                        const form = negotiationForms[quote.quote_id] || {};
                        return (
                          <div key={quote.quote_id} className="quote-card">
                            <div className="quote-header">
                              <strong>Quote #{quote.quote_id}</strong>
                              <span className={`status-pill status-${quote.status}`}>{quote.status}</span>
                            </div>
                            <p className="section-subtext">
                              Scheduled {quote.scheduled_date} from {quote.scheduled_start_time} to {quote.scheduled_end_time}
                            </p>
                            <p className="section-subtext">Proposed price: ${quote.quoted_price}</p>
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
                            <div className="quote-actions">
                              <button type="button" className="btn btn-primary" onClick={() => handleAcceptQuote(quote.quote_id)}>
                                Accept
                              </button>
                              <button type="button" className="btn btn-secondary" onClick={() => handleRejectQuote(quote.quote_id)}>
                                Reject
                              </button>
                            </div>
                            <form className="stacked-form" onSubmit={event => handleNegotiateQuote(event, quote.quote_id)}>
                              <div className="input-group">
                                <label className="input-label">Send a note</label>
                                <textarea
                                  value={form.message || ''}
                                  onChange={event => updateNegotiationForm(quote.quote_id, 'message', event.target.value)}
                                  placeholder="Share feedback or propose a change"
                                  required
                                />
                              </div>
                              <div className="grid-two">
                                <input
                                  type="number"
                                  placeholder="Counter price"
                                  value={form.proposedPrice || ''}
                                  onChange={event => updateNegotiationForm(quote.quote_id, 'proposedPrice', event.target.value)}
                                />
                                <input
                                  type="date"
                                  value={form.proposedDate || ''}
                                  onChange={event => updateNegotiationForm(quote.quote_id, 'proposedDate', event.target.value)}
                                />
                                <input
                                  type="time"
                                  value={form.proposedTime || ''}
                                  onChange={event => updateNegotiationForm(quote.quote_id, 'proposedTime', event.target.value)}
                                />
                              </div>
                              <button type="submit" className="btn btn-secondary">
                                Send counter
                              </button>
                            </form>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>

          <section className="glass-card">
            <h2 className="section-heading">Bills and payments</h2>
            {billingFeedback.message && <div className={`status-banner ${billingFeedback.type}`}>{billingFeedback.message}</div>}
            {bills.length === 0 ? (
              <p className="section-subtext">No bills yet. They will appear here after a job is completed.</p>
            ) : (
              <div className="stacked-list">
                {bills.map(bill => {
                  const payForm = paymentForms[bill.bill_id] || {};
                  const disputeForm = disputeForms[bill.bill_id] || {};
                  return (
                    <article key={bill.bill_id} className="bill-card">
                      <header>
                        <div>
                          <h3>Bill #{bill.bill_id}</h3>
                          <p className="section-subtext">
                            Order #{bill.order_id} • Due {bill.due_date}
                          </p>
                        </div>
                        <span className={`status-pill status-${bill.status}`}>{bill.status}</span>
                      </header>
                      <p className="section-subtext">
                        Amount: ${bill.amount} • Discount: ${bill.discount} • Final: ${bill.final_amount}
                      </p>
                      {bill.notes && <p className="section-subtext">Notes: {bill.notes}</p>}
                      <div className="grid-two" style={{ marginTop: 16 }}>
                        <form onSubmit={event => handlePayBill(event, bill.bill_id)} className="stacked-form">
                          <h4>Pay this bill</h4>
                          <input
                            type="number"
                            min="0"
                            placeholder="Amount"
                            value={payForm.amountPaid ?? ''}
                            onChange={event => updatePaymentForm(bill.bill_id, 'amountPaid', event.target.value)}
                          />
                          <select
                            value={payForm.paymentMethod || 'credit_card'}
                            onChange={event => updatePaymentForm(bill.bill_id, 'paymentMethod', event.target.value)}
                          >
                            {paymentOptions.map(option => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Transaction ID (optional)"
                            value={payForm.transactionId || ''}
                            onChange={event => updatePaymentForm(bill.bill_id, 'transactionId', event.target.value)}
                          />
                          <button type="submit" className="btn btn-primary">
                            Record payment
                          </button>
                        </form>

                        <form onSubmit={event => handleDisputeBill(event, bill.bill_id)} className="stacked-form">
                          <h4>Dispute this bill</h4>
                          <textarea
                            placeholder="Explain why you disagree"
                            value={disputeForm.message || ''}
                            onChange={event => updateDisputeForm(bill.bill_id, 'message', event.target.value)}
                          />
                          <input
                            type="number"
                            min="0"
                            placeholder="Proposed amount (optional)"
                            value={disputeForm.proposedAmount || ''}
                            onChange={event => updateDisputeForm(bill.bill_id, 'proposedAmount', event.target.value)}
                          />
                          <button type="submit" className="btn btn-secondary">
                            Send dispute
                          </button>
                        </form>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </PageLayout>
  );
};

export default ClientPortal;
