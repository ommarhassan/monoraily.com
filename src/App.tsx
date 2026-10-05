import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import NewsTicker from './components/NewsTicker';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import TicketModal from './components/TicketModal';
import { usePlanner } from './hooks/usePlanner';
import { protectedPages, type Page } from './navigation';
import AdminPage from './pages/AdminPage';
import AuthScreen, { type AuthMode } from './pages/AuthScreen';
import DashboardPage from './pages/DashboardPage';
import FaresPage from './pages/FaresPage';
import GatePage from './pages/GatePage';
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';
import MyTicketsPage from './pages/MyTicketsPage';
import StationsPage from './pages/StationsPage';
import VerificationPage from './pages/VerificationPage';
import VerifyScreen from './pages/VerifyScreen';

const CLOCK_TICK_MS = 30_000;

function Shell() {
  const { user, loading, recovery, isAdmin, signOut } = useAuth();
  const planner = usePlanner();

  const [page, setPage] = useState<Page>('home');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  /** Where to go after a successful login. */
  const [afterLogin, setAfterLogin] = useState<Page>('dashboard');
  const [ticketOpen, setTicketOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  /** Ticket id Paymob sends the customer back with (?paid=PAY-XXXX). Never trusted as proof of payment. */
  const [paidId, setPaidId] = useState<string | null>(() => new URLSearchParams(window.location.search).get('paid'));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user && page === 'auth' && !recovery) setPage(afterLogin);
  }, [user, page, recovery, afterLogin]);

  // Back from Paymob: clean the URL and open the wallet (log in first if the session is gone).
  useEffect(() => {
    if (paidId) window.history.replaceState(null, '', window.location.pathname);
  }, [paidId]);

  useEffect(() => {
    if (!paidId || loading) return;
    if (user) {
      setPage('mytickets');
    } else {
      setAfterLogin('mytickets');
      setAuthMode('login');
      setPage('auth');
    }
  }, [paidId, loading, user]);

  const openAuth = (mode: AuthMode, next: Page) => {
    setAfterLogin(next);
    setAuthMode(mode);
    setPage('auth');
    setMenuOpen(false);
  };

  const go = (target: Page) => {
    if (protectedPages.includes(target) && !user && !loading) return openAuth('login', target);
    setPaidId(null);
    setPage(target);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /** Opens the ticket modal for the current route, asking to log in first when needed. */
  const book = () => (user ? setTicketOpen(true) : openAuth('login', 'home'));

  const renderPage = () => {
    if (loading) {
      return (
        <div className="subpage">
          <p className="auth-sub">بنحمّل…</p>
        </div>
      );
    }
    if (recovery) return <AuthScreen mode="reset" setMode={setAuthMode}
