import { getToken } from "firebase/app-check";
import { getClientAppCheck } from "@/services/firebase";

export async function getAppCheckToken(forceRefresh = false): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("La validación de la tienda solo está disponible en el navegador.");
  }

  const appCheckInstance = getClientAppCheck();
  if (!appCheckInstance) {
    throw new Error("La validación segura de la tienda todavía no está configurada.");
  }

  const token = await getToken(appCheckInstance, forceRefresh);
  return token.token;
}
