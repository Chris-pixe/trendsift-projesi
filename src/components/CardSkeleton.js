export default function CardSkeleton() {
  return (
    <div className="bg-gray-800 p-4 rounded-lg animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-700 rounded w-1/6"></div>
      </div>
      <div className="space-y-3">
        <div className="h-2 bg-gray-700 rounded"></div>
        <div className="h-2 bg-gray-700 rounded w-5/6"></div>
      </div>
      <div className="flex items-center space-x-4 mt-4 text-sm text-gray-400">
        <div className="h-3 bg-gray-700 rounded w-1/4"></div>
        <div className="h-3 bg-gray-700 rounded w-1/4"></div>
      </div>
    </div>
  );
}
