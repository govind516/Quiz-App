import { useEffect } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Home from '@/pages/Home';
import Practice from '@/pages/Practice';
import Leaderboard from '@/pages/Leaderboard';
import Login from '@/pages/Login';
import QuizPlay from '@/pages/QuizPlay';
import QuizResults from '@/pages/QuizResults';
import BuildQuiz from '@/pages/BuildQuiz';
import LiveRoom from '@/pages/LiveRoom';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

import AdminLayout from '@/pages/admin/AdminLayout';
import Dashboard from '@/pages/admin/Dashboard';
import QuestionBank from '@/pages/admin/QuestionBank';
import Categories from '@/pages/admin/Categories';
import AIStudio from '@/pages/admin/AIStudio';
import BulkImport from '@/pages/admin/BulkImport';
import ReviewQueue from '@/pages/admin/ReviewQueue';
import Users from '@/pages/admin/Users';
import Analytics from '@/pages/admin/Analytics';
import Settings from '@/pages/admin/Settings';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Shell() {
  const { pathname } = useLocation();
  const isAuth = pathname === '/login';
  const isPlay = pathname.startsWith('/play') || pathname.startsWith('/results');
  const isAdmin = pathname.startsWith('/admin');
  const isLive = pathname.startsWith('/live');
  return (
    <div className="App grain relative">
      {!isAuth && <Nav />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/play/:id" element={<QuizPlay />} />
        <Route path="/results/:id" element={<QuizResults />} />
        <Route path="/build" element={<BuildQuiz />} />
        <Route path="/live" element={<LiveRoom />} />
        <Route path="/live/:code" element={<LiveRoom />} />

        {/* Everything under /admin requires an authenticated admin account.
            ProtectedRoute redirects anyone else to /login instead of rendering. */}
        <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="questions" element={<QuestionBank />} />
          <Route path="categories" element={<Categories />} />
          <Route path="ai" element={<AIStudio />} />
          <Route path="import" element={<BulkImport />} />
          <Route path="review" element={<ReviewQueue />} />
          <Route path="users" element={<Users />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
      {!isAuth && !isPlay && !isAdmin && !isLive && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Shell />
      </BrowserRouter>
    </AuthProvider>
  );
}
