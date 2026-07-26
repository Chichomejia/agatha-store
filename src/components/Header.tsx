import React from 'react';
import { ShoppingBag } from 'lucide-react';

interface HeaderProps {
  currentView: 'catalog' | 'admin';
  setView: (view: 'catalog' | 'admin') => void;
  cartCount: number;
  onOpenCart: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, setView, cartCount, onOpenCart }) => {
  return (
    <header className="main-header">
      <div className="header-container">
        <div className="header-brand" onClick={() => setView('catalog')}>
          <div className="brand-logo">
            <img src="/logo.jpg" alt="Agatha Store Logo" className="logo-img" />
          </div>
          <div>
            <h1 className="brand-title">Agatha Store</h1>
            <p className="brand-subtitle">BEAUTY BOUTIQUE</p>
          </div>
        </div>

        <nav className="header-nav">
          {currentView === 'admin' ? (
            <button 
              className="nav-btn active"
              onClick={() => setView('catalog')}
            >
              <ShoppingBag size={18} />
              <span>Ver Catálogo (Salir)</span>
            </button>
          ) : (
            <button 
              className="nav-btn active"
              onClick={() => setView('catalog')}
            >
              <ShoppingBag size={18} />
              <span>Catálogo</span>
            </button>
          )}

          {currentView === 'catalog' && (
            <button className="cart-badge-btn" onClick={onOpenCart}>
              <div className="cart-icon-container">
                <ShoppingBag size={20} />
                {cartCount > 0 && <span className="cart-badge-count">{cartCount}</span>}
              </div>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
