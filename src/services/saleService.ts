import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/services/firebase";
import type { Sale } from "@/types/Sale";

export async function getSales(): Promise<Sale[]> {
  const salesQuery = query(collection(db, "sales"), orderBy("date", "desc"));
  const snapshot = await getDocs(salesQuery);

  return snapshot.docs.map((saleDoc) => {
    const saleData = saleDoc.data();

    return {
      ...saleData,
      id: typeof saleData.id === "string" ? saleData.id : saleDoc.id,
      documentId: saleDoc.id,
    } as Sale;
  });
}

export async function deleteSale(sale: Sale): Promise<void> {
  const saleRef = doc(db, "sales", sale.documentId ?? sale.id);
  const receivableRef = doc(db, "receivables", sale.id);
  const deletionRef = doc(db, "deletedSales", sale.id);

  await runTransaction(db, async (transaction) => {
    const [saleSnapshot, receivableSnapshot, deletionSnapshot] = await Promise.all([
      transaction.get(saleRef),
      transaction.get(receivableRef),
      transaction.get(deletionRef),
    ]);

    if (!saleSnapshot.exists()) throw new Error("La venta ya no existe.");
    if (receivableSnapshot.exists()) {
      throw new Error("No se puede borrar: esta venta tiene un fiado asociado. Conservamos ese registro para no perder el saldo ni los abonos.");
    }
    if (deletionSnapshot.exists()) throw new Error("Esta venta ya fue eliminada.");

    transaction.delete(saleRef);
    transaction.set(deletionRef, {
      saleId: sale.id,
      deletedAt: serverTimestamp(),
    });
  });
}
