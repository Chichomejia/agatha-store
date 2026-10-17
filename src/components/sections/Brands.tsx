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
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold">
            Marcas de
            <span className="text-pink-600"> confianza</span>
          </h2>

          <p className="text-gray-500 mt-3">
            Trabajamos con marcas reconocidas mundialmente.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">

          {brands.map((brand) => (
            <div
              key={brand}
              className="
                h-28
                rounded-3xl
                bg-pink-50
                flex
                items-center
                justify-center
                text-xl
                font-bold
                text-gray-700
                hover:bg-pink-600
                hover:text-white
                hover:scale-105
                transition-all
                duration-300
                cursor-pointer
              "
            >
              {brand}
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}