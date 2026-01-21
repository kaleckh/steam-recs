interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

export default function FeatureCard({ title, description, icon, href }: FeatureCardProps) {
  return (
    <a 
      href={href}
      className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all hover:-translate-y-1 group"
      aria-label={`${title}: ${description}`}
    >
      <div className="mb-4 text-blue-600 group-hover:text-blue-700 transition-colors" aria-hidden="true">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center">{description}</p>
    </a>
  );
}
