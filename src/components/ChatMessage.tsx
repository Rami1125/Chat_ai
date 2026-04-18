import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { Message } from '../lib/gemini';
import { Bot, User, FileText, ImageIcon } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  isLast: boolean;
}

export const ChatMessage = ({ message, isLast }: ChatMessageProps) => {
  const isBot = message.role === 'model';
  
  // Detect if content contains Hebrew characters to apply RTL
  const isHebrew = /[\u0590-\u05FF]/.test(message.content);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 30,
        mass: 0.8
      }}
      className={cn(
        "flex w-full mb-6 px-1 origin-bottom",
        isBot ? "justify-end" : "justify-start"
      )}
    >
      <div 
        className={cn(
          "max-w-[80%] flex flex-col gap-1",
          isBot ? "items-start" : "items-end"
        )}
        dir={isHebrew ? "rtl" : "ltr"}
      >
        <div 
          className={cn(
            "bubble px-5 py-4 text-[15px] leading-[1.5] shadow-sm",
            isBot 
              ? "bg-white text-text-dark border border-border-color rounded-2xl rounded-bl-sm" 
              : "user-bubble-gradient text-white rounded-2xl rounded-br-sm"
          )}
        >
          <div className={cn(
            "prose prose-sm md:prose-base max-w-none break-words",
            isBot ? "text-text-dark" : "text-white prose-invert"
          )}>
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {message.attachments.map((file, i) => (
                  <div key={i} className={cn(
                    "flex items-center gap-2 p-2 rounded-lg text-xs font-medium border",
                    isBot ? "bg-zinc-50 border-border-color text-text-muted" : "bg-white/10 border-white/20 text-white"
                  )}>
                    {file.type.startsWith('image/') ? (
                      <div className="relative group">
                        <img 
                          src={`data:${file.type};base64,${file.data}`} 
                          alt={file.name} 
                          className="w-12 h-12 object-cover rounded shadow-sm cursor-zoom-in"
                        />
                      </div>
                    ) : <FileText size={16} />}
                    <span className="truncate max-w-[120px]">{file.name}</span>
                  </div>
                ))}
              </div>
            )}
            <ReactMarkdown>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
        <span className="text-[11px] text-text-muted px-1">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
};
