import { cn } from "@/lib/utils";
import { formatMessageTime } from "@/lib/date";
import type { Message } from "@/services/conversation.service";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
}: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex gap-2 max-w-[80%]",
        isOwn ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {showAvatar && !isOwn && (
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-xs font-medium shrink-0">
          {message.sender.name.charAt(0).toUpperCase()}
        </div>
      )}
      {!showAvatar && !isOwn && <div className="w-8 shrink-0" />}

      <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
        <div
          className={cn(
            "px-4 py-2.5 rounded-2xl break-words",
            isOwn
              ? "bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-br-sm"
              : "bg-zinc-800 text-zinc-100 rounded-bl-sm"
          )}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.message}
          </p>
        </div>
        <span className="text-[10px] text-zinc-500 mt-1 px-1">
          {formatMessageTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}
