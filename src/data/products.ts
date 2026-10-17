import { Product } from "@/types/Product";

export const products: Product[] = [
  {
  id: "1",
  name: "Sérum Vitamina C",
  description: "Ilumina y protege la piel.",
  price: 79900,
  image: "/images/products/serum.jpg",
  images: [
    "/images/products/serum.jpg",
  ],
  category: "Facial",
  rating: 5,
  stock: 15,
},
  {
    id: "2",
    name: "Crema Hidratante",
    description: "Hidratación profunda durante 24 horas.",
    price: 69900,
    image : "/images/products/crema.jpg",
    images: [ "/images/products/crema.jpg",
      "/images/products/crema1.jpg",
    ],
    category: "Facial",
    rating: 5,
    stock: 10,
  },
  {
  id: "3",
  name: "Shampoo Reparador",
  description: "Fortalece y revitaliza el cabello.",
  price: 45900,
  image: "/images/products/shampoo.jpg",
  images: [
    "/images/products/shampoo.jpg",
  ],
  category: "Capilar",
  rating: 4,
  stock: 20,
},
  {
    id: "4",
    name: "Aceite Corporal",
    description: "Nutrición e hidratación para la piel.",
    price: 59900,
    image: "/images/products/aceite.jpg",
    images: [
      "/images/products/aceite.jpg",
    ],
    category: "Corporal",
    rating: 5,
    stock: 12,
  },
];
