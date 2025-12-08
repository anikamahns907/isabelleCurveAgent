import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-lg font-semibold text-gray-900 hover:text-gray-700"
            >
              Biostats Tutor
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/chat"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Chat
            </Link>
            <Link
              href="/analysis"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Article Analysis
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
