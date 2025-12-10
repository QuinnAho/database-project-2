import React, { useState, useEffect } from 'react';
import api, { withAuth } from '../api';

const defaultRegister = {
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

const defaultRequest = {
  serviceAddress: '',
  cleaningType: 'basic',
  numberOfRooms: 1,
  preferredDate: '',
  preferredTime: '09:00',
  proposedBudget: '',
  specialNotes: '',
  photos: ''
};

const paymentDefaults = {
  amountPaid: '',
  paymentMethod: 'credit_card',
  transactionId: ''
};

const ClientPortal = () => {
  const [registerData, setRegisterData] = useState(defaultRegister);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [requestData, setRequestData] = useState(defaultRequest);
  const [paymentForms, setPaymentForms] = useState({});
  const [client, setClient] = useState(() => {
    const stored = localStorage.getItem('clientProfile');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('clientToken'));
  const [requests, setRequests] = useState([]);
  const [bills, setBills] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async e => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await api.post('/auth/clients/register', {
        ...registerData
      });
      setRegisterData(defaultRegister);
      setMessage('Registration successful. You can sign in now.');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async e => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/clients/login', loginData);
      localStorage.setItem('clientToken', data.token);
      localStorage.setItem('clientProfile', JSON.stringify(data.client));
      setToken(data.token);
      setClient(data.client);
      setLoginData({ email: '', password: '' });
      setMessage('Welcome back!');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('clientToken');
    localStorage.removeItem('clientProfile');
    setToken(null);
    setClient(null);
    setRequests([]);
    setBills([]);
    setPaymentForms({});
  };

  const loadData = async () => {
    if (!token) return;
    try {
      const [requestsRes, billsRes] = await Promise.all([
        api.get('/requests', withAuth(token)),
        api.get('/bills', withAuth(token))
      ]);
      setRequests(requestsRes.data.requests || []);
      setBills(billsRes.data.bills || []);
      const initialPayments = {};
      (billsRes.data.bills || []).forEach(bill => {
        initialPayments[bill.bill_id] = { ...paymentDefaults, amountPaid: bill.final_amount };
      });
      setPaymentForms(initialPayments);
    } catch (err) {
      setError('Failed to load your latest data.');
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleRequestSubmit = async e => {
    e.preventDefault();
    if (!token) {
      setError('Please sign in first.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const payload = {
        ...requestData,
        photos: requestData.photos
          ? requestData.photos
              .split('\n')
              .map(url => url.trim())
              .filter(Boolean)
          : []
      };
      await api.post('/requests', payload, withAuth(token));
      setRequestData(defaultRequest);
      setMessage('Service request submitted.');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit request.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentChange = (billId, field, value) => {
    setPaymentForms(prev => ({
      ...prev,
      [billId]: {
        ...prev[billId],
        [field]: value
      }
    }));
  };

  const handlePaymentSubmit = async (billId, e) => {
    e.preventDefault();
    const form = paymentForms[billId];
    if (!form || !token) return;
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await api.post(`/bills/${billId}/pay`, form, withAuth(token));
      setMessage('Payment recorded.');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDispute = async (billId, note) => {
    if (!note) {
      setError('Please provide a short explanation.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await api.post(
        `/bills/${billId}/dispute`,
        { message: note },
        withAuth(token)
      );
      setMessage('Dispute submitted.');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to dispute bill.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="portal-card">
      <header className="portal-header">
        <h2>Client Workspace</h2>
        {client && (
          <div className="session-badge">
            <span>{client.firstName} {client.lastName}</span>
            <button type="button" onClick={handleLogout} className="text-btn">
              Sign out
            </button>
          </div>
        )}
      </header>

      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert danger">{error}</div>}

      {!client ? (
        <div className="grid-2">
          <form onSubmit={handleLogin} className="panel">
            <h3>Sign in</h3>
            <label>
              Email
              <input
                type="email"
                value={loginData.email}
                onChange={e => setLoginData({ ...loginData, email: e.target.value })}
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
              Sign in
            </button>
          </form>

          <form onSubmit={handleRegister} className="panel">
            <h3>Create profile</h3>
            <div className="grid-2 compact">
              <label>
                First name
                <input
                  value={registerData.firstName}
                  onChange={e => setRegisterData({ ...registerData, firstName: e.target.value })}
                  required
                />
              </label>
              <label>
                Last name
                <input
                  value={registerData.lastName}
                  onChange={e => setRegisterData({ ...registerData, lastName: e.target.value })}
                  required
                />
              </label>
            </div>
            <label>
              Email
              <input
                type="email"
                value={registerData.email}
                onChange={e => setRegisterData({ ...registerData, email: e.target.value })}
                required
              />
            </label>
            <label>
              Phone
              <input
                value={registerData.phone}
                onChange={e => setRegisterData({ ...registerData, phone: e.target.value })}
                required
              />
            </label>
            <label>
              Address
              <input
                value={registerData.address}
                onChange={e => setRegisterData({ ...registerData, address: e.target.value })}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={registerData.password}
                onChange={e => setRegisterData({ ...registerData, password: e.target.value })}
                required
              />
            </label>
            <div className="grid-3 compact">
              <label>
                Card number
                <input
                  value={registerData.creditCardNumber}
                  onChange={e => setRegisterData({ ...registerData, creditCardNumber: e.target.value })}
                  required
                />
              </label>
              <label>
                Expiry (MM/YYYY)
                <input
                  value={registerData.creditCardExpiry}
                  onChange={e => setRegisterData({ ...registerData, creditCardExpiry: e.target.value })}
                  required
                />
              </label>
              <label>
                CVV
                <input
                  value={registerData.creditCardCvv}
                  onChange={e => setRegisterData({ ...registerData, creditCardCvv: e.target.value })}
                  required
                />
              </label>
            </div>
            <button type="submit" className="outline-btn" disabled={loading}>
              Create account
            </button>
          </form>
        </div>
      ) : (
        <>
          <form onSubmit={handleRequestSubmit} className="panel">
            <h3>Request cleaning</h3>
            <div className="grid-2 compact">
              <label>
                Service address
                <input
                  value={requestData.serviceAddress}
                  onChange={e => setRequestData({ ...requestData, serviceAddress: e.target.value })}
                  required
                />
              </label>
              <label>
                Cleaning type
                <select
                  value={requestData.cleaningType}
                  onChange={e => setRequestData({ ...requestData, cleaningType: e.target.value })}
                >
                  <option value="basic">Basic</option>
                  <option value="deep cleaning">Deep cleaning</option>
                  <option value="move-out">Move-out</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>
            <div className="grid-3 compact">
              <label>
                Rooms
                <input
                  type="number"
                  min="1"
                  value={requestData.numberOfRooms}
                  onChange={e => setRequestData({ ...requestData, numberOfRooms: e.target.value })}
                  required
                />
              </label>
              <label>
                Preferred date
                <input
                  type="date"
                  value={requestData.preferredDate}
                  onChange={e => setRequestData({ ...requestData, preferredDate: e.target.value })}
                  required
                />
              </label>
              <label>
                Preferred time
                <input
                  type="time"
                  value={requestData.preferredTime}
                  onChange={e => setRequestData({ ...requestData, preferredTime: e.target.value })}
                  required
                />
              </label>
            </div>
            <label>
              Proposed budget
              <input
                type="number"
                value={requestData.proposedBudget}
                onChange={e => setRequestData({ ...requestData, proposedBudget: e.target.value })}
                required
              />
            </label>
            <label>
              Notes
              <textarea
                value={requestData.specialNotes}
                onChange={e => setRequestData({ ...requestData, specialNotes: e.target.value })}
                rows={2}
              />
            </label>
            <label>
              Photo URLs (one per line, optional)
              <textarea
                value={requestData.photos}
                onChange={e => setRequestData({ ...requestData, photos: e.target.value })}
                rows={2}
              />
            </label>
            <button type="submit" className="primary-btn" disabled={loading}>
              Submit request
            </button>
          </form>

          <div className="panel">
            <h3>My service requests</h3>
            {requests.length === 0 ? (
              <p className="muted">No requests yet.</p>
            ) : (
              <div className="table">
                <div className="table-row table-header">
                  <span>Address</span>
                  <span>Type</span>
                  <span>Status</span>
                  <span>Budget</span>
                </div>
                {requests.map(req => (
                  <div className="table-row" key={req.request_id}>
                    <div>
                      <strong>{req.service_address}</strong>
                      <small>{new Date(req.created_at).toLocaleDateString()}</small>
                    </div>
                    <span className="chip">{req.cleaning_type}</span>
                    <span className="chip neutral">{req.status}</span>
                    <span>${Number(req.proposed_budget).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel">
            <h3>Billing</h3>
            {bills.length === 0 ? (
              <p className="muted">No bills issued yet.</p>
            ) : (
              bills.map(bill => (
                <div className="bill-card" key={bill.bill_id}>
                  <div>
                    <strong>Bill #{bill.bill_id}</strong>
                    <p className="muted">
                      Due {new Date(bill.due_date).toLocaleDateString()} · Status {bill.status}
                    </p>
                  </div>
                  <p className="total">${Number(bill.final_amount).toFixed(2)}</p>
                  {bill.status !== 'paid' && (
                    <form onSubmit={e => handlePaymentSubmit(bill.bill_id, e)} className="grid-3 compact gap">
                      <label>
                        Amount
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={paymentForms[bill.bill_id]?.amountPaid || ''}
                          onChange={e => handlePaymentChange(bill.bill_id, 'amountPaid', e.target.value)}
                          required
                        />
                      </label>
                      <label>
                        Method
                        <select
                          value={paymentForms[bill.bill_id]?.paymentMethod || 'credit_card'}
                          onChange={e => handlePaymentChange(bill.bill_id, 'paymentMethod', e.target.value)}
                        >
                          <option value="credit_card">Credit card</option>
                          <option value="debit_card">Debit card</option>
                          <option value="cash">Cash</option>
                          <option value="other">Other</option>
                        </select>
                      </label>
                      <label>
                        Reference
                        <input
                          value={paymentForms[bill.bill_id]?.transactionId || ''}
                          onChange={e => handlePaymentChange(bill.bill_id, 'transactionId', e.target.value)}
                        />
                      </label>
                      <button type="submit" className="primary-btn" disabled={loading}>
                        Pay bill
                      </button>
                      <button
                        type="button"
                        className="text-btn"
                        onClick={() => {
                          const note = window.prompt('Describe the issue with this bill:');
                          if (note) {
                            handleDispute(bill.bill_id, note);
                          }
                        }}
                      >
                        Dispute instead
                      </button>
                    </form>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default ClientPortal;
