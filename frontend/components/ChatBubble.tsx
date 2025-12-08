import ReactMarkdown from "react-markdown";

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
}

export default function ChatBubble({ message, isUser }: ChatBubbleProps) {
  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? "bg-[var(--isabelle-primary)] text-white"
            : "bg-[var(--color-bubble-assistant)] text-[var(--isabelle-primary)]"
        }`}
      >
        <div className="prose prose-sm max-w-none dark:prose-invert text-sm leading-relaxed">
          <ReactMarkdown>{message}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
