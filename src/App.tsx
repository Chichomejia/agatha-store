import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CatalogView } from './components/CatalogView';
import { AdminView } from './components/AdminView';
import { dbProducts, isFirebaseConfigured } from './services/db';
import { Lock, Unlock, X, Key } from 'lucide-react';
import type { Product } from './types';

function App() {
  const [currentView, setView] = useState<'catalog' | 'admin'>('catalog');
  const [cart, setCart] = useState<{ [productId: string]: number }>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Check authentication on load
  useEffect(() => {
    const auth = sessionStorage.getItem('agatha_admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Cargar productos
  const loadProducts = async () => {
    try {
      const prods = await dbProducts.getAll();
      setProducts(prods);
    } catch (e) {
      console.error('Error cargando productos:', e);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [currentView]);

  // Cargar carrito persistido
  useEffect(() => {
    const savedCart = localStorage.getItem('agatha_beauty_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveCartToStorage = (newCart: { [productId: string]: number }) => {
    setCart(newCart);
    localStorage.setItem('agatha_beauty_cart', JSON.stringify(newCart));
  };

  // Agregar al carrito
  const addToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const currentQty = cart[productId] || 0;
    if (currentQty >= product.stock) {
      alert(`Lo sentimos, solo quedan ${product.stock} unidades en inventario.`);
      return;
    }

    const updated = {
      ...cart,
      [productId]: currentQty + 1
    };
    saveCartToStorage(updated);
  };

  // Actualizar cantidad directa
  const updateCartQty = (productId: string, qty: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const updated = { ...cart };
    if (qty <= 0) {
      delete updated[productId];
    } else {
      if (qty > product.stock) {
        alert(`Lo sentimos, solo quedan ${product.stock} unidades en inventario.`);
        updated[productId] = product.stock;
      } else {
        updated[productId] = qty;
      }
    }
    saveCartToStorage(updated);
  };

  // Limpiar carrito
  const clearCart = () => {
    saveCartToStorage({});
  };

  // Click en el icono de administrador
  const handleAdminClick = () => {
    if (isAuthenticated) {
      // Si ya está autenticado, ir a la vista de administrador
      setView(currentView === 'catalog' ? 'admin' : 'catalog');
    } else {
      // Si no, abrir modal de login
      setPasswordInput('');
      setLoginError('');
      setIsLoginModalOpen(true);
    }
  };

  // Enviar formulario de login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'agatha123') {
      setIsAuthenticated(true);
      sessionStorage.setItem('agatha_admin_auth', 'true');
      setIsLoginModalOpen(false);
      setView('admin');
    } else {
      setLoginError('Contraseña incorrecta. Inténtalo de nuevo.');
    }
  };

  // Cerrar sesión
  const handleLogout = () => {
    if (window.confirm('¿Quieres cerrar sesión como administrador?')) {
      setIsAuthenticated(false);
      sessionStorage.removeItem('agatha_admin_auth');
      setView('catalog');
    }
  };

  // Total de items en el carrito
  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="app-container">
      {!isFirebaseConfigured && (
        <div className="local-mode-banner">
          <span>⚠️ <strong>Modo Local (Sin Nube):</strong> Datos guardados solo en este navegador. Configura Firebase en <code>.env</code> para sincronizar con el celular de tu novia y poder subir fotos de productos.</span>
        </div>
      )}
      <Header 
        currentView={currentView} 
        setView={setView} 
        cartCount={cartCount} 
        onOpenCart={() => setIsCartOpen(true)} 
      />

      <main className="main-content">
        {currentView === 'catalog' ? (
          <CatalogView 
            products={products}
            cart={cart}
            addToCart={addToCart}
            updateCartQty={updateCartQty}
            clearCart={clearCart}
            isCartOpen={isCartOpen}
            setIsCartOpen={setIsCartOpen}
          />
        ) : (
          <AdminView />
        )}
      </main>

      {/* Footer con acceso oculto */}
      <footer className="main-footer">
        <div className="footer-container">
          <p>© 2026 Agatha Store. Todos los derechos reservados. 💖</p>
          <div className="footer-actions">
            {isAuthenticated ? (
              <div className="admin-status-bar">
                <span className="admin-badge">Admin Activo</span>
                <button className="footer-admin-btn logout" onClick={handleLogout} title="Cerrar Sesión Administrador">
                  <Unlock size={14} />
                </button>
              </div>
            ) : (
              <button className="footer-admin-btn" onClick={handleAdminClick} title="Acceso Administrativo">
                <Lock size={14} />
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Modal de Acceso Administrativo */}
      {isLoginModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsLoginModalOpen(false)}>
          <div className="modal-content login-form-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsLoginModalOpen(false)}>
              <X size={24} />
            </button>
            <div className="login-modal-header">
              <Key className="login-key-icon" size={32} />
              <h3>Acceso Administrativo</h3>
              <p>Introduce la contraseña para ingresar al panel de control.</p>
            </div>
            
            <form onSubmit={handleLoginSubmit} className="login-modal-form">
              <div className="form-group">
                <label htmlFor="admin-password">Contraseña</label>
                <input 
                  type="password" 
                  id="admin-password" 
                  required 
                  autoFocus
                  placeholder="Escribe la contraseña..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                />
              </div>

              {loginError && <p className="login-error-msg">{loginError}</p>}

              <div className="modal-actions-form">
                <button type="button" className="btn btn-outline" onClick={() => setIsLoginModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Ingresar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
