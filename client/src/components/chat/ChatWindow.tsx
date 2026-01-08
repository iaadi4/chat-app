import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { useAuth } from "@/contexts/auth.context";
import { useSocket } from "@/contexts/socket.context";
import { chatService } from "@/services/chat.service";
import type {
  Conversation,
  Message,
  User,
} from "@/services/conversation.service";

interface ChatWindowProps {
  conversation: Conversation;
  onBack?: () => void;
}

export function ChatWindow({ conversation, onBack }: ChatWindowProps) {
  const { user } = useAuth();
  const { onlineUsers, joinConversation, leaveConversation, onNewMessage } =
    useSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherParticipant = conversation.participants.find(
    (p) => p.id !== user?.id
  ) as User;

  const isOnline = otherParticipant
    ? onlineUsers.includes(otherParticipant.id)
    : false;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    joinConversation(conversation.id);
    return () => {
      leaveConversation(conversation.id);
    };
  }, [conversation.id, joinConversation, leaveConversation]);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const response = await chatService.getMessages(conversation.id);
        setMessages(response.data.messages);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [conversation.id]);

  useEffect(() => {
    const unsubscribe = onNewMessage((message: Message) => {
      if (message.conversationId === conversation.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });
        setTimeout(scrollToBottom, 100);
      }
    });
    return unsubscribe;
  }, [conversation.id, onNewMessage, scrollToBottom]);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom();
    }
  }, [loading, messages.length, scrollToBottom]);

  const handleSend = async (
    message: string,
    image?: string,
    fileUrl?: string,
    fileName?: string,
    fileType?: string
  ) => {
    try {
      const response = await chatService.sendMessage(
        conversation.id,
        message,
        image,
        fileUrl,
        fileName,
        fileType
      );
      setMessages((prev) => {
        if (prev.some((m) => m.id === response.data.id)) {
          return prev;
        }
        return [...prev, response.data];
      });
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="flex items-center gap-3 p-4 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-lg hover:bg-zinc-800 transition-colors md:hidden"
          >
            <ArrowLeft className="h-5 w-5 text-zinc-400" />
          </button>
        )}
        <div className="relative">
          <Avatar fallback={otherParticipant?.name || "?"} size="md" />
          {isOnline && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-zinc-900" />
          )}
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-zinc-100">
            {otherParticipant?.name}
          </h2>
          <p className="text-xs text-zinc-400">
            <p className="text-xs text-zinc-400">
              {isOnline ? (
                <span className="text-green-400">Online</span>
              ) : (
                "Offline"
              )}
            </p>
          </p>
        </div>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <div className="h-20 w-20 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
              <Avatar fallback={otherParticipant?.name || "?"} size="lg" />
            </div>
            <p className="font-medium text-zinc-300">
              Start a conversation with {otherParticipant?.name}
            </p>
            <p className="text-sm">Say hello! 👋</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => {
              const isOwn = message.senderId === user?.id;
              const prevMessage = messages[index - 1];
              const showAvatar =
                !prevMessage || prevMessage.senderId !== message.senderId;

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      <MessageInput onSend={handleSend} disabled={loading} />
    </div>
  );
}
