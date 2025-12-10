import ClientPortal from './pages/ClientPortal';
import AdminPortal from './pages/AdminPortal';
import './App.css';

const App = () => {
  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">Anna Johnson · Home Cleaning Services</p>
          <h1>Engage clients, manage work, stay ready</h1>
          <p className="lede">
            Use the client workspace to submit detailed service requests and monitor bills, or switch to the admin
            console to manage quotes, orders, and performance analytics.
          </p>
        </div>
      </header>

      <main className="portal-grid">
        <ClientPortal />
        <AdminPortal />
      </main>

      <footer className="footer">
        <span>Project 2 · Database-driven workflow demo</span>
      </footer>
    </div>
  );
};

export default App;
