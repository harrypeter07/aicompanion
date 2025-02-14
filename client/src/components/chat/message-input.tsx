import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import VoiceButton from "./voice-button";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (message.trim()) {
      onSend(message.trim());
      setMessage("");
    }
  };

  return (
    <div className="flex gap-2">
      <VoiceButton onTranscript={(text) => onSend(text)} disabled={disabled} />

      <div className="flex-1 flex gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="min-h-[52px] max-h-32 flex-1 resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none text-lg placeholder:text-muted-foreground/50"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={disabled || !message.trim()}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}