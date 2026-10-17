import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAppCheck } from "firebase-admin/app-check";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: ReturnType<typeof initializeApp> | null = null;

function getAdminApp() {
  if (adminApp) return adminApp;

  const existingApp = getApps()[0];
  if (existingApp) {
    adminApp = existingApp;
    return adminApp;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.NODE_ENV !== "production") {
      throw new Error(
        "Configura GOOGLE_APPLICATION_CREDENTIALS con la ruta local de la cuenta de servicio.",
      );
    }

    adminApp = initializeApp({ credential: applicationDefault() });
    return adminApp;
  }

  let serviceAccount: {
    project_id?: string;
    client_email?: string;
    private_key?: string;
  };

  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON no contiene JSON válido.");
  }

  if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON está incompleta.");
  }

  adminApp = initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"),
    }),
  });

  return adminApp;
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export function getAdminAppCheck() {
  return getAppCheck(getAdminApp());
}
