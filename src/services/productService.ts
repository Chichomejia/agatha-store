import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/services/firebase";
import { Product } from "@/types/Product";

const PRODUCT_CACHE_KEY = "agatha-store-public-products-v1";
const PRODUCT_CACHE_TTL_MS = 5 * 60 * 1000;

interface ProductCache {
  savedAt: number;
  products: Product[];
}

let productsRequest: Promise<Product[]> | null = null;

function isCachedProduct(value: unknown): value is Product {
  if (!value || typeof value !== "object") return false;
  const product = value as Partial<Product>;
  return typeof product.id === "string"
    && typeof product.name === "string"
    && typeof product.description === "string"
    && typeof product.price === "number"
    && typeof product.image === "string"
    && typeof product.category === "string"
    && typeof product.stock === "number";
}

/** Returns a recent public catalog snapshot for instant first paint on repeat visits. */
export function getCachedProducts(): Product[] | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = window.localStorage.getItem(PRODUCT_CACHE_KEY);
    if (!saved) return null;

    const cache = JSON.parse(saved) as Partial<ProductCache>;
    if (
      typeof cache.savedAt !== "number"
      || Date.now() - cache.savedAt > PRODUCT_CACHE_TTL_MS
      || !Array.isArray(cache.products)
      || !cache.products.every(isCachedProduct)
    ) {
      return null;
    }

    return cache.products;
  } catch {
    return null;
  }
}

function saveCachedProducts(products: Product[]) {
  if (typeof window === "undefined") return;

  try {
    const cache: ProductCache = { savedAt: Date.now(), products };
    window.localStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // The catalog remains usable if storage is unavailable or full.
  }
}

function readToneStock(data: Record<string, unknown>, tones: string[]) {
  const savedStock = data.toneStock && typeof data.toneStock === "object"
    ? data.toneStock as Record<string, unknown>
    : {};
  return Object.fromEntries(tones.filter((tone) => Object.prototype.hasOwnProperty.call(savedStock, tone)).map((tone) => {
    const quantity = Number(savedStock[tone]);
    return [tone, Number.isSafeInteger(quantity) && quantity >= 0 ? quantity : 0];
  }));
}

/* ==========================================
   OBTENER PRODUCTOS
========================================== */

export async function getProducts(): Promise<Product[]> {
  if (productsRequest) return productsRequest;

  productsRequest = loadProductsFromFirestore();
  try {
    return await productsRequest;
  } finally {
    productsRequest = null;
  }
}

async function loadProductsFromFirestore(): Promise<Product[]> {
  try {
    const productsRef = collection(db, "products");

    const q = query(
      productsRef,
      where("isActive", "==", true)
    );

    const snapshot = await getDocs(q);

    const products: Product[] = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: String(data.id ?? doc.id),
        name: data.name ?? "",
        description: data.description ?? "",
        price: Number(data.price ?? 0),
        image: data.imageUrl ?? "",
        images: Array.isArray(data.images)
          ? data.images
          : [],
        ...(Array.isArray(data.tones)
          ? { tones: data.tones.filter((tone: unknown): tone is string => typeof tone === "string") }
          : {}),
        ...(Array.isArray(data.tones) && data.tones.length > 0
          ? { toneStock: readToneStock(data, data.tones.filter((tone: unknown): tone is string => typeof tone === "string")) }
          : {}),
        category: data.category ?? "",
        ...(typeof data.rating === "number" && Number.isFinite(data.rating)
          ? { rating: data.rating }
          : {}),
        stock: Number(data.stock ?? 0),
      };
    });

    saveCachedProducts(products);
    return products;
  } catch (error) {
    console.error(
      "❌ ERROR OBTENIENDO PRODUCTOS DE FIREBASE:",
      error
    );

    throw error;
  }
}

/** Loads public product details plus private costs for authenticated admin screens. */
export async function getAdminProducts(): Promise<Product[]> {
  const [productsSnapshot, costsSnapshot] = await Promise.all([
    getDocs(query(collection(db, "products"), where("isActive", "==", true))),
    getDocs(collection(db, "productCosts")),
  ]);
  const costsByProductId = new Map<string, number>();

  costsSnapshot.docs.forEach((costDoc) => {
    const cost = Number(costDoc.data().cost);
    if (Number.isFinite(cost) && cost >= 0) {
      costsByProductId.set(costDoc.id, cost);
    }
  });

  return productsSnapshot.docs.map((productDoc) => {
    const data = productDoc.data();
    const productId = String(data.id ?? productDoc.id);
    return {
      id: productId,
      name: data.name ?? "",
      description: data.description ?? "",
      price: Number(data.price ?? 0),
      image: data.imageUrl ?? "",
      images: Array.isArray(data.images) ? data.images : [],
      ...(Array.isArray(data.tones)
        ? { tones: data.tones.filter((tone: unknown): tone is string => typeof tone === "string") }
        : {}),
      ...(Array.isArray(data.tones) && data.tones.length > 0
        ? { toneStock: readToneStock(data, data.tones.filter((tone: unknown): tone is string => typeof tone === "string")) }
        : {}),
      category: data.category ?? "",
      ...(typeof data.rating === "number" && Number.isFinite(data.rating)
        ? { rating: data.rating }
        : {}),
      stock: Number(data.stock ?? 0),
      cost: costsByProductId.get(productDoc.id) ?? costsByProductId.get(productId),
    };
  });
}

/* ==========================================
   OBTENER PRODUCTO POR ID
========================================== */

export async function getProductById(
  productId: string
): Promise<Product | null> {
  try {
    console.log(
      "🔥 Buscando producto:",
      productId
    );

    const productRef = doc(
      db,
      "products",
      productId
    );

    const [snapshot, privateCostSnapshot] = await Promise.all([
      getDoc(productRef),
      getDoc(doc(db, "productCosts", productId)),
    ]);

    if (!snapshot.exists()) {
      console.log(
        "❌ Producto no encontrado"
      );

      return null;
    }

    const data = snapshot.data();

    return {
      id: String(data.id ?? snapshot.id),
      name: data.name ?? "",
      description: data.description ?? "",
      price: Number(data.price ?? 0),
      image: data.imageUrl ?? "",
      images: Array.isArray(data.images)
        ? data.images
        : data.imageUrl
          ? [data.imageUrl]
          : [],
      ...(Array.isArray(data.tones)
        ? { tones: data.tones.filter((tone: unknown): tone is string => typeof tone === "string") }
        : {}),
      ...(Array.isArray(data.tones) && data.tones.length > 0
        ? { toneStock: readToneStock(data, data.tones.filter((tone: unknown): tone is string => typeof tone === "string")) }
        : {}),
      category: data.category ?? "",
      ...(typeof data.rating === "number" && Number.isFinite(data.rating)
        ? { rating: data.rating }
        : {}),
      stock: Number(data.stock ?? 0),
      cost: privateCostSnapshot.exists()
        ? Number(privateCostSnapshot.data().cost ?? 0)
        : Number(data.cost ?? 0),
    };
  } catch (error) {
    console.error(
      "❌ ERROR OBTENIENDO PRODUCTO:",
      error
    );

    throw error;
  }
}

/* ==========================================
   CREAR PRODUCTO
========================================== */
interface CreateProductData {
  name: string;
  description: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  imageUrl: string;
  images?: string[];
  tones?: string[];
  toneStock?: Record<string, number>;
}
export async function createProduct(
  product: CreateProductData
) {
  try {
    console.log("🔥 Creando producto...");

    const productRef = doc(collection(db, "products"));
    const privateCostRef = doc(db, "productCosts", productRef.id);

    const images =
      product.images && product.images.length > 0
        ? product.images
        : product.imageUrl
          ? [product.imageUrl]
          : [];

    const tones = (product.tones ?? []).map((tone) => tone.trim()).filter(Boolean);
    const toneStock = tones.length ? readToneStock({ toneStock: product.toneStock }, tones) : undefined;
    const newProduct = {
      name: product.name,
      description: product.description,
      category: product.category,
      price: Number(product.price),
      stock: tones.length
        ? Object.values(toneStock ?? {}).reduce((total, quantity) => total + quantity, 0)
        : Number(product.stock),

      // Primera imagen como imagen principal
      imageUrl: images[0] ?? "",

      // Todas las imágenes
      images,
      ...(tones.length ? { tones, toneStock } : {}),

      isActive: true,
      createdAt: new Date(),
    };

    const batch = writeBatch(db);
    batch.set(productRef, newProduct);
    batch.set(privateCostRef, {
      cost: Number(product.cost),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();

    console.log(
      "✅ Producto creado:",
      productRef.id
    );

    return {
      id: productRef.id,
      ...newProduct,
    };
  } catch (error) {
    console.error(
      "❌ ERROR CREANDO PRODUCTO:",
      error
    );

    throw error;
  }
}

/* ==========================================
   ACTUALIZAR PRODUCTO
========================================== */

interface UpdateProductData {
  name: string;
  description: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  imageUrl: string;
  images?: string[];
  tones?: string[];
  toneStock?: Record<string, number>;
}

export async function updateProduct(
  productId: string,
  product: UpdateProductData
) {
  try {
    console.log("🔥 Actualizando producto:", productId);

    const productRef = doc(
      db,
      "products",
      productId
    );

    const images =
      product.images && product.images.length > 0
        ? product.images
        : product.imageUrl
          ? [product.imageUrl]
          : [];

    const tones = (product.tones ?? []).map((tone) => tone.trim()).filter(Boolean);
    const toneStock = tones.length ? readToneStock({ toneStock: product.toneStock }, tones) : undefined;

    const privateCostRef = doc(db, "productCosts", productId);
    const batch = writeBatch(db);
    batch.update(productRef, {
      name: product.name,
      description: product.description,
      category: product.category,
      price: Number(product.price),
      stock: tones.length
        ? Object.values(toneStock ?? {}).reduce((total, quantity) => total + quantity, 0)
        : Number(product.stock),
      cost: deleteField(),
      imageUrl: images[0] ?? "",
      images,
      tones: tones.length ? tones : deleteField(),
      toneStock: tones.length ? toneStock : deleteField(),
    });
    batch.set(privateCostRef, {
      cost: Number(product.cost),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();

    console.log("✅ Producto actualizado");

    return {
      id: productId,
      ...product,
      imageUrl: images[0] ?? "",
      images,
      ...(tones.length ? { tones, toneStock } : {}),
    };
  } catch (error) {
    console.error(
      "❌ ERROR ACTUALIZANDO PRODUCTO:",
      error
    );

    throw error;
  }
}

/** Moves legacy public product costs into the admin-only collection. */
export async function migrateLegacyProductCosts(): Promise<number> {
  const snapshot = await getDocs(collection(db, "products"));
  const legacyCosts = snapshot.docs.filter((productDoc) => {
    const cost = productDoc.data().cost;
    return typeof cost === "number" && Number.isFinite(cost);
  });

  // Each product costs two writes; keep batches below Firestore's 500-write limit.
  for (let start = 0; start < legacyCosts.length; start += 200) {
    const batch = writeBatch(db);
    const chunk = legacyCosts.slice(start, start + 200);

    for (const productDoc of chunk) {
      const cost = productDoc.data().cost as number;
      batch.set(doc(db, "productCosts", productDoc.id), {
        cost,
        updatedAt: serverTimestamp(),
      });
      batch.update(productDoc.ref, { cost: deleteField() });
    }

    await batch.commit();
  }

  return legacyCosts.length;
}
