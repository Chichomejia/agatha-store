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
    <div className="text-center mb-12">

      <h2 className="text-4xl lg:text-5xl font-bold">

        {title}

        {highlight && (
          <span className="text-pink-600">
            {" "}
            {highlight}
          </span>
        )}

      </h2>

      {subtitle && (
        <p className="mt-4 text-gray-500 max-w-xl mx-auto">
          {subtitle}
        </p>
      )}

    </div>
  );
}