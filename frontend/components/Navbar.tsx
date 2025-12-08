import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto w-full px-6 sm:px-8 lg:px-10">
        <div className="flex h-16 items-center justify-between">

          {/* Logo + Title */}
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-80 transition"
          >
            <Image
              src="/logo.png"
              alt="Isabelle Curve Logo"
              width={36}
              height={36}
              className="rounded-md"
            />
            <span className="text-lg font-semibold text-[var(--isabelle-primary)]">
              Isabelle Curve
            </span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-8 text-sm">
            <Link href="/chat" className="text-gray-700 hover:text-[var(--isabelle-primary)]">
              Chat
            </Link>
            <Link href="/analysis" className="text-gray-700 hover:text-[var(--isabelle-primary)]">
              Start Article Discussion
            </Link>
            <Link href="/resources" className="text-gray-700 hover:text-[var(--isabelle-primary)]">
              Resources
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
