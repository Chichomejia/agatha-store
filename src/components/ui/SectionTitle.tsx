interface Props {
  title: string;
  highlight?: string;
  subtitle?: string;
}

export default function SectionTitle({
  title,
  highlight,
  subtitle,
}: Props) {
  return (
    <div className="mb-8 text-center sm:mb-12">

      <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">

        {title}

        {highlight && (
          <span className="text-pink-600">
            {" "}
            {highlight}
          </span>
        )}

      </h2>

      {subtitle && (
        <p className="mx-auto mt-3 max-w-xl px-4 text-sm leading-7 text-gray-500 sm:mt-4 sm:px-0 sm:text-base">
          {subtitle}
        </p>
      )}

    </div>
  );
}
