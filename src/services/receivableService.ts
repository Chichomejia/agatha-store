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
import type { Receivable, ReceivablePayment } from "@/types/Receivable";

export async function getReceivables(): Promise<Receivable[]> {
  const receivablesQuery = query(
    collection(db, "receivables"),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(receivablesQuery);

  return snapshot.docs.map((receivableDoc) => ({
    ...receivableDoc.data(),
    id: receivableDoc.id,
  }) as Receivable);
}

export async function getReceivablePayments(receivableId: string): Promise<ReceivablePayment[]> {
  const paymentsQuery = query(
    collection(db, "receivables", receivableId, "payments"),
    orderBy("date", "desc"),
  );
  const snapshot = await getDocs(paymentsQuery);

  return snapshot.docs.map((paymentDoc) => ({
    ...paymentDoc.data(),
    id: paymentDoc.id,
  }) as ReceivablePayment);
}

export async function createReceivableFromSale(
  sale: Sale,
  initialPayment: number,
): Promise<void> {
  if (sale.status !== "completed" || !Number.isFinite(sale.total) || sale.total <= 0) {
    throw new Error("Solo puedes registrar como fiado una venta completada con total válido.");
  }
  if (!Number.isFinite(initialPayment) || initialPayment < 0 || initialPayment > sale.total) {
    throw new Error("El abono inicial debe estar entre cero y el total de la venta.");
  }

  const receivableRef = doc(db, "receivables", sale.id);
  const initialPaymentRef = doc(collection(receivableRef, "payments"));

  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(receivableRef);
    if (existing.exists()) {
      throw new Error("Esta venta ya está registrada en Fiados.");
    }

    const balance = sale.total - initialPayment;
    transaction.set(receivableRef, {
      saleId: sale.id,
      clientName: sale.clientName || "Cliente sin nombre",
      clientPhone: sale.clientPhone || "",
      total: sale.total,
      paidTotal: initialPayment,
      balance,
      status: balance === 0 ? "paid" : "open",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (initialPayment > 0) {
      transaction.set(initialPaymentRef, {
        amount: initialPayment,
        date: serverTimestamp(),
        note: "Abono inicial",
      });
    }
  });
}

export async function addReceivablePayment(
  receivableId: string,
  amount: number,
  note = "",
): Promise<void> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Ingresa un abono mayor que cero.");
  }

  const receivableRef = doc(db, "receivables", receivableId);
  const paymentRef = doc(collection(receivableRef, "payments"));

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(receivableRef);
    if (!snapshot.exists()) throw new Error("No se encontró esta cuenta por cobrar.");

    const receivable = snapshot.data();
    const balance = Number(receivable.balance);
    const paidTotal = Number(receivable.paidTotal);
    if (!Number.isFinite(balance) || !Number.isFinite(paidTotal) || balance <= 0) {
      throw new Error("Esta cuenta ya está saldada o tiene datos incompletos.");
    }
    if (amount > balance) {
      throw new Error("El abono no puede ser mayor al saldo pendiente.");
    }

    const nextBalance = balance - amount;
    transaction.set(paymentRef, {
      amount,
      date: serverTimestamp(),
      ...(note.trim() ? { note: note.trim().slice(0, 160) } : {}),
    });
    transaction.update(receivableRef, {
      paidTotal: paidTotal + amount,
      balance: nextBalance,
      status: nextBalance === 0 ? "paid" : "open",
      updatedAt: serverTimestamp(),
    });
  });
}
