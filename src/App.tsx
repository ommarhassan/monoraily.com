import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import NewsTicker from './components/NewsTicker';
import Topbar from './components/Topbar';
import TicketModal from './components/TicketModal';
import { usePlanner } from './hooks/usePlanner';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
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
/** Pages already translated to English. Any other page stays Arabic (rtl) even when English is selected. */
const translatedPages: Page[] = [];

function Shell() {
  const { user, loading, recovery, isAdmin, signOut } = useAuth();
  const { dir } = useLanguage();
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
    if (recovery) return <AuthScreen mode="reset" setMode={setAuthMode} />;

    const needsLogin = page === 'auth' || (protectedPages.includes(page) && !user);
    if (needsLogin) {
      const notice =
        afterLogin !== 'home' && afterLogin !== 'dashboard' ? 'سجّل دخولك الأول عشان تفتح الصفحة دي.' : undefined;
      return <AuthScreen mode={authMode} setMode={setAuthMode} notice={notice} />;
    }

    switch (page) {
      case 'home':
        return <HomePage planner={planner} now={now} onGo={go} onBook={book} />;
      case 'map':
        return (
          <MapPage
            onTicket={(from, to) => {
              planner.planBetween(from, to);
              book();
            }}
          />
        );
      case 'stations':
        return <StationsPage />;
      case 'fares':
        return <FaresPage onPlan={() => go('home')} />;
      case 'mytickets':
        return <MyTicketsPage onPlan={() => go('home')} justPaid={paidId} />;
      case 'gate':
        return <GatePage />;
      case 'dashboard':
        return <DashboardPage onPlan={() => go('home')} />;
      case 'verification':
        return <VerificationPage />;
      case 'admin':
        return isAdmin ? (
          <AdminPage />
        ) : (
          <div className="subpage">
            <div className="result-card empty-result">
              <h3>مش مسموح لك تدخل هنا.</h3>
              <p>الصفحة دي للأدمن بس.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="app-shell" dir={dir}>
      <Topbar
        page={page}
        now={now}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((open) => !open)}
        onGo={go}
        onLogin={() => openAuth('login', 'home')}
        onRegister={() => openAuth('register', 'home')}
        onSignOut={() => {
          void signOut();
          setPage('home');
        }}
      />
      <NewsTicker />
      <main className="main-content">{renderPage()}</main>

      {ticketOpen && planner.route && (
        <TicketModal
          route={planner.route}
          onClose={() => setTicketOpen(false)}
          onVerify={() => {
            setTicketOpen(false);
            go('verification');
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  // A ticket QR opens the app with ?verify=<token>: show the gate result instead of the full app.
  const token = new URLSearchParams(window.location.search).get('verify');
  return token ? (
    <VerifyScreen token={token} />
  ) : (
    <LanguageProvider>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </LanguageProvider>
  );
}
