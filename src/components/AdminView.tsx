import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Package, 
  ShoppingBag, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  X, 
  Search, 
  ArrowUpRight,
  Printer
} from 'lucide-react';
import type { Product, Client, Sale } from '../types';
import { dbProducts, dbClients, dbSales, formatCOP } from '../services/db';

export const AdminView: React.FC = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'sales' | 'clients'>('dashboard');

  // Core Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [salesFilter, setSalesFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');

  // Modales
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [selectedSaleDetail, setSelectedSaleDetail] = useState<Sale | null>(null);

  // Form Product States
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodCustomCategory, setProdCustomCategory] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCost, setProdCost] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodIsActive, setProdIsActive] = useState(true);

  // Form Client States
  const [cliName, setCliName] = useState('');
  const [cliPhone, setCliPhone] = useState('');
  const [cliEmail, setCliEmail] = useState('');
  const [cliAddress, setCliAddress] = useState('');
  const [cliNotes, setCliNotes] = useState('');

  // Image upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Cargar datos
  const loadAllData = async () => {
    try {
      const [prods, sls, clis] = await Promise.all([
        dbProducts.getAll(),
        dbSales.getAll(),
        dbClients.getAll()
      ]);
      setProducts(prods);
      setSales(sls);
      setClients(clis);
    } catch (err) {
      console.error('Error cargando datos de administración:', err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Categorías de productos
  const categoriesList = Array.from(new Set(products.map(p => p.category)));

  // --- HANDLERS PRODUCTOS ---
  const openAddProductModal = () => {
    setEditingProduct(null);
    setProdName('');
    setProdCategory(categoriesList[0] || 'Maquillaje');
    setProdCustomCategory('');
    setProdDescription('');
    setProdPrice('');
    setProdCost('');
    setProdStock('');
    setProdImageUrl('');
    setProdIsActive(true);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setProdName(product.name);
    setProdCategory(product.category);
    setProdCustomCategory('');
    setProdDescription(product.description);
    setProdPrice(product.price.toString());
    setProdCost(product.cost.toString());
    setProdStock(product.stock.toString());
    setProdImageUrl(product.imageUrl);
    setProdIsActive(product.isActive);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = prodCategory === 'new' ? prodCustomCategory.trim() : prodCategory;
    
    if (!prodName || !finalCategory || !prodPrice || !prodCost || !prodStock) {
      alert('Por favor rellena todos los campos obligatorios');
      return;
    }

    const defaultImages: { [key: string]: string } = {
      'Maquillaje': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop&q=60',
      'Cuidado de la Piel': 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=500&auto=format&fit=crop&q=60',
      'Fragancias': 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&auto=format&fit=crop&q=60',
      'Cabello': 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500&auto=format&fit=crop&q=60'
    };

    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : 'prod_' + Math.random().toString(36).substr(2, 9),
      name: prodName.trim(),
      category: finalCategory,
      description: prodDescription.trim(),
      price: parseFloat(prodPrice),
      cost: parseFloat(prodCost),
      stock: parseInt(prodStock),
      imageUrl: prodImageUrl.trim() || defaultImages[finalCategory] || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop&q=60',
      isActive: prodIsActive
    };

    await dbProducts.save(newProduct);
    await loadAllData();
    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      await dbProducts.delete(id);
      await loadAllData();
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const imageUrl = await dbProducts.uploadImage(file, (progress) => {
        setUploadProgress(progress);
      });
      setProdImageUrl(imageUrl);
    } catch (err: any) {
      console.error(err);
      alert('Error al subir la imagen: ' + (err.message || err));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // --- HANDLERS CLIENTES ---
  const openAddClientModal = () => {
    setEditingClient(null);
    setCliName('');
    setCliPhone('');
    setCliEmail('');
    setCliAddress('');
    setCliNotes('');
    setIsClientModalOpen(true);
  };

  const openEditClientModal = (client: Client) => {
    setEditingClient(client);
    setCliName(client.name);
    setCliPhone(client.phone);
    setCliEmail(client.email || '');
    setCliAddress(client.address || '');
    setCliNotes(client.notes || '');
    setIsClientModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliName || !cliPhone) {
      alert('Nombre y Teléfono son obligatorios');
      return;
    }

    const newClient: Client = {
      id: editingClient ? editingClient.id : 'cli_' + Math.random().toString(36).substr(2, 9),
      name: cliName.trim(),
      phone: cliPhone.trim(),
      email: cliEmail.trim() || undefined,
      address: cliAddress.trim() || undefined,
      notes: cliNotes.trim() || undefined,
      createdAt: editingClient ? editingClient.createdAt : new Date().toISOString()
    };

    await dbClients.save(newClient);
    await loadAllData();
    setIsClientModalOpen(false);
  };

  // --- HANDLERS VENTAS ---
  const handleUpdateSaleStatus = async (saleId: string, status: 'pending' | 'completed' | 'cancelled') => {
    await dbSales.updateStatus(saleId, status);
    await loadAllData();
    // Actualizar modal si está abierto
    if (selectedSaleDetail && selectedSaleDetail.id === saleId) {
      const updated = (await dbSales.getAll()).find(s => s.id === saleId);
      if (updated) setSelectedSaleDetail(updated);
    }
  };

  // --- CÁLCULO ESTADÍSTICAS (DASHBOARD) ---
  const completedSales = sales.filter(s => s.status === 'completed');
  
  const totalRevenue = completedSales.reduce((acc, s) => acc + s.total, 0);
  const pendingRevenue = sales.filter(s => s.status === 'pending').reduce((acc, s) => acc + s.total, 0);
  const totalProfit = completedSales.reduce((acc, s) => acc + s.profit, 0);
  const totalCost = completedSales.reduce((acc, s) => {
    const saleCost = s.items.reduce((sum, item) => sum + (item.costAtSale * item.quantity), 0);
    return acc + saleCost;
  }, 0);

  // Clientes totales con compras
  const getClientStats = (clientId: string) => {
    const clientSales = sales.filter(s => s.clientId === clientId && s.status !== 'cancelled');
    const spent = clientSales.reduce((acc, s) => acc + s.total, 0);
    return {
      count: clientSales.length,
      spent
    };
  };

  // Top productos vendidos
  const getTopProducts = () => {
    const counts: { [name: string]: { qty: number; total: number } } = {};
    sales.filter(s => s.status === 'completed').forEach(sale => {
      sale.items.forEach(item => {
        if (!counts[item.productName]) {
          counts[item.productName] = { qty: 0, total: 0 };
        }
        counts[item.productName].qty += item.quantity;
        counts[item.productName].total += item.priceAtSale * item.quantity;
      });
    });
    return Object.entries(counts)
      .map(([name, stat]) => ({ name, qty: stat.qty, total: stat.total }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  };

  // Filtrado de tablas
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSales = sales.filter(s => {
    const matchesSearch = s.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.clientPhone.includes(searchQuery);
    const matchesFilter = salesFilter === 'all' || s.status === salesFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

  const handlePrintInvoice = (sale: Sale) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    const itemsHtml = sale.items.map(item => `
      <tr>
        <td>${item.productName}</td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">${formatCOP(item.priceAtSale)}</td>
        <td style="text-align: right;">${formatCOP(item.priceAtSale * item.quantity)}</td>
      </tr>
    `).join('');

    const totalItems = sale.items.reduce((s, i) => s + i.quantity, 0);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Factura ${sale.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
            body {
              font-family: 'Outfit', 'Inter', sans-serif;
              color: #333;
              margin: 0;
              padding: 20px;
              font-size: 14px;
              line-height: 1.5;
            }
            .invoice-box {
              max-width: 800px;
              margin: auto;
              border: 1px solid #eee;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
              padding: 30px;
              border-radius: 8px;
              background: #fff;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #8b5cf6;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .logo {
              font-size: 28px;
              font-weight: 700;
              color: #8b5cf6;
              margin: 0;
            }
            .logo span {
              color: #ec4899;
            }
            .store-info {
              text-align: right;
              font-size: 12px;
              color: #666;
            }
            .details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 30px;
            }
            .panel {
              background: #f9fafb;
              padding: 15px;
              border-radius: 6px;
              border: 1px solid #f3f4f6;
            }
            .panel h4 {
              margin: 0 0 10px 0;
              color: #8b5cf6;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .panel p {
              margin: 4px 0;
              font-size: 13px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th {
              background: #f3f4f6;
              color: #4b5563;
              font-weight: 600;
              text-align: left;
              padding: 10px;
              font-size: 13px;
              border-bottom: 1px solid #e5e7eb;
            }
            td {
              padding: 12px 10px;
              border-bottom: 1px solid #f3f4f6;
              font-size: 13px;
            }
            .total-row td {
              border-top: 2px solid #e5e7eb;
              border-bottom: none;
              font-weight: 700;
              font-size: 15px;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              font-size: 12px;
              color: #9ca3af;
              border-top: 1px solid #f3f4f6;
              padding-top: 20px;
            }
            @media print {
              body {
                padding: 0;
                background: none;
              }
              .invoice-box {
                border: none;
                box-shadow: none;
                padding: 0;
                max-width: 100%;
              }
              @page {
                margin: 1.5cm;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <div>
                <h1 class="logo">Agatha <span>Store</span></h1>
                <p style="margin: 5px 0 0 0; font-size: 13px; color: #666; font-style: italic;">Maquillaje & Cuidado de la Piel 💖</p>
              </div>
              <div class="store-info">
                <p style="font-weight: 600; font-size: 14px; margin: 0 0 5px 0; color: #333;">FACTURA DE VENTA</p>
                <p style="margin: 2px 0;"><strong>No:</strong> ${sale.id}</p>
                <p style="margin: 2px 0;"><strong>Fecha:</strong> ${new Date(sale.date).toLocaleString('es-ES')}</p>
              </div>
            </div>

            <div class="details-grid">
              <div class="panel">
                <h4>Cliente</h4>
                <p><strong>Nombre:</strong> ${sale.clientName}</p>
                <p><strong>Teléfono:</strong> ${sale.clientPhone}</p>
              </div>
              <div class="panel">
                <h4>Detalles de Entrega</h4>
                <p><strong>Notas:</strong> ${sale.notes || 'Ninguna'}</p>
                <p><strong>Estado del Pedido:</strong> ${sale.status === 'completed' ? 'Cobrado' : sale.status === 'pending' ? 'Pendiente' : 'Cancelado'}</p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style="text-align: center; width: 80px;">Cant.</th>
                  <th style="text-align: right; width: 120px;">Precio Unit.</th>
                  <th style="text-align: right; width: 120px;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
                <tr class="total-row">
                  <td colspan="2">Total Artículos: ${totalItems}</td>
                  <td style="text-align: right;">Total General:</td>
                  <td style="text-align: right; color: #8b5cf6;">${formatCOP(sale.total)}</td>
                </tr>
              </tbody>
            </table>

            <div class="footer">
              <p>¡Gracias por tu compra! Tu apoyo significa el mundo para nosotros. 💖</p>
              <p>Si tienes alguna pregunta sobre esta factura, contáctanos por WhatsApp.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    doc.open();
    doc.write(html);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };

  return (
    <div className="admin-view">
      {/* Sub navigation tabs */}
      <div className="admin-tabs">
        <button 
          className={`admin-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => { setActiveTab('dashboard'); setSearchQuery(''); }}
        >
          <TrendingUp size={18} />
          <span>Resumen</span>
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => { setActiveTab('products'); setSearchQuery(''); }}
        >
          <Package size={18} />
          <span>Inventario</span>
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => { setActiveTab('sales'); setSearchQuery(''); }}
        >
          <ShoppingBag size={18} />
          <span>Ventas</span>
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'clients' ? 'active' : ''}`}
          onClick={() => { setActiveTab('clients'); setSearchQuery(''); }}
        >
          <Users size={18} />
          <span>Clientes</span>
        </button>
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div className="dashboard-content animate-fade">
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper purple-bg">
                <TrendingUp size={24} className="white-icon" />
              </div>
              <div className="stat-info">
                <h3>Ventas Completadas</h3>
                <p className="stat-value">{formatCOP(totalRevenue)}</p>
                <span className="stat-badge-pending">Pendiente de cobro: {formatCOP(pendingRevenue)}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper green-bg">
                <ArrowUpRight size={24} className="white-icon" />
              </div>
              <div className="stat-info">
                <h3>Ganancia Neta (Cerradas)</h3>
                <p className="stat-value text-green">{formatCOP(totalProfit)}</p>
                <span className="stat-subtext">Costo total productos: {formatCOP(totalCost)}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper blue-bg">
                <ShoppingBag size={24} className="white-icon" />
              </div>
              <div className="stat-info">
                <h3>Pedidos Totales</h3>
                <p className="stat-value">{sales.length}</p>
                <span className="stat-subtext">Completados: {completedSales.length} | Pendientes: {sales.filter(s => s.status === 'pending').length}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper gold-bg">
                <Users size={24} className="white-icon" />
              </div>
              <div className="stat-info">
                <h3>Clientes Totales</h3>
                <p className="stat-value">{clients.length}</p>
                <span className="stat-subtext">Base de datos activa</span>
              </div>
            </div>
          </div>

          <div className="dashboard-charts-grid">
            {/* Top Products */}
            <div className="dashboard-card card-half">
              <h3>Productos Más Vendidos</h3>
              <div className="top-products-list">
                {getTopProducts().length === 0 ? (
                  <p className="empty-subtext">Aún no hay ventas completadas para registrar productos más vendidos.</p>
                ) : (
                  getTopProducts().map((prod, index) => (
                    <div key={index} className="top-product-item">
                      <div className="top-product-details">
                        <span className="top-product-index">#{index + 1}</span>
                        <span className="top-product-name">{prod.name}</span>
                      </div>
                      <div className="top-product-stats">
                        <span className="top-product-qty">{prod.qty} uds</span>
                        <span className="top-product-total">{formatCOP(prod.total)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recents Sales */}
            <div className="dashboard-card card-half">
              <h3>Últimos Pedidos</h3>
              <div className="recent-sales-list">
                {sales.length === 0 ? (
                  <p className="empty-subtext">No hay pedidos registrados.</p>
                ) : (
                  sales.slice().reverse().slice(0, 5).map(sale => (
                    <div key={sale.id} className="recent-sale-item">
                      <div className="recent-sale-left">
                        <h4>{sale.clientName}</h4>
                        <p>{new Date(sale.date).toLocaleDateString('es-ES')} - {sale.items.length} prod.</p>
                      </div>
                      <div className="recent-sale-right">
                        <span className="recent-sale-price">{formatCOP(sale.total)}</span>
                        <span className={`status-badge status-${sale.status}`}>
                          {sale.status === 'completed' ? 'Cobrado' : sale.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div className="admin-tab-content animate-fade">
          <div className="action-row">
            <div className="search-bar inline-search">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nombre o categoría..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={openAddProductModal}>
              <Plus size={18} /> Nuevo Producto
            </button>
          </div>

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Costo</th>
                  <th>Precio Venta</th>
                  <th>Ganancia c/u</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center">No se encontraron productos.</td>
                  </tr>
                ) : (
                  filteredProducts.map(prod => (
                    <tr key={prod.id}>
                      <td>
                        <img src={prod.imageUrl} alt={prod.name} className="table-img" />
                      </td>
                      <td className="font-semibold">{prod.name}</td>
                      <td>{prod.category}</td>
                      <td>{formatCOP(prod.cost)}</td>
                      <td className="font-semibold">{formatCOP(prod.price)}</td>
                      <td className="text-green font-semibold">{formatCOP(prod.price - prod.cost)}</td>
                      <td>
                        <span className={`stock-indicator ${prod.stock <= 3 ? 'low-stock' : ''}`}>
                          {prod.stock} uds
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${prod.isActive ? 'active' : 'inactive'}`}>
                          {prod.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button className="btn-icon" onClick={() => openEditProductModal(prod)}>
                            <Edit size={16} />
                          </button>
                          <button className="btn-icon delete" onClick={() => handleDeleteProduct(prod.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SALES TAB */}
      {activeTab === 'sales' && (
        <div className="admin-tab-content animate-fade">
          <div className="action-row">
            <div className="search-bar inline-search">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Buscar por cliente o teléfono..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-buttons">
              <button className={`chip ${salesFilter === 'all' ? 'active' : ''}`} onClick={() => setSalesFilter('all')}>Todas</button>
              <button className={`chip ${salesFilter === 'pending' ? 'active' : ''}`} onClick={() => setSalesFilter('pending')}>Pendientes</button>
              <button className={`chip ${salesFilter === 'completed' ? 'active' : ''}`} onClick={() => setSalesFilter('completed')}>Completadas</button>
              <button className={`chip ${salesFilter === 'cancelled' ? 'active' : ''}`} onClick={() => setSalesFilter('cancelled')}>Canceladas</button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Artículos</th>
                  <th>Total</th>
                  <th>Ganancia</th>
                  <th>Estado</th>
                  <th>Cambiar Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center">No se encontraron ventas.</td>
                  </tr>
                ) : (
                  filteredSales.slice().reverse().map(sale => (
                    <tr key={sale.id}>
                      <td>{new Date(sale.date).toLocaleDateString('es-ES')}</td>
                      <td className="font-semibold">{sale.clientName}</td>
                      <td>{sale.clientPhone}</td>
                      <td>{sale.items.reduce((acc, i) => acc + i.quantity, 0)} items</td>
                      <td className="font-semibold">{formatCOP(sale.total)}</td>
                      <td className="text-green font-semibold">{formatCOP(sale.profit)}</td>
                      <td>
                        <span className={`status-badge status-${sale.status}`}>
                          {sale.status === 'completed' ? 'Cobrado' : sale.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                        </span>
                      </td>
                      <td>
                        <select 
                          className="table-select"
                          value={sale.status}
                          onChange={(e) => handleUpdateSaleStatus(sale.id, e.target.value as any)}
                        >
                          <option value="pending">Pendiente</option>
                          <option value="completed">Cobrado (Completar)</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                      </td>
                      <td>
                        <button className="btn-icon" onClick={() => setSelectedSaleDetail(sale)}>
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CLIENTS TAB */}
      {activeTab === 'clients' && (
        <div className="admin-tab-content animate-fade">
          <div className="action-row">
            <div className="search-bar inline-search">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Buscar cliente por nombre o teléfono..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={openAddClientModal}>
              <Plus size={18} /> Registrar Cliente
            </button>
          </div>

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Dirección</th>
                  <th>Compras Registradas</th>
                  <th>Total Gastado</th>
                  <th>Notas</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center">No se encontraron clientes.</td>
                  </tr>
                ) : (
                  filteredClients.map(cli => {
                    const stats = getClientStats(cli.id);
                    return (
                      <tr key={cli.id}>
                        <td className="font-semibold">{cli.name}</td>
                        <td>{cli.phone}</td>
                        <td>{cli.email || '-'}</td>
                        <td>{cli.address || '-'}</td>
                        <td className="text-center font-semibold">{stats.count} pedidos</td>
                        <td className="font-semibold">{formatCOP(stats.spent)}</td>
                        <td className="notes-cell">{cli.notes || '-'}</td>
                        <td>
                          <div className="table-actions">
                            <button className="btn-icon" onClick={() => openEditClientModal(cli)}>
                              <Edit size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRODUCT ADD / EDIT MODAL */}
      {isProductModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsProductModalOpen(false)}>
          <div className="modal-content admin-form-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsProductModalOpen(false)}>
              <X size={24} />
            </button>
            <h3>{editingProduct ? 'Editar Producto' : 'Añadir Nuevo Producto'}</h3>
            <form onSubmit={handleSaveProduct} className="admin-modal-form">
              <div className="form-group">
                <label>Nombre del Producto *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ej. Labial Mate Nude" 
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Categoría *</label>
                  <select 
                    value={prodCategory} 
                    onChange={(e) => setProdCategory(e.target.value)}
                  >
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="new">+ Crear Nueva Categoría</option>
                  </select>
                </div>
                {prodCategory === 'new' && (
                  <div className="form-group">
                    <label>Nombre Nueva Categoría *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Ej. Cuidado Corporal"
                      value={prodCustomCategory}
                      onChange={(e) => setProdCustomCategory(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label>Costo (COP) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    placeholder="Ej. 32000" 
                    value={prodCost}
                    onChange={(e) => setProdCost(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Precio Venta (COP) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    placeholder="Ej. 65000" 
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Stock Inicial *</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="Ej. 15" 
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea 
                  rows={3} 
                  placeholder="Detalles sobre beneficios, aplicación..." 
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Foto del Producto</label>
                <div className="image-upload-container">
                  {prodImageUrl ? (
                    <div className="image-preview-wrapper">
                      <img src={prodImageUrl} alt="Vista previa del producto" />
                      <button 
                        type="button" 
                        className="btn-remove-image" 
                        onClick={() => setProdImageUrl('')}
                        title="Eliminar imagen"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <p className="help-text">Sin foto seleccionada. Puedes subir una desde tu celular o usar una imagen genérica por defecto.</p>
                  )}
                  
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageFileChange} 
                    disabled={isUploading}
                    className="upload-file-input"
                  />
                  
                  {isUploading && (
                    <div style={{ width: '100%' }}>
                      <span className="uploading-text">Subiendo foto: {uploadProgress}%</span>
                      <div className="upload-progress-container">
                        <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>O ingresa la URL de la Imagen (Opcional)</label>
                <input 
                  type="url" 
                  placeholder="https://ejemplo.com/imagen.jpg" 
                  value={prodImageUrl}
                  onChange={(e) => setProdImageUrl(e.target.value)}
                  disabled={isUploading}
                />
              </div>

              <div className="form-group-checkbox">
                <label className="checkbox-container">
                  <input 
                    type="checkbox" 
                    checked={prodIsActive} 
                    onChange={(e) => setProdIsActive(e.target.checked)}
                  />
                  <span className="checkbox-text">Producto Activo (Mostrar en Catálogo)</span>
                </label>
              </div>

              <div className="modal-actions-form">
                <button type="button" className="btn btn-outline" onClick={() => setIsProductModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Producto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLIENT ADD / EDIT MODAL */}
      {isClientModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsClientModalOpen(false)}>
          <div className="modal-content admin-form-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsClientModalOpen(false)}>
              <X size={24} />
            </button>
            <h3>{editingClient ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}</h3>
            <form onSubmit={handleSaveClient} className="admin-modal-form">
              <div className="form-group">
                <label>Nombre Completo *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ej. María Fernanda" 
                  value={cliName}
                  onChange={(e) => setCliName(e.target.value)}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Número de WhatsApp / Teléfono *</label>
                  <input 
                    type="tel" 
                    required 
                    placeholder="Ej. +52 55 9999 8888" 
                    value={cliPhone}
                    onChange={(e) => setCliPhone(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Email (Opcional)</label>
                  <input 
                    type="email" 
                    placeholder="ejemplo@correo.com" 
                    value={cliEmail}
                    onChange={(e) => setCliEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Dirección de Entrega Frecuente</label>
                <input 
                  type="text" 
                  placeholder="Calle, Número, Colonia, Ciudad" 
                  value={cliAddress}
                  onChange={(e) => setCliAddress(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Notas sobre el Cliente (Preferencias, tonos de piel, etc.)</label>
                <textarea 
                  rows={3} 
                  placeholder="Ej. Piel grasa, prefiere tonos nude, entrega en oficina los martes..." 
                  value={cliNotes}
                  onChange={(e) => setCliNotes(e.target.value)}
                />
              </div>

              <div className="modal-actions-form">
                <button type="button" className="btn btn-outline" onClick={() => setIsClientModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SALE DETAIL VIEW MODAL */}
      {selectedSaleDetail && (
        <div className="modal-backdrop" onClick={() => setSelectedSaleDetail(null)}>
          <div className="modal-content sale-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedSaleDetail(null)}>
              <X size={24} />
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', marginRight: '2rem' }}>
              <h3 style={{ margin: 0 }}>Detalle del Pedido</h3>
              <button 
                className="btn btn-outline" 
                onClick={() => handlePrintInvoice(selectedSaleDetail)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
              >
                <Printer size={16} />
                <span>Imprimir Factura</span>
              </button>
            </div>
            
            <div className="sale-details-grid">
              <div className="sale-details-column">
                <h4>Información de Cliente</h4>
                <p><strong>Nombre:</strong> {selectedSaleDetail.clientName}</p>
                <p><strong>Teléfono:</strong> {selectedSaleDetail.clientPhone}</p>
                <p><strong>Fecha del Pedido:</strong> {new Date(selectedSaleDetail.date).toLocaleString('es-ES')}</p>
              </div>
              <div className="sale-details-column">
                <h4>Estado y Notas</h4>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', margin: '0.5rem 0' }}>
                  <strong>Estado:</strong>
                  <span className={`status-badge status-${selectedSaleDetail.status}`}>
                    {selectedSaleDetail.status === 'completed' ? 'Cobrado' : selectedSaleDetail.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                  </span>
                </div>
                <p><strong>Indicaciones/Notas:</strong> {selectedSaleDetail.notes || 'Ninguna'}</p>
              </div>
            </div>

            <div className="sale-details-items">
              <h4>Artículos Comprados</h4>
              <table className="sale-items-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio Unitario</th>
                    <th>Subtotal</th>
                    <th>Costo Total</th>
                    <th>Ganancia Estimada</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSaleDetail.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.productName}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td>{formatCOP(item.priceAtSale)}</td>
                      <td>{formatCOP(item.priceAtSale * item.quantity)}</td>
                      <td>{formatCOP(item.costAtSale * item.quantity)}</td>
                      <td className="text-green">{formatCOP((item.priceAtSale - item.costAtSale) * item.quantity)}</td>
                    </tr>
                  ))}
                  <tr className="totals-row">
                    <td><strong>Total General</strong></td>
                    <td className="text-center"><strong>{selectedSaleDetail.items.reduce((s, i) => s + i.quantity, 0)}</strong></td>
                    <td></td>
                    <td><strong>{formatCOP(selectedSaleDetail.total)}</strong></td>
                    <td><strong>{formatCOP(selectedSaleDetail.items.reduce((s, i) => s + (i.costAtSale * i.quantity), 0))}</strong></td>
                    <td className="text-green"><strong>{formatCOP(selectedSaleDetail.profit)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="sale-status-editor-bottom">
              <span>Cambiar Estado:</span>
              <button 
                className="btn btn-outline btn-status-pending"
                onClick={() => handleUpdateSaleStatus(selectedSaleDetail.id, 'pending')}
                disabled={selectedSaleDetail.status === 'pending'}
              >
                Pendiente
              </button>
              <button 
                className="btn btn-primary btn-status-completed"
                onClick={() => handleUpdateSaleStatus(selectedSaleDetail.id, 'completed')}
                disabled={selectedSaleDetail.status === 'completed'}
              >
                Marcar como Cobrado
              </button>
              <button 
                className="btn btn-danger btn-status-cancelled"
                onClick={() => handleUpdateSaleStatus(selectedSaleDetail.id, 'cancelled')}
                disabled={selectedSaleDetail.status === 'cancelled'}
              >
                Cancelar Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
