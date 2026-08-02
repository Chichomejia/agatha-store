import React, { useState } from 'react';
import { Search, ShoppingBag, X, Plus, Minus, Send, CheckCircle2 } from 'lucide-react';
import type { Product, SaleItem } from '../types';
import { dbSales, dbClients, formatCOP } from '../services/db';

interface CatalogViewProps {
  products: Product[];
  cart: { [productId: string]: number };
  addToCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  products,
  cart,
  addToCart,
  updateCartQty,
  clearCart,
  isCartOpen,
  setIsCartOpen
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Checkout states
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState('');

  // Filtrar productos activos y por búsqueda/categoría
  const activeProducts = products.filter(p => p.isActive);
  const categories = ['Todos', ...Array.from(new Set(activeProducts.map(p => p.category)))];

  // Filtrar productos
  const filteredProducts = activeProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calcular totales del carrito
  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const product = products.find(p => p.id === id);
    return { product, quantity: qty };
  }).filter(item => item.product !== undefined) as { product: Product; quantity: number }[];

  const cartTotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  // Procesar Checkout
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    // 1. Crear o buscar cliente
    const client = await dbClients.findOrCreateByNameAndPhone(clientName, clientPhone);

    // 2. Armar items de venta
    const saleItems: SaleItem[] = cartItems.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      priceAtSale: item.product.price,
      costAtSale: item.product.cost
    }));

    // Calcular ganancia
    const totalCost = cartItems.reduce((acc, item) => acc + (item.product.cost * item.quantity), 0);
    const profit = cartTotal - totalCost;

    // 3. Registrar venta
    const newSale = {
      id: 'sale_' + Math.random().toString(36).substr(2, 9),
      clientId: client.id,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      items: saleItems,
      total: cartTotal,
      profit,
      date: new Date().toISOString(),
      status: 'pending' as const,
      notes: `${orderNotes} | Entregar en: ${deliveryAddress}`.trim()
    };

    await dbSales.save(newSale);

    // 4. Generar mensaje de WhatsApp
    let message = `*✨ NUEVA ORDEN - AGATHA STORE ✨*\n\n`;
    message += `*Cliente:* ${clientName}\n`;
    message += `*Teléfono:* ${clientPhone}\n`;
    if (deliveryAddress) {
      message += `*Dirección:* ${deliveryAddress}\n`;
    }
    message += `\n*Detalle del Pedido:*\n`;
    
    cartItems.forEach(item => {
      message += `- ${item.quantity}x ${item.product.name} (_${formatCOP(item.product.price)} c/u_)\n`;
    });
    
    message += `\n*Total a Pagar:* ${formatCOP(cartTotal)}\n`;
    if (orderNotes) {
      message += `\n*Notas:* ${orderNotes}\n`;
    }
    message += `\n¡Hola! He realizado mi pedido desde el catálogo. Quedo atenta para coordinar la entrega. 💖`;

    const encodedMessage = encodeURIComponent(message);
    // Cambiar por el teléfono del administrador (aquí usamos un placeholder que redirige al chat)
    const phoneNo = "+573166483864"; // Dejar vacío para abrir chat con el remitente o rellenar con el teléfono de la novia.
    const waUrl = `https://wa.me/${phoneNo}?text=${encodedMessage}`;
    
    setWhatsappLink(waUrl);
    setOrderPlaced(true);
    
    // Abrir WhatsApp en pestaña nueva
    window.open(waUrl, '_blank');

    // Limpiar carrito y formulario
    clearCart();
    setClientName('');
    setClientPhone('');
    setDeliveryAddress('');
    setOrderNotes('');
  };

  return (
    <div className="catalog-view">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <span className="hero-badge">Colección de Lujo</span>
          <h2 className="hero-title">Realza tu Belleza Natural</h2>
          <p className="hero-text">Explora nuestra selecta línea de maquillaje y cuidado de la piel. Calidad premium formulada para resaltar tu brillo interior.</p>
        </div>
      </section>

      {/* Control Bar (Search & Categories) */}
      <div className="control-bar-container">
        <div className="search-bar">
          <Search className="search-icon" size={20} />
          <input 
            type="text" 
            placeholder="Buscar productos (labiales, sueros, paletas...)" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="categories-list">
          {categories.map(category => (
            <button
              key={category}
              className={`category-chip ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <main className="products-grid-container">
        {filteredProducts.length === 0 ? (
          <div className="empty-results">
            <p>No encontramos productos que coincidan con tu búsqueda.</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map(product => {
              const isInCart = (cart[product.id] || 0) > 0;
              const isOutOfStock = product.stock <= 0;

              return (
                <div key={product.id} className="product-card">
                  <div className="product-card-image" onClick={() => setSelectedProduct(product)}>
                    <img src={product.imageUrl} alt={product.name} />
                    <div className="product-category-tag">{product.category}</div>
                    {isOutOfStock && <div className="out-of-stock-overlay">Agotado</div>}
                  </div>
                  
                  <div className="product-card-details">
                    <h3 className="product-card-title" onClick={() => setSelectedProduct(product)}>
                      {product.name}
                    </h3>
                    <p className="product-card-desc">{product.description}</p>
                    
                    <div className="product-card-footer">
                      <span className="product-card-price">{formatCOP(product.price)}</span>
                      {isOutOfStock ? (
                        <button className="add-to-cart-btn disabled" disabled>Agotado</button>
                      ) : (
                        <button 
                          className={`add-to-cart-btn ${isInCart ? 'in-cart' : ''}`}
                          onClick={() => addToCart(product.id)}
                        >
                          {isInCart ? `Agregar otro (${cart[product.id]})` : 'Añadir al Carrito'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="modal-backdrop" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content product-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedProduct(null)}>
              <X size={24} />
            </button>
            <div className="modal-grid">
              <div className="modal-image-container">
                <img src={selectedProduct.imageUrl} alt={selectedProduct.name} />
              </div>
              <div className="modal-info-container">
                <span className="modal-category">{selectedProduct.category}</span>
                <h2 className="modal-title">{selectedProduct.name}</h2>
                <p className="modal-price">{formatCOP(selectedProduct.price)}</p>
                <div className="modal-divider"></div>
                <p className="modal-description">{selectedProduct.description}</p>
                <div className="modal-stock-status">
                  Disponibles: <strong>{selectedProduct.stock} unidades</strong>
                </div>
                <div className="modal-actions">
                  {selectedProduct.stock <= 0 ? (
                    <button className="btn btn-disabled" disabled style={{ width: '100%' }}>Agotado</button>
                  ) : (
                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%' }}
                      onClick={() => {
                        addToCart(selectedProduct.id);
                        setSelectedProduct(null);
                        setIsCartOpen(true);
                      }}
                    >
                      Añadir al Carrito - {formatCOP(selectedProduct.price)}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Sidebar Panel */}
      <div className={`cart-sidebar-backdrop ${isCartOpen ? 'open' : ''}`} onClick={() => setIsCartOpen(false)}>
        <div className="cart-sidebar" onClick={(e) => e.stopPropagation()}>
          <div className="cart-sidebar-header">
            <div className="cart-header-title">
              <ShoppingBag size={22} className="purple-icon" />
              <h3>Tu Carrito</h3>
            </div>
            <button className="cart-close-btn" onClick={() => setIsCartOpen(false)}>
              <X size={24} />
            </button>
          </div>

          <div className="cart-sidebar-content">
            {orderPlaced ? (
              <div className="order-success-screen">
                <CheckCircle2 size={64} className="success-icon" />
                <h3>¡Pedido Enviado!</h3>
                <p>Hemos registrado tu pedido en nuestra base de datos local y abierto WhatsApp para enviárselo a la vendedora.</p>
                <p className="subtext">Si la pestaña de WhatsApp no se abrió, puedes usar el botón de abajo:</p>
                <a href={whatsappLink} target="_blank" rel="noreferrer" className="btn btn-primary whatsapp-resend-btn">
                  <Send size={18} /> Reabrir WhatsApp
                </a>
                <button 
                  className="btn btn-outline" 
                  onClick={() => {
                    setOrderPlaced(false);
                    setIsCartOpen(false);
                  }}
                  style={{ marginTop: '1rem', width: '100%' }}
                >
                  Seguir Comprando
                </button>
              </div>
            ) : cartItems.length === 0 ? (
              <div className="empty-cart-message">
                <ShoppingBag size={48} className="muted-icon" />
                <p>Tu carrito está vacío.</p>
                <p className="subtext">Explora nuestro catálogo y añade algunos productos de belleza.</p>
              </div>
            ) : (
              <>
                {/* List of Cart Items */}
                <div className="cart-items-list">
                  {cartItems.map(item => (
                    <div key={item.product.id} className="cart-item">
                      <img src={item.product.imageUrl} alt={item.product.name} className="cart-item-thumb" />
                      <div className="cart-item-info">
                        <h4>{item.product.name}</h4>
                        <p className="cart-item-price">{formatCOP(item.product.price)} c/u</p>
                        <div className="cart-item-qty-controls">
                          <button onClick={() => updateCartQty(item.product.id, item.quantity - 1)}>
                            <Minus size={14} />
                          </button>
                          <span>{item.quantity}</span>
                          <button 
                            onClick={() => addToCart(item.product.id)}
                            disabled={item.quantity >= item.product.stock}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="cart-item-subtotal">
                        {formatCOP(item.product.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal */}
                <div className="cart-summary-total">
                  <span>Total Pedido:</span>
                  <span className="total-amount">{formatCOP(cartTotal)}</span>
                </div>

                <div className="cart-divider"></div>

                {/* Order Form */}
                <form className="cart-checkout-form" onSubmit={handleCheckout}>
                  <h4>Datos de Entrega</h4>
                  <div className="form-group">
                    <label htmlFor="name">Nombre Completo *</label>
                    <input 
                      type="text" 
                      id="name" 
                      required 
                      placeholder="Ej. Sofía Rodríguez"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Número de WhatsApp *</label>
                    <input 
                      type="tel" 
                      id="phone" 
                      required 
                      placeholder="Ej. +57 300 123 4567"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="address">Dirección de Entrega (Opcional)</label>
                    <input 
                      type="text" 
                      id="address" 
                      placeholder="Calle, Número, Colonia, Ciudad"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="notes">Notas o Indicaciones (Opcional)</label>
                    <textarea 
                      id="notes" 
                      rows={2} 
                      placeholder="Ej. Envoltura de regalo, color específico..."
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary checkout-submit-btn">
                    <Send size={18} /> Confirmar Pedido vía WhatsApp
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
