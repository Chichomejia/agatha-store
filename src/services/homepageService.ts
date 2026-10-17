import { doc, getDoc, setDoc } from "firebase/firestore";

import { db } from "@/services/firebase";

export interface HomepageSettings {
  eyebrow: string;
  headline: string;
  highlight: string;
  description: string;
  imageUrl: string;
}

export const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettings = {
  eyebrow: "Tu rutina, tu esencia",
  headline: "Belleza que",
  highlight: "inspira confianza",
  description:
    "Productos para el cuidado facial, corporal y capilar cuidadosamente seleccionados para resaltar tu esencia.",
  imageUrl: "/images/hero.jpg",
};

const homepageRef = doc(db, "storefront", "homepage");

export async function getHomepageSettings(): Promise<HomepageSettings> {
  const snapshot = await getDoc(homepageRef);
  if (!snapshot.exists()) return DEFAULT_HOMEPAGE_SETTINGS;

  const saved = snapshot.data();
  return {
    eyebrow: typeof saved.eyebrow === "string" ? saved.eyebrow : DEFAULT_HOMEPAGE_SETTINGS.eyebrow,
    headline: typeof saved.headline === "string" ? saved.headline : DEFAULT_HOMEPAGE_SETTINGS.headline,
    highlight: typeof saved.highlight === "string" ? saved.highlight : DEFAULT_HOMEPAGE_SETTINGS.highlight,
    description: typeof saved.description === "string" ? saved.description : DEFAULT_HOMEPAGE_SETTINGS.description,
    imageUrl: typeof saved.imageUrl === "string" ? saved.imageUrl : DEFAULT_HOMEPAGE_SETTINGS.imageUrl,
  };
}

export async function saveHomepageSettings(settings: HomepageSettings) {
  await setDoc(homepageRef, settings);
}
