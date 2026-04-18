import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp, Loader2, Paperclip, X, FileText, Image as ImageIcon, Mic, Square, Sparkles, ListChecks, PlusCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Attachment, transcribeAudio } from '../lib/gemini';

interface ChatInputProps {
  onSend: (message: string, attachments: Attachment[]) => void;
  isLoading: boolean;
  onNewChat: () => void;
}

export const ChatInput = ({ onSend, isLoading, onNewChat }: ChatInputProps) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setIsTranscribing(true);
          try {
            const transcription = await transcribeAudio(base64Audio, 'audio/webm');
            if (transcription) {
              setInput(prev => (prev.trim() ? `${prev}\n${transcription}` : transcription));
            }
          } catch (error) {
            console.error('Transcription error:', error);
            alert('שגיאה במהלך התעתוק. נסה שוב.');
          } finally {
            setIsTranscribing(false);
          }
        };
        reader.readAsDataURL(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('נא לאפשר גישה למיקרופון כדי להשתמש בתכונה זו.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((input.trim() || attachments.length > 0) && !isLoading) {
      onSend(input, attachments);
      setInput('');
      setAttachments([]);
      
      // Reset height after submit
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 10 * 1024 * 1024) {
            alert(`קובץ ${file.name} גדול מדי (מקסימום 10MB)`);
            continue;
        }

        const reader = new FileReader();
        const promise = new Promise<Attachment>((resolve) => {
            reader.onload = (event) => {
                const base64 = (event.target?.result as string).split(',')[1];
                resolve({
                    name: file.name,
                    type: file.type,
                    data: base64
                });
            };
        });

        reader.readAsDataURL(file);
        newAttachments.push(await promise);
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const isHebrew = /[\u0590-\u05FF]/.test(input);

  return (
    <div className="p-6 bg-white border-t border-border-color sticky bottom-0 z-20">
      <div className="max-w-4xl mx-auto mb-2 flex flex-wrap gap-2">
        <AnimatePresence>
          {attachments.map((file, i) => (
            <motion.div 
              key={`${file.name}-${i}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 bg-accent-light text-accent px-3 py-1.5 rounded-lg text-xs font-medium border border-accent/20 transition-all hover:bg-accent/10"
            >
              {file.type.startsWith('image/') ? <ImageIcon size={14} /> : <FileText size={14} />}
              <span className="truncate max-w-[150px]">{file.name}</span>
              <button 
                type="button"
                onClick={() => removeAttachment(i)}
                className="hover:bg-accent/20 rounded-full p-0.5"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <form 
        onSubmit={handleSubmit}
        className="max-w-4xl mx-auto flex items-end bg-bg-main border border-border-color rounded-xl p-2 gap-2 shadow-sm"
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          multiple 
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || isRecording || isTranscribing}
          className="shrink-0 p-3 text-text-muted hover:text-accent hover:bg-zinc-100 rounded-lg transition-all"
          title="צרף קובץ"
        >
          <Paperclip size={20} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isLoading || isTranscribing}
          className={cn(
            "shrink-0 p-3 transition-all rounded-lg",
            isRecording 
              ? "text-red-500 bg-red-50 animate-pulse" 
              : "text-text-muted hover:text-accent hover:bg-zinc-100"
          )}
          title={isRecording ? "עצור הקלטה" : "הקלט הודעה קולית"}
        >
          {isTranscribing ? (
            <Loader2 size={20} className="animate-spin text-accent" />
          ) : isRecording ? (
            <Square size={20} fill="currentColor" />
          ) : (
            <Mic size={20} />
          )}
        </motion.button>
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isRecording ? "Aura מקשיבה..." : isTranscribing ? "מתעתק הודעה קולית..." : "דבר עם Aura (לוגיסטיקה)..."}
          disabled={isLoading || isRecording || isTranscribing}
          dir={isHebrew ? "rtl" : "ltr"}
          className="flex-1 resize-none bg-transparent border-none p-3 focus:outline-none focus:ring-0 disabled:opacity-50 text-text-dark placeholder:text-text-muted transition-all min-h-[44px]"
        />
        <motion.button
          whileHover={(!input.trim() && attachments.length === 0) || isLoading ? {} : { scale: 1.05 }}
          whileTap={(!input.trim() && attachments.length === 0) || isLoading ? {} : { scale: 0.95 }}
          type="submit"
          disabled={(!input.trim() && attachments.length === 0) || isLoading}
          className="shrink-0 p-3 bg-accent text-white hover:opacity-90 rounded-lg disabled:bg-zinc-200 disabled:text-zinc-500 transition-all shadow-sm flex items-center justify-center h-11 w-11 overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                transition={{ duration: 0.2 }}
              >
                <Loader2 className="h-5 w-5 animate-spin" />
              </motion.div>
            ) : (
              <motion.div
                key="arrow"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ArrowUp className="h-5 w-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </form>

      {/* Quick Actions */}
      <div className="max-w-4xl mx-auto mt-3 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <motion.button
          whileHover={{ y: -2, backgroundColor: '#f4f4f5' }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-color text-[11px] font-bold text-text-muted transition-all whitespace-nowrap bg-white shadow-sm"
        >
          <PlusCircle size={14} className="text-accent" />
          שיחה חדשה
        </motion.button>
        <motion.button
          whileHover={{ y: -2, backgroundColor: '#f4f4f5' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSend("סכמי לי את המצב של כל הנהגים נכון לעכשיו.", [])}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-color text-[11px] font-bold text-text-muted transition-all whitespace-nowrap bg-white shadow-sm disabled:opacity-50"
        >
          <ListChecks size={14} className="text-emerald-500" />
          סטטוס נהגים
        </motion.button>
        <motion.button
          whileHover={{ y: -2, backgroundColor: '#f4f4f5' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSend("מה חוקי המלאי לגבי בטון וריצופית?", [])}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-color text-[11px] font-bold text-text-muted transition-all whitespace-nowrap bg-white shadow-sm disabled:opacity-50"
        >
          <Sparkles size={14} className="text-amber-500" />
          חוקי הזמנה
        </motion.button>
      </div>
    </div>
  );
};
