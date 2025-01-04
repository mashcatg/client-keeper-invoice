import { useState, useEffect, useRef } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageCircle, X, Send, Minimize2, Maximize2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatBotProps {
  quizId: string;
}

const ChatBot = ({ quizId }: ChatBotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = useSupabaseClient();
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const newMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('quiz-chat', {
        body: {
          message,
          quizId,
          history: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        }
      });

      if (error) throw error;

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      }]);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Failed to get response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mb-4"
          >
            <Card className={`w-[350px] shadow-lg ${isMinimized ? 'h-[60px]' : 'h-[500px]'}`}>
              <div className="p-4 border-b flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Quiz Assistant</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(!isMinimized)}
                  >
                    {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {!isMinimized && (
                <>
                  <div className="p-4 h-[380px] overflow-y-auto space-y-4">
                    {messages.map((msg, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            msg.role === 'user'
                              ? 'bg-primary text-white'
                              : 'bg-gray-100'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <span className="text-xs opacity-70">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 p-3 rounded-lg">
                          <div className="flex space-x-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ask about the questions..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        disabled={isLoading}
                      />
                      <Button
                        onClick={handleSend}
                        disabled={isLoading || !message.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
        >
          <Button
            size="lg"
            className="rounded-full h-12 w-12 shadow-lg"
            onClick={() => setIsOpen(true)}
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default ChatBot;