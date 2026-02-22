"use client";

export default function ProjectTableSkeleton() {
  return (
    <div className="max-w-4xl rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-auto">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100">
            <tr className="rounded-lg animate-pulse">
              <th className="rounded-tl-lg px-6 py-4 text-left">
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </th>
              <th className="px-6 py-4 text-left">
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
              </th>
              <th className="px-6 py-4 text-left">
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
              </th>
              <th className="px-6 py-4 text-left">
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
              </th>
              <th className="rounded-tr-lg px-6 py-4 text-center">
                <div className="h-4 w-16 bg-gray-200 rounded mx-auto"></div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-8 bg-gray-200 rounded"></div>
                    <div className="h-4 w-4 bg-gray-200 rounded"></div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="h-6 w-6 bg-gray-200 rounded mx-auto"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
