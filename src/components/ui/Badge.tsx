interface BadgeProps {
  children: React.ReactNode;
  variant?: "new" | "sale" | "bestseller" | "featured";
}

const variants = {
  new: "bg-pink-600 text-white",
  sale: "bg-red-500 text-white",
  bestseller: "bg-black text-white",
  featured: "bg-yellow-400 text-gray-900",
};

export default function Badge({
  children,
  variant = "new",
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        px-3
        py-1
        text-xs
        font-semibold
        shadow-md
        transition-all
        duration-300
        hover:scale-105
        ${variants[variant]}
      `}
    >
      {children}
    </span>
  );
}