import {
  collection,
  getCountFromServer,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import type { User } from "firebase/auth";

import { db } from "@/services/firebase";
import { isAuthorizedAdmin } from "@/services/authService";

export interface AdminDashboardMetrics {
  products: number | null;
  orders: number | null;
  orderValue: number | null;
  completedSalesValue: number | null;
  errors: Partial<Record<keyof Omit<AdminDashboardMetrics, "errors">, string>>;
}

export async function getAdminDashboardMetrics(
  adminUser: User,
): Promise<AdminDashboardMetrics> {
  if (!isAuthorizedAdmin(adminUser)) {
    throw Object.assign(
      new Error("La sesión no corresponde al administrador autorizado."),
      { code: "auth/admin-not-authorized" },
    );
  }

  // Refresh the Firebase ID token in case the admin account or its claims changed
  // while the panel remained open.
  await adminUser.getIdToken(true);

  const results = await Promise.allSettled([
    getCountFromServer(
      query(collection(db, "products"), where("isActive", "==", true)),
    ).then((result) => result.data().count),
    getDocs(collection(db, "orders")).then((snapshot) => ({
      count: snapshot.size,
      value: snapshot.docs.reduce((total, orderDoc) => {
        const order = orderDoc.data();
        const orderTotal = Number(order.total);

        return order.status !== "cancelado" && Number.isFinite(orderTotal)
          ? total + orderTotal
          : total;
      }, 0),
    })),
    getDocs(collection(db, "sales")).then((snapshot) =>
      snapshot.docs.reduce((total, saleDoc) => {
        const sale = saleDoc.data();
        const saleTotal = Number(sale.total);

        return sale.status === "completed" && Number.isFinite(saleTotal)
          ? total + saleTotal
          : total;
      }, 0),
    ),
  ]);

  const metricNames = [
    "products",
    "orders",
    "orderValue",
    "completedSalesValue",
  ] as const;
  const errors: AdminDashboardMetrics["errors"] = {};
  const recordError = (metric: (typeof metricNames)[number], reason: unknown) => {
    const code =
      typeof reason === "object" && reason !== null && "code" in reason &&
      typeof reason.code === "string"
        ? reason.code
        : "unknown";
    errors[metric] = code;
  };

  const [productsResult, ordersResult, salesResult] = results;
  if (productsResult.status === "rejected") {
    recordError("products", productsResult.reason);
  }
  if (ordersResult.status === "rejected") {
    recordError("orders", ordersResult.reason);
    recordError("orderValue", ordersResult.reason);
  }
  if (salesResult.status === "rejected") {
    recordError("completedSalesValue", salesResult.reason);
  }

  return {
    products:
      productsResult.status === "fulfilled" ? productsResult.value : null,
    orders: ordersResult.status === "fulfilled" ? ordersResult.value.count : null,
    orderValue: ordersResult.status === "fulfilled" ? ordersResult.value.value : null,
    completedSalesValue:
      salesResult.status === "fulfilled" ? salesResult.value : null,
    errors,
  };
}
