import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-white">
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl">
            Biostats Tutor
          </h1>
          <p className="mb-12 text-lg text-gray-600 sm:text-xl">
            Your AI-powered biostatistics learning assistant
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/chat"
              className="rounded-lg bg-gray-900 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-gray-800"
            >
              Start Chatting
            </Link>
            <Link
              href="/analysis"
              className="rounded-lg border-2 border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-900 transition-colors hover:border-gray-400 hover:bg-gray-50"
            >
              Analyze Article
            </Link>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                General Chat
              </h2>
              <p className="text-sm text-gray-600">
                Ask questions about biostatistics concepts, get explanations,
                and practice problems.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                Article Analysis
              </h2>
              <p className="text-sm text-gray-600">
                Upload a PDF article and engage in a guided Q&A session with
                personalized feedback.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

