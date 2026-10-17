"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Loader2, Save, Upload } from "lucide-react";
import { CldUploadWidget } from "next-cloudinary";

import { isAuthorizedAdmin, observeAuth } from "@/services/authService";
import {
  DEFAULT_HOMEPAGE_SETTINGS,
  getHomepageSettings,
  saveHomepageSettings,
  type HomepageSettings,
} from "@/services/homepageService";

export default function AdminPortadaPage() {
  const router = useRouter();
  const [form, setForm] = useState<HomepageSettings>(DEFAULT_HOMEPAGE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsubscribe = observeAuth((user) => {
      if (!isAuthorizedAdmin(user)) {
        router.replace("/admin/login");
        return;
      }
      getHomepageSettings()
        .then(setForm)
        .catch((loadError) => {
          console.error("Error cargando configuración de portada:", loadError);
          setError("No se pudo cargar la portada. Revisa las reglas de Firestore.");
        })
        .finally(() => setLoading(false));
    });
    return () => unsubscribe();
  }, [router]);

  const updateField = (field: keyof HomepageSettings, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setSaved(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await saveHomepageSettings(form);
      setSaved(true);
    } catch (saveError) {
      console.error("Error guardando portada:", saveError);
      setError("No se pudo guardar. Revisa que hayas publicado las reglas de Firestore para storefront.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-pink-50 text-gray-600">Cargando configuración…</main>;
  }

  return (
    <main className="min-h-screen bg-pink-50 px-4 py-6 sm:px-5 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <button type="button" onClick={() => router.push("/admin")} className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-gray-600 hover:bg-pink-100 hover:text-pink-700">
          <ArrowLeft size={18} /> Volver al panel
        </button>
        <header className="mb-7">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-pink-600">Agatha Store</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">Editar portada</h1>
          <p className="mt-2 text-gray-500">Actualiza el mensaje principal y la imagen de inicio.</p>
        </header>

        <form onSubmit={handleSubmit} aria-busy={saving} className="space-y-6">
          <section className="space-y-5 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700" htmlFor="eyebrow">Texto superior</label>
              <input id="eyebrow" maxLength={60} value={form.eyebrow} onChange={(event) => updateField("eyebrow", event.target.value)} className="min-h-12 w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100" />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700" htmlFor="headline">Título principal</label>
                <input id="headline" maxLength={70} required value={form.headline} onChange={(event) => updateField("headline", event.target.value)} className="min-h-12 w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700" htmlFor="highlight">Texto resaltado</label>
                <input id="highlight" maxLength={70} required value={form.highlight} onChange={(event) => updateField("highlight", event.target.value)} className="min-h-12 w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700" htmlFor="description">Descripción</label>
              <textarea id="description" maxLength={240} rows={4} required value={form.description} onChange={(event) => updateField("description", event.target.value)} className="min-h-28 w-full resize-y rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100" />
              <p className="mt-1 text-right text-xs text-gray-500" aria-live="polite">{form.description.length} de 240 caracteres</p>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900"><ImagePlus size={20} className="text-pink-600" /> Imagen de portada</h2>
            <CldUploadWidget
              uploadPreset="agatha_products"
              options={{ multiple: false, maxFiles: 1, resourceType: "image", clientAllowedFormats: ["jpg", "jpeg", "png", "webp"], maxFileSize: 5000000 }}
              onSuccess={(result: any) => {
                const url = result?.info?.secure_url;
                if (typeof url === "string") updateField("imageUrl", url);
              }}
            >
              {({ open }) => (
                <button type="button" onClick={() => open()} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-pink-200 bg-pink-50 px-5 py-5 font-semibold text-pink-700 transition hover:border-pink-400 hover:bg-pink-100">
                  <Upload size={18} /> Subir una imagen
                </button>
              )}
            </CldUploadWidget>
            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-gray-700" htmlFor="imageUrl">O pega una URL de imagen</label>
              <input id="imageUrl" type="url" inputMode="url" value={form.imageUrl} onChange={(event) => updateField("imageUrl", event.target.value)} className="min-h-12 w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100" />
            </div>
            {form.imageUrl && <img src={form.imageUrl} alt="Vista previa de la portada" className="mt-5 max-h-96 w-full rounded-2xl bg-pink-50 object-cover" />}
            <p className="mt-3 text-xs text-gray-500">Recomendado: imagen vertical de buena resolución, JPG, PNG o WEBP; máximo 5 MB.</p>
          </section>

          {error && <p role="alert" aria-live="assertive" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">{error}</p>}
          {saved && <p role="status" aria-live="polite" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Portada guardada correctamente.</p>}
          <div className="flex justify-stretch sm:justify-end">
            <button type="submit" disabled={saving} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-pink-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-pink-700 disabled:cursor-wait disabled:opacity-60 sm:w-auto">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? "Guardando…" : "Guardar portada"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
