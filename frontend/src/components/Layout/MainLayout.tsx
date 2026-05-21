import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function MainLayout() {
  return (
    <>
      <Navbar />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
