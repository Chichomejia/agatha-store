"use client";

import { useState } from "react";
import { X } from "lucide-react";
import FeedbackMessage from "@/components/ui/FeedbackMessage";

interface ProductToneEditorProps {
  tones: string[];
  toneStock: Record<string, number>;
  onTonesChange: (tones: string[]) => void;
  onToneStockChange: (stock: Record<string, number>) => void;
  id?: string;
}

export default function ProductToneEditor({
  tones,
  toneStock,
  onTonesChange,
  onToneStockChange,
  id = "product-tones",
}: ProductToneEditorProps) {
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
    onTonesChange([...tones, tone]);
    onToneStockChange({ ...toneStock, [tone]: 0 });
    setValue("");
    setMessage("");
  };

  const removeTone = (tone: string) => {
    const available = toneStock[tone] ?? 0;
    if (available > 0) {
      setMessage(`El tono ${tone} tiene ${available} unidades. Reasígnalas o pon su stock en 0 antes de quitarlo.`);
      return;
    }
    onTonesChange(tones.filter((entry) => entry !== tone));
    const nextStock = { ...toneStock };
    delete nextStock[tone];
    onToneStockChange(nextStock);
  };

  return (
    <fieldset className="md:col-span-2">
      <legend className="mb-2 text-sm font-semibold text-gray-700">Tonos e inventario (opcional)</legend>
      <p className="mb-3 text-sm text-gray-500">Define cuántas unidades hay de cada tono. El total del producto se calcula automáticamente.</p>
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
      {message && <FeedbackMessage tone="warning" className="mt-2">{message}</FeedbackMessage>}
      {tones.length > 0 && (
        <ul className="mt-3 space-y-2" aria-label="Tonos e inventario">
          {tones.map((tone) => (
            <li key={tone} className="flex flex-col gap-2 rounded-xl border border-gray-100 p-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-medium text-gray-800">{tone}</span>
              <div className="flex items-center gap-2">
                <label htmlFor={`${id}-${tones.indexOf(tone)}-stock`} className="text-sm text-gray-600">Unidades</label>
                <input
                  id={`${id}-${tones.indexOf(tone)}-stock`}
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={toneStock[tone] ?? 0}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    onToneStockChange({ ...toneStock, [tone]: Number.isSafeInteger(next) && next >= 0 ? next : 0 });
                  }}
                  className="min-h-11 w-28 rounded-lg border border-gray-200 px-3 py-2 text-base outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />
                <button type="button" onClick={() => removeTone(tone)} aria-label={`Quitar tono ${tone}`} className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-600">
                  <X size={17} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-sm font-semibold text-gray-700">
        Stock total: {tones.reduce((total, tone) => total + (toneStock[tone] ?? 0), 0)} unidades
      </p>
    </fieldset>
  );
}
