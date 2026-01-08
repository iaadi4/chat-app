import { useState, useRef } from "react";
import { Send, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { chatService } from "@/services/chat.service";
import { toast } from "sonner";

interface MessageInputProps {
  onSend: (message: string, image?: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled = false }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size too large (max 5MB)");
      return;
    }

    setIsUploading(true);
    try {
      const response = await chatService.uploadImage(file);
      setImage(response.data.url);
    } catch (error) {
      console.error("Failed to upload image:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSend = () => {
    if ((!message.trim() && !image) || disabled || isUploading) return;

    onSend(message.trim(), image || undefined);
    setMessage("");
    setImage(null);

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
      {image && (
        <div className="mb-4 relative inline-block">
          <img
            src={image}
            alt="Preview"
            className="h-24 w-auto rounded-lg border border-zinc-700 object-cover"
          />
          <button
            onClick={() => setImage(null)}
            className="absolute -top-2 -right-2 p-1 bg-zinc-800 rounded-full border border-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="p-3 bg-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImageIcon className="h-5 w-5" />
          )}
        </button>
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
          disabled={(!message.trim() && !image) || disabled || isUploading}
          className={cn(
            "p-3 rounded-xl transition-all",
            message.trim() || image
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
