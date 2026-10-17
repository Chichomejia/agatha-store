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

/* ==========================================
   OBTENER PRODUCTOS
========================================== */

export async function getProducts(): Promise<Product[]> {
  try {
    console.log("🔥 Consultando productos en Firestore...");

    const productsRef = collection(db, "products");

    const q = query(
      productsRef,
      where("isActive", "==", true)
    );

    const snapshot = await getDocs(q);

    console.log(
      "🔥 Productos encontrados:",
      snapshot.size
    );

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
        category: data.category ?? "",
        ...(typeof data.rating === "number" && Number.isFinite(data.rating)
          ? { rating: data.rating }
          : {}),
        stock: Number(data.stock ?? 0),
      };
    });

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

    const newProduct = {
      name: product.name,
      description: product.description,
      category: product.category,
      price: Number(product.price),
      stock: Number(product.stock),

      // Primera imagen como imagen principal
      imageUrl: images[0] ?? "",

      // Todas las imágenes
      images,
      ...(product.tones?.length ? { tones: product.tones } : {}),

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

    const privateCostRef = doc(db, "productCosts", productId);
    const batch = writeBatch(db);
    batch.update(productRef, {
      name: product.name,
      description: product.description,
      category: product.category,
      price: Number(product.price),
      stock: Number(product.stock),
      cost: deleteField(),
      imageUrl: images[0] ?? "",
      images,
      tones: product.tones?.length ? product.tones : deleteField(),
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
      ...(product.tones?.length ? { tones: product.tones } : {}),
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
