"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function Home() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[var(--isabelle-bg)] overflow-hidden">

      <AnimatedBackground />

      <main className="relative z-10 mx-auto max-w-4xl px-3 py-16 sm:px-4 lg:px-6 text-center">
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

        <p className="mb-6 text-lg text-gray-600 max-w-2xl mx-auto">
          Your biostatistics peer for concept mastery and research analysis.
        </p>

        <div className="mb-10 max-w-3xl mx-auto text-left space-y-4 text-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">What is Isabelle Curve?</h2>
            <p>
              Isabelle Curve is an intelligent agent system designed to help you master biostatistics concepts 
              and analyze research articles. Whether you need help understanding statistical methods, interpreting 
              results, or working through course materials, Isabelle is here to guide you.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/chat"
            className="rounded-xl bg-[var(--isabelle-primary)] px-7 py-3 text-white font-medium shadow-md hover:bg-blue-900 transition"
          >
            Start Chatting
          </Link>

          <button
            onClick={() => setShowModal(true)}
            className="rounded-xl border-2 border-[var(--isabelle-primary)] px-7 py-3 font-medium text-[var(--isabelle-primary)] hover:bg-[var(--isabelle-accent)]/20 transition"
          >
            Start Article Discussion
          </button>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 backdrop-blur-sm bg-gray-100/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >

          <div 
            className="bg-white shadow-2xl rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Article Analysis Guide</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6 text-gray-700">

                {/* How to Use */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Before You Begin</h3>
                  <p className="text-sm leading-relaxed">
                    The Article Analysis feature will guide you through a structured sequence of 
                    <strong> 10 in-depth questions</strong> about the article you upload. Your responses should be 
                    <strong> multiple full sentences</strong> because they will appear in your exported PDF for 
                    Professor Lipman as part of your assessment.
                  </p>
                </div>

                {/* Requirements */}
                <div className="bg-blue-50 border-l-4 border-[var(--isabelle-primary)] p-4 rounded">
                  <h3 className="font-semibold text-gray-900 mb-2">Article Requirements</h3>
                  <p className="mb-3">
                    You must upload an <strong>empirical biostatistics research article</strong> that includes:
                  </p>

                  <ul className="list-disc list-inside space-y-1 ml-2 mb-3 text-sm">
                    <li>A clear <strong>Methods</strong> section</li>
                    <li>Statistical models or tests (e.g., regression, ANOVA, confidence intervals)</li>
                    <li><strong>Quantitative results</strong> and a Results section</li>
                    <li>An identifiable study design (RCT, cohort study, cross-sectional, etc.)</li>
                  </ul>

                  <p className="text-sm text-gray-700 mb-3">
                    Editorials, news articles, commentaries, summaries, or conceptual papers will be rejected.
                  </p>

                  <h4 className="font-semibold text-gray-900 mb-2">Acceptable Example Articles</h4>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                    <li><em>Effect of High-Dose Vitamin D Supplementation on Bone Density in Adults: A Randomized Controlled Trial</em></li>
                    <li><em>Associations Between Air Pollution Exposure and Asthma Severity: A Cohort Study</em></li>
                    <li><em>Predictors of COVID-19 Mortality Using Logistic Regression in a Hospital System</em></li>
                    <li><em>Impact of Exercise on Blood Pressure: A Meta-Analysis of Controlled Trials</em></li>
                  </ul>

                  <p className="mt-3 text-sm font-medium text-gray-900">
                    Find suitable articles at:
                  </p>
                  <ul className="space-y-1 text-sm">
                    <li>
                      • <a 
                          href="https://bruknow.library.brown.edu/discovery/search?query=any,contains,biostatistics&tab=Everything&search_scope=MyInst_and_CI&vid=01BU_INST:BROWN"
                          target="_blank"
                          className="text-[var(--isabelle-primary)] hover:text-blue-700 underline"
                        >
                          Brown BruKnow Library (recommended)
                        </a>
                    </li>
                    <li>
                      • <a href="https://pubmed.ncbi.nlm.nih.gov/" target="_blank"
                        className="text-[var(--isabelle-primary)] hover:text-blue-700 underline">
                        PubMed
                      </a>
                    </li>
                    <li>
                      • <a href="https://www.nature.com/subjects/biostatistics" target="_blank"
                        className="text-[var(--isabelle-primary)] hover:text-blue-700 underline">
                        Nature — Biostatistics
                      </a>
                    </li>
                    <li>
                      • <a href="https://www.sciencedirect.com" target="_blank"
                        className="text-[var(--isabelle-primary)] hover:text-blue-700 underline">
                        ScienceDirect
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Close
                  </button>
                  <Link
                    href="/analysis"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-[var(--isabelle-primary)] text-white rounded-lg hover:bg-blue-900 transition"
                  >
                    Continue to Analysis
                  </Link>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
