import ReactMarkdown from "react-markdown";

interface AnalysisMessageBlockProps {
  reflection: string;
  clarification: string;
  followupQuestion: string | null;
}

export default function AnalysisMessageBlock({
  reflection,
  clarification,
  followupQuestion,
}: AnalysisMessageBlockProps) {
  return (
    <div className="space-y-4 rounded-2xl bg-gray-50 p-5">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-700">
          Reflection
        </h3>
        <div className="text-sm text-gray-900">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            }}
          >
            {reflection}
          </ReactMarkdown>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-700">
          Clarification
        </h3>
        <div className="text-sm text-gray-900">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            }}
          >
            {clarification}
          </ReactMarkdown>
        </div>
      </div>

      {followupQuestion && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Follow-up Question
          </h3>
          <div className="text-sm text-gray-900">
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0">{children}</p>
                ),
              }}
            >
              {followupQuestion}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
