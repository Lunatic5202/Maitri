import { useState } from "react";
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
import maitriAvatar from "@/assets/maitri-ai-avatar.jpg";

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
      timestamp: new Date(Date.now() - 5000),
      emotion: 'supportive'
    },
    {
      id: '2',
      type: 'user',
      content: "I've been feeling a bit isolated lately. The routine is getting repetitive.",
      timestamp: new Date(Date.now() - 3000)
    },
    {
      id: '3',
      type: 'ai',
      content: "I understand how challenging isolation can be, especially in the confined space environment. Your feelings are completely valid. Would you like to try a brief mindfulness exercise together, or would you prefer to talk about what aspects of the routine feel most difficult?",
      timestamp: new Date(Date.now() - 1000),
      emotion: 'empathetic'
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState("");
  const [isListening, setIsListening] = useState(false);

  const sendMessage = () => {
    if (!inputMessage.trim()) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage("");

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: generateAIResponse(inputMessage),
        timestamp: new Date(),
        emotion: 'supportive'
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1500);
  };

  const generateAIResponse = (userInput: string): string => {
    const responses = [
      "Thank you for sharing that with me. Your emotional well-being is important for mission success. Let's work through this together.",
      "I'm here to support you. Would you like to try some breathing exercises or discuss what's troubling you?",
      "Your feelings are valid. In space missions, psychological resilience is just as crucial as physical health. How can I help?",
      "I notice some stress indicators. Let's take a moment to focus on your well-being. What would help you feel more balanced right now?"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
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
                <div className="space-y-4">
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
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="pr-12"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`absolute right-1 top-1/2 transform -translate-y-1/2 ${
                      isListening ? 'text-destructive' : 'text-muted-foreground'
                    }`}
                    onClick={toggleListening}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                </div>
                <Button variant="cosmic" onClick={sendMessage}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>

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