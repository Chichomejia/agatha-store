import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";

import { auth } from "@/services/firebase";

export const ADMIN_EMAILS: readonly string[] = [
  "chichomejiab@gmail.com",
  "christine.gomez0209@icloud.com",
] as const;

export function isAuthorizedAdmin(user: User | null) {
  return Boolean(
    user?.email && ADMIN_EMAILS.includes(user.email.trim().toLowerCase())
  );
}

export async function loginAdmin(
  email: string,
  password: string
) {
  const result =
    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

  if (!isAuthorizedAdmin(result.user)) {
    await signOut(auth);
    throw Object.assign(new Error("Esta cuenta no tiene acceso al panel."), {
      code: "auth/admin-not-authorized",
    });
  }

  return result.user;
}

export async function logoutAdmin() {
  await signOut(auth);
}

export function observeAuth(
  callback: (user: User | null) => void
) {
  return onAuthStateChanged(
    auth,
    callback
  );
}
