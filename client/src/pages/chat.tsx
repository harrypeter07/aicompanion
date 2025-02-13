import { Card } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import type { Message } from "@shared/schema";
import MessageList from "@/components/chat/message-list";
import MessageInput from "@/components/chat/message-input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { speakText, stopSpeaking } from "@/lib/speech-synthesis";

export default function ChatPage() {
  const { toast } = useToast();

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", "/api/messages", {
        content,
        role: "user",
        metadata: {
          isVoice: true, // Enable voice by default
        },
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      // Speak the assistant's response
      const data = response.json();
      if (data.assistantMessage?.content) {
        speakText(data.assistantMessage.content);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const { mutate: clearChat } = useMutation({
    mutationFn: async () => {
      stopSpeaking(); // Stop any ongoing speech
      return apiRequest("DELETE", "/api/messages");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      toast({
        title: "Success",
        description: "Chat history cleared",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-primary">AI Companion</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => clearChat()}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </header>

      <main className="flex-1 container max-w-4xl mx-auto p-4 flex flex-col">
        <Card className="flex-1 p-4 flex flex-col gap-4 mb-4">
          <MessageList messages={messages} isLoading={isLoading} />
        </Card>

        <MessageInput
          onSend={sendMessage}
          disabled={isSending}
        />
      </main>
    </div>
  );
}