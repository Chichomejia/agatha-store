"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  DndContext,
  closestCenter,
  DragEndEvent,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import { useParams, useRouter } from "next/navigation";

import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  GripVertical,
  ImagePlus,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";

import { CldUploadWidget } from "next-cloudinary";

import {
  getProductById,
  updateProduct,
} from "@/services/productService";
import { isAuthorizedAdmin, observeAuth } from "@/services/authService";
import ProductToneEditor from "@/components/admin/ProductToneEditor";
import FeedbackMessage from "@/components/ui/FeedbackMessage";
import LoadingState from "@/components/ui/LoadingState";

interface UploadedImage {
  url: string;
  publicId: string;
}

function SortableImage({
  image,
  index,
  onRemove,
  onMakePrincipal,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  image: UploadedImage;
  index: number;
  onRemove: () => void;
  onMakePrincipal: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: image.url,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50"
    >
      <img
        src={image.url}
        alt={`Imagen ${index + 1}`}
        className="aspect-square w-full object-cover"
      />
      <div className="grid gap-2 p-2">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Arrastrar imagen ${index + 1} para cambiar el orden`}
            className="inline-flex min-h-11 min-w-11 touch-none items-center justify-center rounded-lg bg-white text-gray-700 shadow-sm"
          >
            <GripVertical size={19} aria-hidden="true" />
          </button>
          <span className={`text-center text-[10px] font-bold ${index === 0 ? "text-pink-700" : "text-gray-500"}`}>
            {index === 0 ? "IMAGEN PRINCIPAL" : `Imagen ${index + 1}`}
          </span>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Eliminar imagen ${index + 1}`}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-red-50 text-red-700"
          >
            <Trash2 size={17} aria-hidden="true" />
          </button>
        </div>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] gap-1">
          {index !== 0 ? (
            <button
              type="button"
              onClick={onMakePrincipal}
              aria-label={`Hacer imagen ${index + 1} la imagen principal`}
              className="min-h-11 min-w-0 rounded-lg bg-pink-50 px-1.5 text-[10px] font-bold text-pink-700 sm:px-2 sm:text-xs"
            >
              <span className="sm:hidden">Principal</span>
              <span className="hidden sm:inline">Hacer principal</span>
            </button>
          ) : <span />}
        <button
          type="button"
          disabled={isFirst}
          onClick={onMoveUp}
          aria-label={`Subir imagen ${index + 1} en el orden`}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-gray-700 disabled:opacity-40"
        >
          <ChevronUp size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          disabled={isLast}
          onClick={onMoveDown}
          aria-label={`Bajar imagen ${index + 1} en el orden`}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-gray-700 disabled:opacity-40"
        >
          <ChevronDown size={18} aria-hidden="true" />
        </button>
        </div>
      </div>
    </div>
  );
}

export default function EditarProductoPage() {
  const router = useRouter();

  useEffect(() => {
    return observeAuth((user) => {
      if (!isAuthorizedAdmin(user)) router.replace("/admin/login");
    });
  }, [router]);
  const params = useParams();

  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [imageAnnouncement, setImageAnnouncement] = useState("");

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
  const [stockNeedsDistribution, setStockNeedsDistribution] = useState(false);

  /* ==========================================
     CARGAR PRODUCTO
  ========================================== */

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);

        const product =
          await getProductById(productId);

        if (!product) {
          setLoadError("No encontramos este producto. Regresa al catálogo y vuelve a intentarlo.");
          return;
        }

        setForm({
          name: product.name,
          description: product.description,
          category: product.category,
          price: String(product.price),
          cost: String(product.cost ?? 0),
          stock: String(product.stock),
          imageUrl: product.image,
        });
        setTones(product.tones ?? []);
        setToneStock(product.toneStock ?? {});
        const savedToneStock = product.toneStock ?? {};
        const distributedStock = Object.values(savedToneStock).reduce((total, quantity) => total + quantity, 0);
        setStockNeedsDistribution(Boolean(product.tones?.length && distributedStock < product.stock));

        const productImages =
          product.images &&
            product.images.length > 0
            ? product.images
            : product.image
              ? [product.image]
              : [];

        setImages(
          productImages.map((url) => ({
            url,
            publicId: "",
          }))
        );
      } catch (error) {
        console.error(
          "Error cargando producto:",
          error
        );

        setLoadError("No se pudo cargar el producto. Comprueba tu conexión e inténtalo de nuevo.");
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadProduct();
    }
  }, [productId, router]);

  /* ==========================================
     CAMBIAR CAMPOS
  ========================================== */

  const handleChange = (
    e: ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
    >
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const setMainImage = (index: number) => {
    setImageAnnouncement(`Imagen ${index + 1} establecida como principal.`);
    setImages((currentImages) => {
      if (index === 0) {
        return currentImages;
      }

      const selectedImage = currentImages[index];

      return [
        selectedImage,
        ...currentImages.filter((_, i) => i !== index),
      ];
    });
  };

  const moveImage = (index: number, offset: -1 | 1) => {
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= images.length) return;
    setImageAnnouncement(`Imagen ${index + 1} movida a la posición ${nextIndex + 1}.`);
    setImages((currentImages) => arrayMove(currentImages, index, nextIndex));
  };

  /* ==========================================
     SUBIR IMAGEN
  ========================================== */

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
      const alreadyExists = current.some(
        (image) => image.url === newImage.url
      );

      if (alreadyExists) {
        return current;
      }

      return [...current, newImage];
    });
  };

  /* ==========================================
     ELIMINAR IMAGEN
  ========================================== */

  const removeImage = (index: number) => {
    setImageAnnouncement(`Imagen ${index + 1} eliminada.`);
    setImages((current) =>
      current.filter((_, i) => i !== index)
    );
  };

  /* ==========================================
     GUARDAR CAMBIOS
  ========================================== */

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setFormError("");

    if (
      !form.name ||
      !form.category ||
      !form.price ||
      (!tones.length && !form.stock)
    ) {
      setFormError("Completa nombre, categoría, precio y stock para guardar los cambios.");

      return;
    }

    try {
      setIsSaving(true);

      const imageUrls = images.map(
        (image) => image.url
      );

      await updateProduct(productId, {
        name: form.name,
        description: form.description,
        category: form.category,
        price: Number(form.price),
        cost: Number(form.cost || 0),
        stock: tones.length
          ? Object.values(toneStock).reduce((total, quantity) => total + quantity, 0)
          : Number(form.stock),
        imageUrl: imageUrls[0] ?? "",
        images: imageUrls,
        tones,
        toneStock,
      });

      router.push("/admin/productos");
    } catch (error) {
      console.error(
        "Error actualizando producto:",
        error
      );

      setFormError("No se pudo actualizar el producto. Revisa los datos e inténtalo otra vez.");
    } finally {
      setIsSaving(false);
    }
  };

  /* ==========================================
     CARGANDO
  ========================================== */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-pink-50" aria-busy="true">
        <LoadingState label="Cargando producto…" />
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-pink-50 px-4 py-8">
        <section className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-sm sm:p-8" aria-labelledby="product-load-error-title">
          <h1 id="product-load-error-title" className="text-xl font-bold text-gray-900">No se pudo abrir el producto</h1>
          <FeedbackMessage tone="error" className="mt-3">{loadError}</FeedbackMessage>
          <button
            type="button"
            onClick={() => router.push("/admin/productos")}
            className="mt-6 min-h-12 w-full rounded-xl bg-pink-600 px-5 py-3 font-semibold text-white transition hover:bg-pink-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-700 sm:w-auto"
          >
            Volver a productos
          </button>
        </section>
      </main>
    );
  }

  /* ==========================================
     INTERFAZ
  ========================================== */

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
              Editar producto
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Modifica la información del producto.
            </p>
          </div>

        </div>

        <form
          onSubmit={handleSubmit}
          aria-busy={isSaving}
          className="space-y-6"
        >

          {formError && <FeedbackMessage tone="error">{formError}</FeedbackMessage>}

          {/* ==================================
              INFORMACIÓN
          ================================== */}

          <section className="rounded-3xl bg-white p-4 shadow-sm sm:p-6">

            <h2 className="mb-6 text-xl font-bold text-gray-900">
              Información del producto
            </h2>

            <div className="grid gap-5 md:grid-cols-2">

              {/* NOMBRE */}

              <div className="md:col-span-2">
                <label htmlFor="edit-product-name" className="mb-2 block text-sm font-semibold text-gray-700">
                  Nombre *
                </label>

                <input
                  id="edit-product-name"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  autoCapitalize="words"
                  className="min-h-12 w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />
              </div>

              {/* CATEGORÍA */}

              <div>
                <label htmlFor="edit-product-category" className="mb-2 block text-sm font-semibold text-gray-700">
                  Categoría *
                </label>

                <input
                  id="edit-product-category"
                  name="category"
                  required
                  value={form.category}
                  onChange={handleChange}
                  autoCapitalize="words"
                  className="min-h-12 w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />
              </div>

              {/* PRECIO */}

              <div>
                <label htmlFor="edit-product-price" className="mb-2 block text-sm font-semibold text-gray-700">
                  Precio *
                </label>

                <input
                  id="edit-product-price"
                  name="price"
                  type="number"
                  min="0"
                  required
                  inputMode="numeric"
                  value={form.price}
                  onChange={handleChange}
                  className="min-h-12 w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />
              </div>

              {/* COSTO */}

              <div>
                <label htmlFor="edit-product-cost" className="mb-2 block text-sm font-semibold text-gray-700">
                  Costo
                </label>

                <input
                  id="edit-product-cost"
                  name="cost"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={form.cost}
                  onChange={handleChange}
                  className="min-h-12 w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />
              </div>

              {/* STOCK */}

              {!tones.length ? <div>
                <label htmlFor="edit-product-stock" className="mb-2 block text-sm font-semibold text-gray-700">
                  Stock *
                </label>

                <input
                  id="edit-product-stock"
                  name="stock"
                  type="number"
                  min="0"
                  required
                  inputMode="numeric"
                  value={form.stock}
                  onChange={handleChange}
                  className="min-h-12 w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />
              </div> : <div className="flex flex-col justify-center rounded-xl bg-pink-50 p-4">
                <p className="text-sm font-semibold text-gray-700">Stock total por tono</p>
                <p className="mt-1 text-xl font-bold text-pink-700">{Object.values(toneStock).reduce((total, quantity) => total + quantity, 0)} unidades</p>
              </div>}

              <ProductToneEditor tones={tones} toneStock={toneStock} onTonesChange={setTones} onToneStockChange={setToneStock} id="edit-product-tones" />
              {stockNeedsDistribution && Object.values(toneStock).reduce((total, quantity) => total + quantity, 0) < Number(form.stock) && (
                <FeedbackMessage tone="warning" className="md:col-span-2">
                  Este producto tiene {form.stock} unidades de stock general que aún no están repartidas entre los tonos. Asigna la cantidad correcta a cada tono antes de volver a venderlo.
                </FeedbackMessage>
              )}

              {/* DESCRIPCIÓN */}

              <div className="md:col-span-2">
                <label htmlFor="edit-product-description" className="mb-2 block text-sm font-semibold text-gray-700">
                  Descripción
                </label>

                <textarea
                  id="edit-product-description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  className="min-h-28 w-full resize-y rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />
              </div>

            </div>

          </section>

          {/* ==================================
              IMÁGENES
          ================================== */}

          <section className="rounded-3xl bg-white p-4 shadow-sm sm:p-6">

            <div className="mb-5">

              <h2 className="text-xl font-bold text-gray-900">
                Imágenes del producto
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Administra las imágenes del producto.
              </p>

            </div>

            {/* SUBIR */}

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
                    Agregar imágenes
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Selecciona imágenes desde tu computador
                  </p>

                  <p className="mt-2 text-xs text-gray-400">
                    JPG, PNG o WEBP · Máximo 5 MB
                  </p>

                </button>
              )}
            </CldUploadWidget>

            {/* GALERÍA CON ARRASTRE */}
            {images.length > 0 && (
              <div className="mt-6">
                <p role="status" aria-live="polite" className="sr-only">{imageAnnouncement}</p>
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold text-gray-800">
                    Imágenes
                  </p>

                  <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-pink-600">
                    {images.length} imagen{images.length !== 1 ? "es" : ""}
                  </span>
                </div>

                <p className="mb-4 text-xs leading-5 text-gray-600">
                  Usa las flechas para ordenar las imágenes desde cualquier dispositivo. La primera será la principal; también puedes arrastrarlas.
                </p>

                <DndContext
                  collisionDetection={closestCenter}
                  onDragEnd={(event: DragEndEvent) => {
                    const { active, over } = event;

                    if (!over || active.id === over.id) {
                      return;
                    }

                    setImages((currentImages) => {
                      const oldIndex = currentImages.findIndex(
                        (image) => image.url === active.id
                      );

                      const newIndex = currentImages.findIndex(
                        (image) => image.url === over.id
                      );

                      if (oldIndex === -1 || newIndex === -1) {
                        return currentImages;
                      }

                      return arrayMove(currentImages, oldIndex, newIndex);
                    });
                  }}
                >
                  <SortableContext
                    items={images.map((image) => image.url)}
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                      {images.map((image, index) => (
                        <SortableImage
                          key={image.url}
                          image={image}
                          index={index}
                          onRemove={() => removeImage(index)}
                          onMakePrincipal={() => setMainImage(index)}
                          onMoveUp={() => moveImage(index, -1)}
                          onMoveDown={() => moveImage(index, 1)}
                          isFirst={index === 0}
                          isLast={index === images.length - 1}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}

            {/* URL */}

            <div className="mt-6 border-t border-gray-100 pt-6">

              <label htmlFor="edit-product-image-url" className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <ImagePlus size={17} />
                Agregar imagen mediante URL
              </label>

              <input
                id="edit-product-image-url"
                name="imageUrl"
                value={form.imageUrl}
                onChange={handleChange}
                placeholder="https://ejemplo.com/imagen.jpg"
                inputMode="url"
                className="min-h-12 w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />

              <p className="mt-2 text-xs text-gray-400">
                La URL reemplazará la imagen principal si no tienes imágenes subidas.
              </p>

            </div>

          </section>

          {/* ==================================
              BOTONES
          ================================== */}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={() =>
                router.push("/admin/productos")
              }
              className="min-h-12 w-full rounded-xl bg-white px-6 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100 sm:w-auto"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-pink-600 px-7 py-3 font-semibold text-white shadow-sm transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
                "Guardar cambios"
              )}
            </button>

          </div>

        </form>
      </div>
    </main>
  );
}
