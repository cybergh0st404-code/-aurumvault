export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-black dark:bg-[#000] dark:text-[#fff] px-4 font-sans select-none">
      <div className="flex items-center space-x-5">
        <h1 className="text-2xl font-semibold border-r border-gray-300 dark:border-gray-700 pr-5 py-2 tracking-tight">
          404
        </h1>
        <p className="text-sm text-gray-700 dark:text-gray-300 font-normal">
          This page could not be found.
        </p>
      </div>
    </div>
  )
}
