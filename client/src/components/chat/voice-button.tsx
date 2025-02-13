import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { startListening, stopListening } from "@/lib/speech";

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceButton({ onTranscript, disabled }: VoiceButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();

  const handleVoiceInput = async () => {
    if (isListening) {
      stopListening();
      setIsListening(false);
      return;
    }

    try {
      setIsListening(true);
      const transcript = await startListening();
      if (transcript) {
        onTranscript(transcript);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start voice input. Please check your microphone permissions.",
        variant: "destructive",
      });
    } finally {
      setIsListening(false);
    }
  };

  return (
    <Button
      size="icon"
      variant={isListening ? "destructive" : "secondary"}
      onClick={handleVoiceInput}
      disabled={disabled}
    >
      <Mic className={`h-5 w-5 ${isListening ? "animate-pulse" : ""}`} />
    </Button>
  );
}
