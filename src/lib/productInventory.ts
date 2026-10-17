import type { Product } from "@/types/Product";

export function getToneStock(product: Product, tone: string | undefined) {
  if (!tone || !product.tones?.includes(tone)) return 0;
  const quantity = product.toneStock?.[tone];
  return Number.isSafeInteger(quantity) && Number(quantity) >= 0 ? Number(quantity) : 0;
}

export function getAvailableStock(product: Product) {
  if (!product.tones?.length) return product.stock;
  return product.tones.reduce((total, tone) => total + getToneStock(product, tone), 0);
}
