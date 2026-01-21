interface SubtextProps {
  children: React.ReactNode;
  className?: string;
}

export default function Subtext({ children, className = '' }: SubtextProps) {
  return (
    <p className={`text-lg md:text-xl text-gray-600 leading-relaxed ${className}`}>
      {children}
    </p>
  );
}
