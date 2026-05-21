import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './store/AuthContext';
import { ToastProvider } from './store/ToastContext';
import { WishlistProvider } from './store/WishlistContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/js/dist/carousel';
import 'bootstrap/js/dist/collapse';
import 'bootstrap/js/dist/dropdown';
import './styles/luxury.css';
import './styles/app.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <AuthProvider>
          <WishlistProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </WishlistProvider>
        </AuthProvider>
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);
