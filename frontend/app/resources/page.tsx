export default function ResourcesPage() {
  return (
    <div className="flex h-screen flex-col bg-white">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-3 py-8 sm:px-4 lg:px-6">
          <div className="text-center mb-8">
            <h1 className="mb-2 text-2xl font-semibold text-gray-900">
              Resources
            </h1>
            <p className="text-gray-600">
              Course resources and article databases
            </p>
          </div>

          <div className="space-y-6">
            {/* Course Resources */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Course Resources</h2>
              <div className="bg-[var(--isabelle-bg)] rounded-lg border border-gray-200 p-6">
                <ul className="space-y-3">
                  <li>
                    <a
                      href="https://edstem.org/us/courses/80840/discussion"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--isabelle-primary)] hover:text-blue-700 hover:underline"
                    >
                      EdStem Discussion
                    </a>
                    <span className="text-xs text-gray-500 ml-2">(opens in new tab)</span>
                  </li>
                  <li>
                    <a
                      href="mailto:peter_lipman@brown.edu"
                      className="text-[var(--isabelle-primary)] hover:text-blue-700 hover:underline"
                    >
                      Email Professor: Peter Lipman
                    </a>
                  </li>
                </ul>
              </div>
            </section>

            {/* Article Databases */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Article Databases</h2>
              <div className="bg-[var(--isabelle-bg)] rounded-lg border border-gray-200 p-6">
                <p className="text-sm text-gray-700 mb-4">
                  Find empirical research articles for your analysis:
                </p>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="https://bruknow.library.brown.edu/discovery/search?query=any,contains,research%20articles&tab=CentralIndex&search_scope=CentralIndex&vid=01BU_INST:BROWN&mfacet=topic,include,Life%20Sciences%20%26%20Biomedicine,1&mfacet=topic,include,Science%20%26%20Technology,1&mfacet=topic,include,Humans,1&mfacet=topic,include,Physical%20Sciences,1&mfacet=topic,include,Technology,1&mfacet=topic,include,Biological%20And%20Medical%20Sciences,1&mfacet=topic,include,Social%20Sciences,1&mfacet=topic,include,Biochemistry%20%26%20Molecular%20Biology,1&mfacet=topic,include,Medical%20Sciences,1&mfacet=topic,include,Exact%20Sciences%20And%20Technology,1&mfacet=topic,include,Science%20%26%20Technology%20-%20Other%20Topics,1&mfacet=topic,include,Materials%20Science,1&mfacet=topic,include,Physics,1&mfacet=topic,include,Chemistry,1&mfacet=topic,include,Adult,1&mfacet=topic,include,Animals,1&mfacet=topic,include,Engineering,1&mfacet=topic,include,Male,1&mfacet=topic,include,Female,1&mfacet=topic,include,Middle%20Aged,1&lang=en&offset=0"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--isabelle-primary)] hover:text-blue-700 hover:underline"
                    >
                      Brown BruKnow Library
                    </a>
                    <span className="text-xs text-gray-500 ml-2">(opens in new tab)</span>
                    <p className="text-xs text-gray-500 mt-1">Search for biostatistics research articles</p>
                  </li>
                  <li>
                    <a
                      href="https://pubmed.ncbi.nlm.nih.gov/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--isabelle-primary)] hover:text-blue-700 hover:underline"
                    >
                      PubMed
                    </a>
                    <span className="text-xs text-gray-500 ml-2">(opens in new tab)</span>
                    <p className="text-xs text-gray-500 mt-1">Biomedical research database</p>
                  </li>
                  <li>
                    <a
                      href="https://www.nature.com/subjects/public-health"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--isabelle-primary)] hover:text-blue-700 hover:underline"
                    >
                      Nature Public Health
                    </a>
                    <span className="text-xs text-gray-500 ml-2">(opens in new tab)</span>
                    <p className="text-xs text-gray-500 mt-1">Peer-reviewed research articles</p>
                  </li>
                  <li>
                    <a
                      href="https://www.sciencedirect.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--isabelle-primary)] hover:text-blue-700 hover:underline"
                    >
                      ScienceDirect
                    </a>
                    <span className="text-xs text-gray-500 ml-2">(opens in new tab)</span>
                    <p className="text-xs text-gray-500 mt-1">Scientific publications</p>
                  </li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
