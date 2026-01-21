interface CTAButtonProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
  variant?: 'primary' | 'secondary';
}

export default function CTAButton({ 
  href, 
  onClick, 
  children, 
  ariaLabel,
  variant = 'primary' 
}: CTAButtonProps) {
  const baseClasses = "inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg transition-all focus:outline-none focus:ring-4";
  const variantClasses = variant === 'primary' 
    ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-300 shadow-lg hover:shadow-xl" 
    : "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-300";

  const classes = `${baseClasses} ${variantClasses}`;

  if (href) {
    return (
      <a href={href} className={classes} aria-label={ariaLabel}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={classes} aria-label={ariaLabel}>
      {children}
    </button>
  );
}
