import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo + Title */}
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Isabelle Curve Logo"
              width={36}
              height={36}
              className="rounded-md"
            />
            <Link
              href="/"
              className="text-lg font-semibold text-[var(--isabelle-primary)] hover:text-blue-700 transition"
            >
              Isabelle Curve
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-6 text-sm">
            <Link href="/chat" className="text-gray-700 hover:text-[var(--isabelle-primary)]">
              Chat
            </Link>
            <Link href="/analysis" className="text-gray-700 hover:text-[var(--isabelle-primary)]">
              Article Analysis
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
