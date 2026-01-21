interface HeadlineProps {
  children: React.ReactNode;
  className?: string;
}

export default function Headline({ children, className = '' }: HeadlineProps) {
  return (
    <h1 
      className={`text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight ${className}`}
    >
      {children}
    </h1>
  );
}
