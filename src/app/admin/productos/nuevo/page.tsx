"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";

import { CldUploadWidget } from "next-cloudinary";

import { createProduct } from "@/services/productService";
import { isAuthorizedAdmin, observeAuth } from "@/services/authService";
import ProductToneEditor from "@/components/admin/ProductToneEditor";

interface UploadedImage {
  url: string;
  publicId: string;
}

export default function NuevoProductoPage() {
  const router = useRouter();

  useEffect(() => {
    return observeAuth((user) => {
      if (!isAuthorizedAdmin(user)) router.replace("/admin/login");
    });
  }, [router]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    cost: "",
    stock: "",
    imageUrl: "",
  });

  const [images, setImages] = useState<
    UploadedImage[]
  >([]);
  const [tones, setTones] = useState<string[]>([]);
  const [toneStock, setToneStock] = useState<Record<string, number>>({});

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const handleChange = (
    e: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormError("");
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleUploadSuccess = (result: any) => {
    const info = result?.info;

    if (!info?.secure_url) {
      return;
    }

    const newImage: UploadedImage = {
      url: info.secure_url,
      publicId: info.public_id ?? "",
    };

    setImages((current) => {
      // Evitar imágenes repetidas
      const alreadyExists = current.some(
        (image) => image.url === newImage.url
      );

      if (alreadyExists) {
        return current;
      }

      return [...current, newImage];
    });
  };

  const removeImage = (index: number) => {
    setImages((current) =>
      current.filter((_, i) => i !== index)
    );
  };

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (
      !form.name ||
      !form.category ||
      !form.price ||
      (!tones.length && !form.stock)
    ) {
      setFormError("Completa nombre, categoría, precio y stock para crear el producto.");
      return;
    }

    try {
      setIsSaving(true);

      const uploadedUrls = images.map(
        (image) => image.url
      );

      const allImages = [
        ...uploadedUrls,
        ...(form.imageUrl
          ? [form.imageUrl]
          : []),
      ];

      await createProduct({
        name: form.name,
        description: form.description,
        category: form.category,
        price: Number(form.price),
        cost: Number(form.cost || 0),
        stock: tones.length
          ? Object.values(toneStock).reduce((total, quantity) => total + quantity, 0)
          : Number(form.stock),
        imageUrl: allImages[0] ?? "",
        images: allImages,
        tones,
        toneStock,
      });

      router.push("/admin/productos");
    } catch (error) {
      console.error(
        "Error creando producto:",
        error
      );

      setFormError("No se pudo crear el producto. Revisa los datos e inténtalo otra vez.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-pink-50 px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-4xl">

        {/* HEADER */}
        <div className="mb-8 flex items-center gap-4">
          <button
            type="button"
            onClick={() =>
              router.push("/admin/productos")
            }
            aria-label="Volver a productos"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-gray-700 shadow-sm transition hover:bg-pink-100"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-pink-600">
              Agatha Store
            </p>

            <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
              Nuevo producto
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Agrega un nuevo producto al catálogo.
            </p>
          </div>
        </div>

        {/* FORMULARIO */}
        <form
          onSubmit={handleSubmit}
          aria-busy={isSaving}
          className="space-y-6"
        >

          {formError && <p role="alert" aria-live="assertive" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">{formError}</p>}

          {/* INFORMACIÓN */}
          <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">

            <h2 className="mb-6 text-xl font-bold text-gray-900">
              Información del producto
            </h2>

            <div className="grid gap-5 md:grid-cols-2">

              {/* NOMBRE */}
              <div className="md:col-span-2">
                <label htmlFor="product-name" className="mb-2 block text-sm font-semibold text-gray-700">
                  Nombre *
                </label>

                <input
                  id="product-name"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ej. Serum facial"
                  autoCapitalize="words"
                  className="min-h-12 w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />
              </div>

              {/* CATEGORÍA */}
              <div>
                <label htmlFor="product-category" className="mb-2 block text-sm font-semibold text-gray-700">
                  Categoría *
                </label>

                <input
                  id="product-category"
                  name="category"
                  required
                  value={form.category}
                  onChange={handleChange}
                  placeholder="Ej. Facial"
                  autoCapitalize="words"
                  className="min-h-12 w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />
              </div>

              {/* PRECIO */}
              <div>
                <label htmlFor="product-price" className="mb-2 block text-sm font-semibold text-gray-700">
                  Precio *
                </label>

                <input
                  id="product-price"
                  name="price"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  required
                  value={form.price}
                  onChange={handleChange}
                  placeholder="25000"
                  className="min-h-12 w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />
              </div>

              {/* COSTO */}
              <div>
                <label htmlFor="product-cost" className="mb-2 block text-sm font-semibold text-gray-700">
                  Costo
                </label>

                <input
                  id="product-cost"
                  name="cost"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={form.cost}
                  onChange={handleChange}
                  placeholder="15000"
                  className="min-h-12 w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />
              </div>

              {/* STOCK */}
              {!tones.length ? <div>
                <label htmlFor="product-stock" className="mb-2 block text-sm font-semibold text-gray-700">
                  Stock *
                </label>

                <input
                  id="product-stock"
                  name="stock"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  required
                  value={form.stock}
                  onChange={handleChange}
                  placeholder="10"
                  className="min-h-12 w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />
              </div> : <div className="flex flex-col justify-center rounded-xl bg-pink-50 p-4">
                <p className="text-sm font-semibold text-gray-700">Stock total</p>
                <p className="mt-1 text-xl font-bold text-pink-700">{Object.values(toneStock).reduce((total, quantity) => total + quantity, 0)} unidades</p>
                <p className="mt-1 text-xs text-gray-500">Se calcula con las existencias de cada tono.</p>
              </div>}

              <ProductToneEditor tones={tones} toneStock={toneStock} onTonesChange={setTones} onToneStockChange={setToneStock} />

              {/* DESCRIPCIÓN */}
              <div className="md:col-span-2">
                <label htmlFor="product-description" className="mb-2 block text-sm font-semibold text-gray-700">
                  Descripción
                </label>

                <textarea
                  id="product-description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe el producto..."
                  className="min-h-28 w-full resize-y rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />
              </div>

            </div>
          </section>

          {/* IMÁGENES */}
          <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">

            <div className="mb-5">
              <h2 className="text-xl font-bold text-gray-900">
                Imágenes del producto
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Puedes subir varias imágenes desde tu computador.
              </p>
            </div>

            {/* UPLOAD CLOUDINARY */}
            <CldUploadWidget
              uploadPreset="agatha_products"
              options={{
                multiple: true,
                maxFiles: 8,
                resourceType: "image",
                clientAllowedFormats: [
                  "jpg",
                  "jpeg",
                  "png",
                  "webp",
                ],
                maxFileSize: 5000000,
              }}
              onSuccess={handleUploadSuccess}
            >
              {({ open }) => (
                <button
                  type="button"
                  onClick={() => open()}
                  className="flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-pink-200 bg-pink-50 px-6 py-10 text-center transition hover:border-pink-400 hover:bg-pink-100"
                >
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-pink-600 shadow-sm">
                    <Upload size={25} />
                  </div>

                  <p className="font-bold text-gray-900">
                    Seleccionar imágenes
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Puedes seleccionar varias imágenes
                  </p>

                  <p className="mt-2 text-xs text-gray-400">
                    JPG, PNG o WEBP · Máximo 5 MB por imagen
                  </p>
                </button>
              )}
            </CldUploadWidget>

            {/* IMÁGENES SUBIDAS */}
            {images.length > 0 && (
              <div className="mt-6">

                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold text-gray-800">
                    Imágenes seleccionadas
                  </p>

                  <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-pink-600">
                    {images.length} imagen
                    {images.length !== 1
                      ? "es"
                      : ""}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">

                  {images.map(
                    (image, index) => (
                      <div
                        key={image.url}
                        className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50"
                      >
                        <img
                          src={image.url}
                          alt={`Imagen ${index + 1}`}
                          className="aspect-square w-full object-cover"
                        />

                        {index === 0 && (
                          <span className="absolute left-2 top-2 rounded-full bg-pink-600 px-2 py-1 text-[10px] font-bold text-white">
                            PRINCIPAL
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            removeImage(index)
                          }
                          aria-label={`Eliminar imagen ${index + 1}`}
                          className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-md transition hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )
                  )}

                </div>
              </div>
            )}

            {/* URL MANUAL */}
            <div className="mt-6 border-t border-gray-100 pt-6">

              <label htmlFor="product-image-url" className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <ImagePlus size={17} />
                O agregar una imagen mediante URL
              </label>

              <input
                id="product-image-url"
                name="imageUrl"
                value={form.imageUrl}
                onChange={handleChange}
                placeholder="https://ejemplo.com/imagen.jpg"
                inputMode="url"
                className="min-h-12 w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />

              <p className="mt-2 text-xs text-gray-400">
                Si utilizas una URL, se agregará como una imagen adicional.
              </p>

            </div>

          </section>

          {/* BOTONES */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={() =>
                router.push("/admin/productos")
              }
              className="min-h-12 rounded-xl bg-white px-6 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-pink-600 px-7 py-3 font-semibold text-white shadow-sm transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Guardando...
                </>
              ) : (
                "Crear producto"
              )}
            </button>

          </div>

        </form>
      </div>
    </main>
  );
}
