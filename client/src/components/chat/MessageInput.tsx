import { useState, useRef } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled = false }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 120) + "px";

      textareaRef.current.style.overflowY =
        scrollHeight > 120 ? "auto" : "hidden";
    }
  };

  const handleSend = () => {
    if (!message.trim() || disabled) return;

    onSend(message.trim());
    setMessage("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.overflowY = "hidden";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            rows={1}
            className={cn(
              "w-full px-4 py-3 pr-12 bg-zinc-800/50 border border-zinc-700 rounded-2xl text-sm text-zinc-100 placeholder:text-zinc-500 resize-none",
              "focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className={cn(
            "p-3 rounded-xl transition-all",
            message.trim()
              ? "bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:from-violet-600 hover:to-blue-600"
              : "bg-zinc-800 text-zinc-400 cursor-not-allowed"
          )}
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
