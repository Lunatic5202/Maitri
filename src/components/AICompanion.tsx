import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, 
  Send, 
  Mic, 
  MicOff,
  Bot,
  User,
  Heart,
  Zap
} from "lucide-react";
import maitriAvatar from "@/assets/maitri-logo.jpg";

interface Message {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
  emotion?: string;
}

const AICompanion = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hello! I'm MAITRI, your AI companion for psychological well-being. How are you feeling today? I'm here to listen and support you through your mission.",
      timestamp: new Date(),
      emotion: 'supportive'
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userContent = inputMessage.trim();
    const newUserMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: userContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const conversationHistory = [...messages, newUserMessage].map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-companion`;
      
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: conversationHistory }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: "Rate Limit Exceeded",
            description: "Please wait a moment before sending another message.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        if (response.status === 402) {
          toast({
            title: "Service Unavailable",
            description: "AI service quota exceeded. Please contact support.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        throw new Error('Failed to get AI response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) throw new Error('No response stream');

      let aiMessageContent = "";
      let aiMessageId = Date.now().toString();
      
      // Add empty AI message that we'll update
      setMessages(prev => [...prev, {
        id: aiMessageId,
        type: 'ai',
        content: "",
        timestamp: new Date(),
        emotion: 'supportive'
      }]);

      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              aiMessageContent += content;
              setMessages(prev => prev.map(msg => 
                msg.id === aiMessageId 
                  ? { ...msg, content: aiMessageContent }
                  : msg
              ));
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    setIsListening(!isListening);
  };

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gradient-cosmic mb-4">
            AI Psychological Companion
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            24/7 emotional support and intervention system for astronaut mental health
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          
          {/* AI Avatar & Status */}
          <Card className="lg:col-span-1 cosmic-glow holographic scan-lines">
            <CardHeader className="text-center">
              <div className="relative mx-auto mb-4">
                <img
                  src={maitriAvatar}
                  alt="MAITRI AI"
                  className="w-24 h-24 rounded-full mx-auto neon-glow pulse-glow scan-lines"
                />
                <Badge variant="success" className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs terminal-style">
                  <span className="text-terminal">[ONLINE]</span>
                </Badge>
              </div>
              <CardTitle className="text-lg">MAITRI AI</CardTitle>
              <CardDescription>Psychological Support Assistant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* AI Status */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Empathy Level</span>
                  <Badge variant="default" className="text-xs">High</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Response Time</span>
                  <Badge variant="success" className="text-xs">1.2s</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Session Duration</span>
                  <Badge variant="secondary" className="text-xs">12m</Badge>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <Button variant="medical" size="sm" className="w-full justify-start">
                  <Heart className="w-4 h-4 mr-2" />
                  Mood Check-in
                </Button>
                <Button variant="aurora" size="sm" className="w-full justify-start">
                  <Zap className="w-4 h-4 mr-2" />
                  Stress Relief
                </Button>
              </div>
              
            </CardContent>
          </Card>

          {/* Chat Interface */}
          <Card className="lg:col-span-3 cosmic-glow neon-glow scan-lines">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                <span>Companion Chat</span>
              </CardTitle>
              <CardDescription>
                Evidence-based psychological support and adaptive conversations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Message History */}
              <ScrollArea className="h-96 p-4 rounded-lg bg-muted/30 border">
                <div className="space-y-4" ref={scrollAreaRef}>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card border cosmic-glow'
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          {message.type === 'ai' && (
                            <Bot className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                          )}
                          {message.type === 'user' && (
                            <User className="w-4 h-4 mt-1 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Share your thoughts or concerns..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                    className="pr-12"
                    disabled={isLoading}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`absolute right-1 top-1/2 transform -translate-y-1/2 ${
                      isListening ? 'text-destructive' : 'text-muted-foreground'
                    }`}
                    onClick={toggleListening}
                    disabled={isLoading}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                </div>
                <Button variant="cosmic" onClick={sendMessage} disabled={isLoading || !inputMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {isLoading && (
                <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span>MAITRI is thinking...</span>
                </div>
              )}

              {/* Voice Status */}
              {isListening && (
                <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                  <span>Listening for voice input...</span>
                </div>
              )}
              
            </CardContent>
          </Card>

        </div>

      </div>
    </section>
  );
};

export default AICompanion;