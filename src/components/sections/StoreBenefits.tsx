import { MessageCircle, PackageCheck, Sparkles } from "lucide-react";

const benefits = [
  {
    title: "Atención por WhatsApp",
    description: "Resuelve tus dudas y coordina los detalles de tu pedido con atención personal.",
    icon: MessageCircle,
  },
  {
    title: "Envío coordinado contigo",
    description: "Te confirmamos el costo por WhatsApp. Entrega estimada: 1 a 5 días hábiles.",
    icon: PackageCheck,
  },
  {
    title: "Productos seleccionados",
    description: "Belleza y cuidado facial, corporal y capilar elegidos para acompañar tu rutina.",
    icon: Sparkles,
  },
];

export default function StoreBenefits() {
  return (
    <section
      aria-label="Beneficios de comprar en Agatha Store"
      className="relative z-10 mx-auto -mt-4 max-w-7xl px-4 sm:-mt-8 sm:px-6"
    >
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4 lg:gap-5">
        {benefits.map(({ title, description, icon: Icon }) => (
          <article
            key={title}
            className="flex items-start gap-3 rounded-2xl border border-pink-100/90 bg-white/95 p-4 shadow-[0_12px_30px_rgba(31,41,55,0.06)] backdrop-blur sm:gap-4 sm:rounded-3xl sm:p-5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-pink-600 sm:h-11 sm:w-11">
              <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold leading-5 text-gray-900 sm:text-base">
                {title}
              </h2>
              <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm sm:leading-6">
                {description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
