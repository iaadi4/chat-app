import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { userService, type SearchUser } from "@/services/user.service";
import {
  conversationService,
  type Conversation,
} from "@/services/conversation.service";
import { toast } from "sonner";

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated: (conversation: Conversation) => void;
}

export function NewConversationDialog({
  open,
  onOpenChange,
  onConversationCreated,
}: NewConversationDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const handleSearch = (value: string) => {
    setSearchQuery(value);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (value.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await userService.search(value);
        setSearchResults(response.data);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    setSearchTimeout(timeout);
  };

  const handleSelectUser = async (user: SearchUser) => {
    setIsCreating(true);
    try {
      const response = await conversationService.create(user.id);
      onConversationCreated(response.data);
      setSearchQuery("");
      setSearchResults([]);
      toast.success("Conversation created!");
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      if (err.response?.data?.message === "Conversation exist") {
        toast.error("Conversation already exists with this user");
      } else {
        toast.error("Failed to create conversation");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setSearchQuery("");
      setSearchResults([]);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Search for a user by email to start a conversation
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="email"
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
              autoFocus
            />
          </div>

          <div className="min-h-[200px] max-h-[300px] overflow-auto">
            {isSearching ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 text-violet-500 animate-spin" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-1">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    disabled={isCreating}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/50 transition-colors disabled:opacity-50"
                  >
                    <Avatar fallback={user.name} size="md" />
                    <div className="flex-1 text-left">
                      <p className="font-medium text-zinc-100">{user.name}</p>
                      <p className="text-sm text-zinc-400">{user.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : searchQuery.length >= 2 ? (
              <div className="flex flex-col items-center justify-center h-32 text-zinc-500">
                <p>No users found</p>
                <p className="text-sm">Try a different email</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-zinc-500">
                <Search className="h-8 w-8 mb-2 opacity-50" />
                <p>Enter at least 2 characters to search</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
