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
    <div className="space-y-4 rounded-2xl bg-white border border-[var(--isabelle-accent)] p-5 shadow-sm">

      <div>
        <h3 className="mb-2 text-sm font-semibold text-[var(--isabelle-primary)]">
          Reflection
        </h3>
        <div className="text-sm text-gray-900">
          <ReactMarkdown>{reflection}</ReactMarkdown>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-[var(--isabelle-primary)]">
          Clarification
        </h3>
        <div className="text-sm text-gray-900">
          <ReactMarkdown>{clarification}</ReactMarkdown>
        </div>
      </div>

      {followupQuestion && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-[var(--isabelle-primary)]">
            Follow-up Question
          </h3>
          <div className="text-sm text-gray-900">
            <ReactMarkdown>{followupQuestion}</ReactMarkdown>
          </div>
        </div>
      )}

    </div>
  );
}
