import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/services/conversation.service";
import { useAuth } from "@/contexts/auth.context";
import { useSocket } from "@/contexts/socket.context";
import { formatDistanceToNow } from "@/lib/date";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationItem({
  conversation,
  isActive,
  onClick,
}: ConversationItemProps) {
  const { user } = useAuth();
  const { onlineUsers } = useSocket();

  const otherParticipant = conversation.participants.find(
    (p) => p.id !== user?.id
  );

  const lastMessage = conversation.chats[0];
  const isOnline = otherParticipant
    ? onlineUsers.includes(otherParticipant.id)
    : false;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
        isActive
          ? "bg-violet-500/20 border border-violet-500/30"
          : "hover:bg-zinc-800/50 border border-transparent"
      )}
    >
      <div className="relative">
        <Avatar fallback={otherParticipant?.name || "?"} size="md" />
        {isOnline && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-zinc-900" />
        )}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between">
          <p className="font-medium text-zinc-100 truncate">
            {otherParticipant?.name || "Unknown"}
          </p>
          {lastMessage && (
            <span className="text-xs text-zinc-500">
              {formatDistanceToNow(lastMessage.createdAt)}
            </span>
          )}
        </div>
        <p className="text-sm text-zinc-400 truncate">
          {lastMessage?.message || "No messages yet"}
        </p>
      </div>
    </button>
  );
}
