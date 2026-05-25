import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { ChatBox } from '../ChatBox';
import { SalePopup } from '../SalePopup';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function MainLayout() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;

    const targetId = decodeURIComponent(location.hash.slice(1));
    const timer = window.setTimeout(() => {
      const target = document.getElementById(targetId);
      if (!target) return;

      const navbarOffset = 88;
      const top = target.getBoundingClientRect().top + window.scrollY - navbarOffset;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [location.pathname, location.hash]);

  return (
    <>
      <Navbar />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
      <SalePopup />
      <ChatBox />
    </>
  );
}
