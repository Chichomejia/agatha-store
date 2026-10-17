import { initializeApp } from "firebase/app";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  type AppCheck,
} from "firebase/app-check";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDxodI273bOxAbZuNKyOQYoijItGuOTgNI",
  authDomain: "agatha-store05.firebaseapp.com",
  projectId: "agatha-store05",
  storageBucket: "agatha-store05.firebasestorage.app",
  messagingSenderId: "172909869645",
  appId: "1:172909869645:web:1e7c2a4de41e3b9f96ba04",
};

const app = initializeApp(firebaseConfig);

let appCheckInstance: AppCheck | null = null;
const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY;

if (typeof window !== "undefined" && recaptchaSiteKey) {
  appCheckInstance = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

export function getClientAppCheck() {
  return appCheckInstance;
}

export const db = getFirestore(app);

export const auth = getAuth(app);
