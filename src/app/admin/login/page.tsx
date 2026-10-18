"use client";

import { FormEvent, useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/services/firebase";
import { loginAdmin } from "@/services/authService";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";
import FeedbackMessage from "@/components/ui/FeedbackMessage";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingRecovery, setSendingRecovery] = useState(false);

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError(
        "Completa el correo y la contraseña."
      );
      return;
    }

    try {
      setLoading(true);

      await loginAdmin(email, password);

router.push("/admin");
    } catch (error: unknown) {
       console.error(
    "Error iniciando sesión:",
    error
  );

    setError(
    typeof error === "object" && error !== null && "code" in error && error.code === "auth/admin-not-authorized"
      ? "Esta cuenta no está autorizada para administrar la tienda."
      : "Correo o contraseña incorrectos."
  );

    } finally {
      setLoading(false);
    }
  };

  const handlePasswordRecovery = async () => {
    const normalizedEmail = email.trim();
    setError("");
    setRecoveryMessage("");
    if (!normalizedEmail) {
      setError("Escribe tu correo electrónico para solicitar el enlace.");
      return;
    }

    try {
      setSendingRecovery(true);
      await sendPasswordResetEmail(auth, normalizedEmail);
      setRecoveryMessage(
        "Si el correo corresponde a una cuenta, recibirás instrucciones para restablecer la contraseña.",
      );
    } catch (recoveryError) {
      console.error("No se pudo solicitar el restablecimiento:", recoveryError);
      setError("No se pudo enviar el enlace. Revisa el correo e inténtalo de nuevo.");
    } finally {
      setSendingRecovery(false);
    }
  };

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-gradient-to-br from-pink-50 via-white to-rose-100 px-4 py-6 sm:min-h-screen sm:px-5 sm:py-8">

      {/* Decoración */}

      <div className="pointer-events-none absolute left-0 top-0 h-72 w-72 rounded-full bg-pink-200/30 blur-3xl" />

      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-rose-200/30 blur-3xl" />

      {/* Login */}

      <div className="relative z-10 w-full max-w-md">

        <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8 md:p-10">

          {/* Logo / nombre */}

          <div className="text-center">

            <p className="text-xs font-bold uppercase tracking-[0.35em] text-pink-600">
              Agatha Store
            </p>

            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900">
              Panel administrativo
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              Inicia sesión para administrar
              tu tienda.
            </p>

          </div>

          {/* Icono */}

          <div className="mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
            <Lock size={28} />
          </div>

          {/* Error */}

          {error && (
            <FeedbackMessage tone="error" className="mt-6 font-medium">
              {error}
            </FeedbackMessage>
          )}

          {/* Formulario */}

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >

            {/* Correo */}

            <div>

              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Correo electrónico
              </label>

              <div className="relative">

                <Mail
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setRecoveryMessage("");
                  }}
                  placeholder="admin@agathastore.com"
                  className="min-h-12 w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-base outline-none transition focus:border-pink-500 focus:ring-4 focus:ring-pink-100"
                />

              </div>

            </div>

            {/* Contraseña */}

            <div>

              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Contraseña
              </label>

              <div className="relative">

                <Lock
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="password"
                  autoComplete="current-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="••••••••"
                  className="min-h-12 w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-11 pr-12 text-base outline-none transition focus:border-pink-500 focus:ring-4 focus:ring-pink-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="absolute right-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-gray-500 transition hover:bg-pink-50 hover:text-pink-600"
                  aria-label={
                    showPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>

              </div>

            </div>

            {recoveryMessage && (
              <FeedbackMessage tone="success" className="text-sm">
                {recoveryMessage}
              </FeedbackMessage>
            )}

            <button
              type="button"
              onClick={() => void handlePasswordRecovery()}
              disabled={sendingRecovery || loading}
              className="text-sm font-semibold text-pink-700 underline underline-offset-4 transition hover:text-pink-800 disabled:opacity-60"
            >
              {sendingRecovery ? "Enviando enlace…" : "Olvidé mi contraseña"}
            </button>

            {/* Botón */}

            <button
              type="submit"
              disabled={loading}
              className="group flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl bg-pink-600 px-6 py-4 font-bold text-white shadow-lg shadow-pink-200 transition hover:bg-pink-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Ingresando..."
                : "Iniciar sesión"}

              {!loading && (
                <ArrowRight
                  size={19}
                  className="transition-transform group-hover:translate-x-1"
                />
              )}
            </button>

          </form>

          {/* Footer */}

          <p className="mt-8 text-center text-xs text-gray-400">
            Agatha Store · Administración
          </p>

        </div>

      </div>

    </main>
  );
}
