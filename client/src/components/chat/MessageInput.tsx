import { useState, useRef } from "react";
import {
  Send,
  Image as ImageIcon,
  X,
  Loader2,
  Paperclip,
  FileText,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { chatService } from "@/services/chat.service";
import { toast } from "sonner";

interface MessageInputProps {
  onSend: (
    message: string,
    image?: string,
    fileUrl?: string,
    fileName?: string,
    fileType?: string
  ) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled = false }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [fileData, setFileData] = useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingType, setUploadingType] = useState<
    "image" | "file" | "video" | null
  >(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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
      const response = await chatService.uploadFile(file);
      setImage(response.data.url);
    } catch (error) {
      console.error("Failed to upload image:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size too large (max 10MB)");
      return;
    }

    setIsUploading(true);
    try {
      const response = await chatService.uploadFile(file);
      setFileData({
        url: response.data.url,
        name: response.data.fileName,
        type: response.data.fileType,
      });
    } catch (error) {
      console.error("Failed to upload file:", error);
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("Video size too large (max 50MB)");
      return;
    }

    setIsUploading(true);
    try {
      const response = await chatService.uploadFile(file);
      setFileData({
        url: response.data.url,
        name: response.data.fileName,
        type: response.data.fileType,
      });
    } catch (error) {
      console.error("Failed to upload video:", error);
      toast.error("Failed to upload video");
    } finally {
      setIsUploading(false);
      setUploadingType(null);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const handleSend = () => {
    if ((!message.trim() && !image && !fileData) || disabled || isUploading)
      return;

    onSend(
      message.trim(),
      image || undefined,
      fileData?.url,
      fileData?.name,
      fileData?.type
    );
    setMessage("");
    setImage(null);
    setFileData(null);

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
      {fileData && (
        <div className="mb-4 relative inline-flex items-center gap-3 p-3 bg-zinc-800 rounded-xl border border-zinc-700">
          <div className="p-2 bg-zinc-700/50 rounded-lg">
            {fileData.type.startsWith("video/") ? (
              <Video className="h-5 w-5 text-zinc-300" />
            ) : (
              <FileText className="h-5 w-5 text-zinc-300" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-zinc-200 truncate max-w-[200px]">
              {fileData.name}
            </span>
            <span className="text-xs text-zinc-500 uppercase">
              {fileData.type.split("/")[1] || "FILE"}
            </span>
          </div>
          <button
            onClick={() => setFileData(null)}
            className="absolute -top-2 -right-2 p-1 bg-zinc-800 rounded-full border border-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <input
          type="file"
          ref={imageInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          className="hidden"
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          type="file"
          ref={videoInputRef}
          onChange={handleVideoSelect}
          accept="video/*"
          className="hidden"
        />
        <button
          onClick={() => imageInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="p-3 bg-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading && uploadingType === "image" ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImageIcon className="h-5 w-5" />
          )}
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="p-3 bg-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading && uploadingType === "file" ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Paperclip className="h-5 w-5" />
          )}
        </button>
        <button
          onClick={() => videoInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="p-3 bg-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading && uploadingType === "video" ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Video className="h-5 w-5" />
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
          disabled={
            (!message.trim() && !image && !fileData) || disabled || isUploading
          }
          className={cn(
            "p-3 rounded-xl transition-all",
            message.trim() || image || fileData
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
