interface ChartPlaceholderProps {
  title: string;
  description: string;
  height?: string;
}

export default function ChartPlaceholder({ 
  title, 
  description, 
  height = "h-64" 
}: ChartPlaceholderProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${height}`}>
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{description}</p>
      <div 
        className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-600 rounded flex items-center justify-center"
        aria-label={`Chart placeholder for ${title}`}
      >
        <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Chart Coming Soon</span>
      </div>
    </div>
  );
}
