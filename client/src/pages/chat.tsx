import { Card } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import type { Message } from "@shared/schema";
import MessageList from "@/components/chat/message-list";
import MessageInput from "@/components/chat/message-input";
import { Button } from "@/components/ui/button";
import { LogOut, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { speakText, stopSpeaking } from "@/lib/speech-synthesis";
import { useAuth } from "@/hooks/use-auth";
import { gsap } from "gsap";
import { useEffect, useRef } from "react";

export default function ChatPage() {
  const { toast } = useToast();
  const { user, logoutMutation } = useAuth();
  const headerRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (headerRef.current && mainRef.current) {
      gsap.from(headerRef.current, {
        y: -50,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
      });

      gsap.from(mainRef.current, {
        y: 50,
        opacity: 0,
        duration: 0.8,
        delay: 0.3,
        ease: "power3.out"
      });
    }
  }, []);

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/messages", {
        content,
        role: "user",
        metadata: {
          isVoice: true,
        },
      });
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
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
      stopSpeaking();
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
      <header ref={headerRef} className="border-b px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-primary">AI Companion</h1>
          {user && <span className="text-sm text-muted-foreground">Welcome, {user.username}</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => clearChat()}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => logoutMutation.mutate()}
            className="text-muted-foreground"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main ref={mainRef} className="flex-1 container max-w-4xl mx-auto p-4 flex flex-col">
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