import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';
import type { Product, Client, Sale } from '../types';

// Formateador estándar de Pesos Colombianos (COP) - redondea y separa con puntos
export const formatCOP = (value: number): string => {
  return '$ ' + Math.round(value).toLocaleString('es-CO');
};

// Claves de localStorage
const PRODUCTS_KEY = 'agatha_beauty_products';
const CLIENTS_KEY = 'agatha_beauty_clients';
const SALES_KEY = 'agatha_beauty_sales';

// Datos semilla de ejemplo en Pesos Colombianos (COP)
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'Suero Iluminador Vitamina C',
    category: 'Cuidado de la Piel',
    description: 'Suero facial antioxidante altamente concentrado. Aporta luminosidad, reduce manchas y estimula el colágeno para un brillo radiante.',
    price: 65000,
    cost: 32000,
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1608248597481-496100c80836?w=500&auto=format&fit=crop&q=60',
    isActive: true
  },
  {
    id: 'prod_2',
    name: 'Labial Mate Velvet - Nuit Plum',
    category: 'Maquillaje',
    description: 'Labial de larga duración con textura aterciopelada en un tono ciruela morado sofisticado. No reseca los labios y tiene alta pigmentación.',
    price: 45000,
    cost: 18000,
    stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&auto=format&fit=crop&q=60',
    isActive: true
  },
  {
    id: 'prod_3',
    name: 'Paleta de Sombras "Amethyst Dream"',
    category: 'Maquillaje',
    description: 'Paleta de 12 sombras altamente pigmentadas. Incluye tonos lavanda, morados profundos, lilas brillantes y nudes mate de transición.',
    price: 110000,
    cost: 55000,
    stock: 8,
    imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop&q=60',
    isActive: true
  },
  {
    id: 'prod_4',
    name: 'Crema Hidratante Ceramide Glow',
    category: 'Cuidado de la Piel',
    description: 'Crema hidratante ultra nutritiva restauradora con ceramidas y extracto de lavanda. Repara la barrera cutánea durante todo el día.',
    price: 85000,
    cost: 42000,
    stock: 12,
    imageUrl: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=500&auto=format&fit=crop&q=60',
    isActive: true
  },
  {
    id: 'prod_5',
    name: 'Perfume "Nuit Violette" EDP',
    category: 'Fragancias',
    description: 'Una fragancia misteriosa y seductora con notas de violeta, ámbar negro, vainilla y un toque sutil de orquídea salvaje. 100ml.',
    price: 180000,
    cost: 90000,
    stock: 5,
    imageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&auto=format&fit=crop&q=60',
    isActive: true
  },
  {
    id: 'prod_6',
    name: 'Aceite Capilar de Argán y Lavanda',
    category: 'Cabello',
    description: 'Aceite reestructurante capilar. Controla el frizz, repara puntas abiertas y deja un aroma relajante a lavanda con brillo sedoso.',
    price: 52000,
    cost: 24000,
    stock: 10,
    imageUrl: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500&auto=format&fit=crop&q=60',
    isActive: true
  }
];

const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli_1',
    name: 'Valeria Mendoza',
    phone: '+57 300 123 4567',
    email: 'valeria@email.com',
    address: 'Calle 100 #15-30, Bogotá',
    notes: 'Prefiere entregas los fines de semana. Le encantan los productos para el cuidado de la piel.',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'cli_2',
    name: 'Camila Rodríguez',
    phone: '+57 315 987 6543',
    email: 'camila@email.com',
    address: 'Carrera 43A #5A-20, Medellín',
    notes: 'Suele pedir tonos morados y maquillaje de ojos.',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const INITIAL_SALES: Sale[] = [
  {
    id: 'sale_1',
    clientId: 'cli_1',
    clientName: 'Valeria Mendoza',
    clientPhone: '+57 300 123 4567',
    items: [
      {
        productId: 'prod_1',
        productName: 'Suero Iluminador Vitamina C',
        quantity: 1,
        priceAtSale: 65000,
        costAtSale: 32000
      },
      {
        productId: 'prod_4',
        productName: 'Crema Hidratante Ceramide Glow',
        quantity: 1,
        priceAtSale: 85000,
        costAtSale: 42000
      }
    ],
    total: 150000,
    profit: 76000,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    notes: 'Pago por Nequi contra entrega. Todo excelente.'
  },
  {
    id: 'sale_2',
    clientId: 'cli_2',
    clientName: 'Camila Rodríguez',
    clientPhone: '+57 315 987 6543',
    items: [
      {
        productId: 'prod_3',
        productName: 'Paleta de Sombras "Amethyst Dream"',
        quantity: 1,
        priceAtSale: 110000,
        costAtSale: 55000
      },
      {
        productId: 'prod_2',
        productName: 'Labial Mate Velvet - Nuit Plum',
        quantity: 2,
        priceAtSale: 45000,
        costAtSale: 18000
      }
    ],
    total: 200000,
    profit: 109000,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    notes: 'Pendiente de entrega en su domicilio. Vía WhatsApp.'
  }
];

// Inicializar localStorage si está vacío
const initStorage = () => {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(PRODUCTS_KEY)) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
  }
  if (!localStorage.getItem(CLIENTS_KEY)) {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(INITIAL_CLIENTS));
  }
  if (!localStorage.getItem(SALES_KEY)) {
    localStorage.setItem(SALES_KEY, JSON.stringify(INITIAL_SALES));
  }
};

// Configuración de Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

export const isFirebaseConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.apiKey !== 'tu-api-key-de-firebase';

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const firestore = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;

// --- Funciones Auxiliares para LocalStorage ---
const getLocalProducts = (): Product[] => {
  initStorage();
  const data = localStorage.getItem(PRODUCTS_KEY);
  return data ? JSON.parse(data) : [];
};

const getLocalClients = (): Client[] => {
  initStorage();
  const data = localStorage.getItem(CLIENTS_KEY);
  return data ? JSON.parse(data) : [];
};

const getLocalSales = (): Sale[] => {
  initStorage();
  const data = localStorage.getItem(SALES_KEY);
  return data ? JSON.parse(data) : [];
};

// --- SERVICIOS DE PRODUCTOS ---
export const dbProducts = {
  getAll: async (): Promise<Product[]> => {
    if (firestore) {
      try {
        const querySnapshot = await getDocs(collection(firestore, 'products'));
        const products: Product[] = [];
        querySnapshot.forEach((doc) => {
          products.push(doc.data() as Product);
        });
        return products.sort((a, b) => a.name.localeCompare(b.name));
      } catch (error) {
        console.error('Error al obtener productos de Firebase, usando local:', error);
      }
    }
    return getLocalProducts();
  },

  save: async (product: Product): Promise<Product[]> => {
    if (firestore) {
      try {
        await setDoc(doc(firestore, 'products', product.id), product);
        return dbProducts.getAll();
      } catch (error) {
        console.error('Error al guardar producto en Firebase:', error);
      }
    }
    
    const products = getLocalProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.push(product);
    }
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    return products;
  },

  delete: async (id: string): Promise<Product[]> => {
    if (firestore) {
      try {
        await deleteDoc(doc(firestore, 'products', id));
        return dbProducts.getAll();
      } catch (error) {
        console.error('Error al eliminar producto en Firebase:', error);
      }
    }
    
    const products = getLocalProducts();
    const updated = products.filter(p => p.id !== id);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updated));
    return updated;
  },

  uploadImage: async (file: File, onProgress?: (progress: number) => void): Promise<string> => {
    if (storage) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const storageRef = ref(storage, `products/${fileName}`);
      
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            onProgress?.(progress);
          }, 
          (error) => {
            console.error('Error subiendo foto a Firebase:', error);
            reject(error);
          }, 
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (err) {
              reject(err);
            }
          }
        );
      });
    }

    // Fallback: Convertir a base64 para guardarlo localmente
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      onProgress?.(30);
      reader.onloadend = () => {
        onProgress?.(100);
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Error leyendo archivo local'));
      };
      reader.readAsDataURL(file);
    });
  }
};

// --- SERVICIOS DE CLIENTES ---
export const dbClients = {
  getAll: async (): Promise<Client[]> => {
    if (firestore) {
      try {
        const querySnapshot = await getDocs(collection(firestore, 'clients'));
        const clients: Client[] = [];
        querySnapshot.forEach((doc) => {
          clients.push(doc.data() as Client);
        });
        return clients.sort((a, b) => a.name.localeCompare(b.name));
      } catch (error) {
        console.error('Error al obtener clientes de Firebase:', error);
      }
    }
    return getLocalClients();
  },

  save: async (client: Client): Promise<Client[]> => {
    if (firestore) {
      try {
        await setDoc(doc(firestore, 'clients', client.id), client);
        return dbClients.getAll();
      } catch (error) {
        console.error('Error al guardar cliente en Firebase:', error);
      }
    }
    
    const clients = getLocalClients();
    const index = clients.findIndex(c => c.id === client.id);
    if (index >= 0) {
      clients[index] = client;
    } else {
      clients.push(client);
    }
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
    return clients;
  },

  findOrCreateByNameAndPhone: async (name: string, phone: string): Promise<Client> => {
    const clients = await dbClients.getAll();
    const cleanPhone = phone.trim();
    const cleanName = name.trim();
    
    let client = clients.find(
      c => c.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, '') || 
      c.name.toLowerCase() === cleanName.toLowerCase()
    );

    if (!client) {
      client = {
        id: 'cli_' + Math.random().toString(36).substr(2, 9),
        name: cleanName,
        phone: cleanPhone,
        createdAt: new Date().toISOString(),
        notes: 'Cliente registrado automáticamente desde pedido.'
      };
      await dbClients.save(client);
    }
    return client;
  }
};

// --- SERVICIOS DE VENTAS ---
export const dbSales = {
  getAll: async (): Promise<Sale[]> => {
    if (firestore) {
      try {
        const querySnapshot = await getDocs(collection(firestore, 'sales'));
        const sales: Sale[] = [];
        querySnapshot.forEach((doc) => {
          sales.push(doc.data() as Sale);
        });
        return sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } catch (error) {
        console.error('Error al obtener ventas de Firebase:', error);
      }
    }
    return getLocalSales();
  },

  save: async (sale: Sale): Promise<Sale[]> => {
    const sales = await dbSales.getAll();
    const index = sales.findIndex(s => s.id === sale.id);
    
    // Descontar o devolver del inventario según corresponda
    if (index < 0 && sale.status !== 'cancelled') {
      const products = await dbProducts.getAll();
      for (const item of sale.items) {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          prod.stock = Math.max(0, prod.stock - item.quantity);
          await dbProducts.save(prod);
        }
      }
    } else if (index >= 0) {
      const oldSale = sales[index];
      const products = await dbProducts.getAll();
      
      if (oldSale.status !== 'cancelled' && sale.status === 'cancelled') {
        for (const item of sale.items) {
          const prod = products.find(p => p.id === item.productId);
          if (prod) {
            prod.stock += item.quantity;
            await dbProducts.save(prod);
          }
        }
      } else if (oldSale.status === 'cancelled' && sale.status !== 'cancelled') {
        for (const item of sale.items) {
          const prod = products.find(p => p.id === item.productId);
          if (prod) {
            prod.stock = Math.max(0, prod.stock - item.quantity);
            await dbProducts.save(prod);
          }
        }
      }
    }

    if (firestore) {
      try {
        await setDoc(doc(firestore, 'sales', sale.id), sale);
        return dbSales.getAll();
      } catch (error) {
        console.error('Error al guardar venta en Firebase:', error);
      }
    }
    
    const localSales = getLocalSales();
    const idx = localSales.findIndex(s => s.id === sale.id);
    if (idx >= 0) {
      localSales[idx] = sale;
    } else {
      localSales.push(sale);
    }
    localStorage.setItem(SALES_KEY, JSON.stringify(localSales));
    return localSales;
  },

  updateStatus: async (id: string, status: 'pending' | 'completed' | 'cancelled'): Promise<Sale[]> => {
    const sales = await dbSales.getAll();
    const sale = sales.find(s => s.id === id);
    if (sale) {
      const updatedSale = { ...sale, status };
      return dbSales.save(updatedSale);
    }
    return sales;
  }
};
