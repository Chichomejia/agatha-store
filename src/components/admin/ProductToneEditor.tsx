"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface ProductToneEditorProps {
  tones: string[];
  onChange: (tones: string[]) => void;
  id?: string;
}

export default function ProductToneEditor({ tones, onChange, id = "product-tones" }: ProductToneEditorProps) {
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");

  const addTone = () => {
    const tone = value.trim();
    if (!tone) return;
    if (tones.some((entry) => entry.toLocaleLowerCase("es-CO") === tone.toLocaleLowerCase("es-CO"))) {
      setMessage("Ese tono ya está agregado.");
      return;
    }
    if (tones.length >= 30) {
      setMessage("Puedes agregar hasta 30 tonos por producto.");
      return;
    }
    onChange([...tones, tone]);
    setValue("");
    setMessage("");
  };

  return <fieldset className="md:col-span-2">
    <legend className="mb-2 text-sm font-semibold text-gray-700">Tonos disponibles (opcional)</legend>
    <p className="mb-3 text-sm text-gray-500">Agrega los tonos que podrá elegir el cliente. Déjalo vacío si el producto no tiene variantes.</p>
    <div className="flex flex-col gap-2 sm:flex-row">
      <label htmlFor={id} className="sr-only">Escribir tono</label>
      <input
        id={id}
        type="text"
        value={value}
        maxLength={50}
        onChange={(event) => { setValue(event.target.value); setMessage(""); }}
        onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTone(); } }}
        placeholder="Ej. Nude, Rosa claro, 02 Canela"
        className="min-h-12 w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
      />
      <button type="button" onClick={addTone} className="min-h-12 shrink-0 rounded-xl border border-pink-200 px-5 py-3 font-semibold text-pink-700 transition hover:bg-pink-50">
        Agregar tono
      </button>
    </div>
    {message && <p role="status" className="mt-2 text-sm text-amber-700">{message}</p>}
    {tones.length > 0 && (
      <ul className="mt-3 flex flex-wrap gap-2" aria-label="Tonos agregados">
        {tones.map((tone) => (
          <li key={tone} className="inline-flex items-center gap-1 rounded-full bg-pink-50 py-1 pl-3 pr-1 text-sm font-medium text-pink-800">
            {tone}
            <button
              type="button"
              onClick={() => onChange(tones.filter((entry) => entry !== tone))}
              aria-label={`Quitar tono ${tone}`}
              className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-pink-100"
            >
              <X size={15} />
            </button>
          </li>
        ))}
      </ul>
    )}
  </fieldset>;
}
