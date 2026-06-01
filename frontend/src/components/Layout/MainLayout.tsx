import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { ChatBox } from '../ChatBox';
import { SalePopup } from '../SalePopup';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function MainLayout() {
  const location = useLocation();
  const isHomePage = location.pathname === '/' || location.pathname === '/home';

  useEffect(() => {
    if (!location.hash) return;

    const targetId = decodeURIComponent(location.hash.slice(1));
    let userMovedPage = false;
    const timers: number[] = [];
    const stopCorrections = () => {
      userMovedPage = true;
    };
    const scrollToTarget = (behavior: ScrollBehavior) => {
      if (userMovedPage) return;

      const target = document.getElementById(targetId);
      if (!target) return;

      const navbarOffset = 88;
      const top = target.getBoundingClientRect().top + window.scrollY - navbarOffset;
      window.scrollTo({ top: Math.max(0, top), behavior });
    };

    [120, 560, 1200].forEach((delay, index) => {
      timers.push(window.setTimeout(() => scrollToTarget(index === 0 ? 'smooth' : 'auto'), delay));
    });

    window.addEventListener('wheel', stopCorrections, { passive: true });
    window.addEventListener('touchstart', stopCorrections, { passive: true });

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener('wheel', stopCorrections);
      window.removeEventListener('touchstart', stopCorrections);
    };
  }, [location.pathname, location.hash]);

  return (
    <>
      <Navbar />
      <main className={`app-main ${isHomePage ? 'app-main-home' : ''}`}>
        <Outlet />
      </main>
      <Footer />
      <SalePopup />
      <ChatBox />
    </>
  );
}
