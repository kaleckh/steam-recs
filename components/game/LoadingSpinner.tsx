export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[#1b2838] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#66c0f4] mx-auto"></div>
        <p className="text-[#c7d5e0] text-lg">Loading game details...</p>
      </div>
    </div>
  );
}
