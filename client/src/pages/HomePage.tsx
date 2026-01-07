import { useState } from "react";
import { ConversationSidebar, ChatWindow } from "@/components/chat";
import { MessageCircle } from "lucide-react";
import type { Conversation } from "@/services/conversation.service";

export function HomePage() {
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const handleSelectConversation = (conversation: Conversation) => {
    setActiveConversation(conversation);
    setMobileShowChat(true);
  };

  const handleBack = () => {
    setMobileShowChat(false);
  };

  return (
    <div className="h-screen flex bg-zinc-950">
      <div
        className={`w-full md:w-96 lg:w-[420px] shrink-0 flex flex-col ${
          mobileShowChat ? "hidden md:flex" : "flex"
        }`}
      >
        <ConversationSidebar
          activeConversationId={activeConversation?.id || null}
          onSelectConversation={handleSelectConversation}
        />
      </div>

      <div
        className={`flex-1 ${
          mobileShowChat ? "flex" : "hidden md:flex"
        } flex-col`}
      >
        {activeConversation ? (
          <ChatWindow conversation={activeConversation} onBack={handleBack} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 bg-zinc-950">
            <div className="p-6 rounded-full bg-zinc-900 mb-4">
              <MessageCircle className="h-16 w-16 text-zinc-600" />
            </div>
            <h2 className="text-2xl font-semibold text-zinc-300 mb-2">
              Select a conversation
            </h2>
            <p className="text-zinc-500 text-center max-w-md">
              Choose a conversation from the sidebar or start a new one to begin
              messaging
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
