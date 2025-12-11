import React from 'react';
import { Link } from 'react-router-dom';
import PageLayout from './PageLayout';

const workflow = [
  {
    title: '1. Request',
    text: 'Clients register, describe their home, attach up to five photos, and propose a budget.'
  },
  {
    title: '2. Quote',
    text: 'Anna reviews every request, responds with a quote, or rejects it with a note. All messages are archived.'
  },
  {
    title: '3. Order',
    text: 'Once a quote is accepted the system generates the service order and tracks its completion.'
  },
  {
    title: '4. Billing',
    text: 'Anna issues a bill, clients can pay immediately or dispute it, and both sides can negotiate adjustments.'
  }
];

const HomePage = () => {
  return (
    <PageLayout
      title="Home-cleaning service manager"
      subtitle="One web app powers Anna Johnson's contracting business end to end: registration, quotes, orders, billing, and the required analytics."
      actionSlot={
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/client" className="btn btn-primary">
            Client workspace
          </Link>
          <Link to="/admin" className="btn btn-secondary">
            Anna's dashboard
          </Link>
        </div>
      }
    >
      <section className="info-grid" style={{ marginBottom: 28 }}>
        <div className="glass-card">
          <span className="pill">Everything in one place</span>
          <h2 className="section-heading">Project features</h2>
          <ul className="section-subtext">
            <li>Full MySQL schema captured in <code>database/schema.sql</code> with cardinalities from the ER model.</li>
            <li>Express API covering clients, service requests, photos, quotes, orders, bills, payments, and analytics.</li>
            <li>Secure file uploads for request photos plus negotiation logs for both quotes and bills.</li>
            <li>React frontend that exposes the entire workflow plus Anna's dashboard insights.</li>
          </ul>
        </div>
        <div className="glass-card">
          <span className="pill">Workflow</span>
          <h2 className="section-heading">How the system operates</h2>
          <ul className="section-subtext">
            {workflow.map(item => (
              <li key={item.title}>
                <strong>{item.title}</strong> {item.text}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="glass-card" style={{ marginBottom: 28 }}>
        <h2 className="section-heading">Dashboards for each role</h2>
        <div className="grid-two">
          <div>
            <h3>Clients can</h3>
            <ul className="section-subtext">
              <li>Register with payment details and log in securely.</li>
              <li>Create detailed service requests with photos and notes.</li>
              <li>Review quotes, negotiate, accept, or reject them.</li>
              <li>Pay bills or file disputes with context.</li>
            </ul>
          </div>
          <div>
            <h3>Anna can</h3>
            <ul className="section-subtext">
              <li>Review every request, attach quotes, and log responses.</li>
              <li>Track orders through completion and generate bills.</li>
              <li>Revise billing after disputes and capture adjustments.</li>
              <li>Run all eight mandatory analytics queries live.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="glass-card">
        <h2 className="section-heading">Analytics included</h2>
        <p className="section-subtext">
          Anna's dashboard surfaces the required reports: frequent clients, uncommitted clients, accepted quotes by month,
          prospective clients, largest completed job, overdue bills, bad clients, and good clients. Each statement lives in{' '}
          <code>sql.txt</code> and powers the cards rendered in the admin view so you can demo the SQL in action.
        </p>
      </section>
    </PageLayout>
  );
};

export default HomePage;
