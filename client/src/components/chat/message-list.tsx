import { type Message } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Mic, User2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 pr-4">
      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3 text-sm",
              message.role === "assistant" ? "flex-row" : "flex-row-reverse"
            )}
          >
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center",
                message.role === "assistant"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {message.role === "assistant" ? (
                <div className="w-4 h-4 rounded-full bg-primary-foreground" />
              ) : (
                <User2 className="h-4 w-4" />
              )}
            </div>
            
            <div
              className={cn(
                "rounded-lg px-4 py-2 max-w-[80%]",
                message.role === "assistant"
                  ? "bg-muted"
                  : "bg-primary text-primary-foreground"
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.metadata?.isVoice && (
                <Mic className="h-3 w-3 inline-block ml-2 opacity-50" />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
