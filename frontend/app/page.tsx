import Image from "next/image";
import Link from "next/link";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function Home() {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[var(--isabelle-bg)] overflow-hidden">

      <AnimatedBackground />

      <main className="relative z-10 mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <div className="flex justify-center mb-6">
          <Image
            src="/logo.png"
            width={160}
            height={160}
            alt="Isabelle Curve Logo"
            className="drop-shadow-xl rounded-md"
          />
        </div>

        <h1 className="mb-3 text-4xl font-bold text-[var(--isabelle-primary)] sm:text-5xl">
          Isabelle Curve
        </h1>

        <p className="mb-10 text-lg text-gray-600">
          Your AI-powered biostatistics peer for concept mastery and research analysis.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/chat"
            className="rounded-xl bg-[var(--isabelle-primary)] px-7 py-3 text-white font-medium shadow-md hover:bg-blue-900 transition"
          >
            Start Chatting
          </Link>

          <Link
            href="/analysis"
            className="rounded-xl border-2 border-[var(--isabelle-primary)] px-7 py-3 font-medium text-[var(--isabelle-primary)] hover:bg-[var(--isabelle-accent)]/20 transition"
          >
            Analyze Article
          </Link>
        </div>
      </main>
    </div>
  );
}
