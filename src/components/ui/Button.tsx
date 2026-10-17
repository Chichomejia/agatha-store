type ButtonProps = {
  children: React.ReactNode;
};

export default function Button({ children }: ButtonProps) {
  return (
    <button
      className="
      rounded-full
      bg-pink-500
      px-7
      py-3
      text-white
      font-medium
      transition-all
      duration-300
      hover:scale-105
      hover:shadow-xl
      hover:bg-pink-600
      active:scale-95
      "
    >
      {children}
    </button>
  );
}