"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, MessageCircle, Send, ShoppingBag } from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { STORE_WHATSAPP_DISPLAY, STORE_WHATSAPP_URL } from "@/lib/storeContact";

export default function ContactoPage() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanMessage = message.trim();
    if (!cleanName || !cleanMessage) {
      setFormError("Escribe tu nombre y un mensaje antes de continuar.");
      return;
    }

    setFormError("");
    const text = `Hola, soy ${cleanName}. ${cleanMessage}`;
    window.open(`${STORE_WHATSAPP_URL}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="min-h-screen bg-[#fff8fb]">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-pink-100 via-[#fff3f8] to-white">
        <div aria-hidden="true" className="absolute -left-24 -top-28 h-80 w-80 rounded-full bg-pink-200/40 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-pink-700">
            Agatha Store · Atención cercana
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight text-gray-900 sm:text-5xl">
            Estamos aquí para <span className="text-pink-600">ayudarte</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
            ¿Tienes dudas sobre un producto o tu pedido? Escríbenos por WhatsApp
            y conversemos.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-12 sm:py-16 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="rounded-[2rem] bg-gray-900 p-7 text-white shadow-xl sm:p-9">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-600">
            <MessageCircle size={27} />
          </div>
          <h2 className="mt-7 text-2xl font-bold">Atención por WhatsApp</h2>
          <p className="mt-3 leading-7 text-gray-300">
            Cuéntanos qué necesitas y te ayudaremos a encontrar la mejor opción
            para ti.
          </p>
          <p className="mt-7 text-sm text-gray-400">Escríbenos al</p>
          <a
            href={STORE_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex text-xl font-semibold text-white transition hover:text-pink-300"
          >
            {STORE_WHATSAPP_DISPLAY} <ArrowRight className="ml-2" size={20} />
          </a>
          <a
            href={STORE_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-pink-600 px-6 py-3 font-semibold text-white transition hover:bg-pink-700"
          >
            <MessageCircle size={19} /> Abrir WhatsApp
          </a>

          <div className="mt-8 border-t border-white/10 pt-6">
            <Link href="/productos" className="inline-flex items-center gap-2 text-sm font-medium text-gray-300 transition hover:text-white">
              <ShoppingBag size={17} /> Mientras tanto, explora la tienda
            </Link>
          </div>
        </aside>

        <div className="rounded-[2rem] border border-pink-100 bg-white p-7 shadow-sm sm:p-9">
          <h2 className="text-2xl font-bold text-gray-900">Envíanos un mensaje</h2>
          <p className="mt-2 text-gray-500">
            Completa tus datos y continuaremos la conversación en WhatsApp.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-gray-700">Tu nombre</span>
              <input
                id="contact-name"
                name="name"
                type="text"
                required
                maxLength={80}
                autoComplete="name"
                autoCapitalize="words"
                aria-invalid={Boolean(formError && !name.trim())}
                aria-describedby={formError && !name.trim() ? "contact-form-error" : undefined}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setFormError("");
                }}
                placeholder="¿Cómo te llamas?"
                className="min-h-12 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition placeholder:text-gray-400 focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-gray-700">¿En qué podemos ayudarte?</span>
              <textarea
                id="contact-message"
                name="message"
                required
                maxLength={1000}
                rows={5}
                aria-invalid={Boolean(formError && !message.trim())}
                aria-describedby={formError && !message.trim() ? "contact-form-error" : undefined}
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  setFormError("");
                }}
                placeholder="Escribe aquí tu consulta..."
                className="min-h-32 w-full resize-y rounded-xl border border-gray-200 px-4 py-3 outline-none transition placeholder:text-gray-400 focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
              />
            </label>
            {formError && <p id="contact-form-error" role="alert" aria-live="assertive" className="text-sm text-red-700">{formError}</p>}
            <button
              type="submit"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-pink-600 px-6 py-3.5 font-semibold text-white shadow-md shadow-pink-200 transition hover:bg-pink-700 sm:w-auto"
            >
              Continuar en WhatsApp <Send size={17} />
            </button>
          </form>
          <p className="mt-5 text-xs leading-5 text-gray-400">
            Al continuar, WhatsApp se abrirá con el mensaje preparado para que
            puedas revisarlo y enviarlo.
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
