export default function Brands() {
  const brands = [
    "CeraVe",
    "La Roche-Posay",
    "Eucerin",
    "ISDIN",
    "Bioderma",
    "Cetaphil",
  ];

  return (
    <section className="border-y border-pink-100/70 bg-white py-12 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        <div className="mb-7 text-center sm:mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-pink-600 sm:text-sm">Selección cuidada</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Marcas de
            <span className="text-pink-600"> confianza</span>
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-500 sm:mt-3 sm:text-base">
            Trabajamos con marcas reconocidas mundialmente.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">

          {brands.map((brand) => (
            <div
              key={brand}
              className="flex min-h-20 items-center justify-center break-words rounded-2xl border border-pink-100 bg-gradient-to-br from-white to-pink-50 px-3 text-center font-[var(--font-playfair)] text-base font-semibold text-gray-700 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-md sm:min-h-24 sm:rounded-3xl sm:text-lg"
            >
              {brand}
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}
