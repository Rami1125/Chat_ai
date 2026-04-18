import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Message, sendMessageStream, Personality, Attachment } from './lib/gemini';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { SettingsModal } from './components/SettingsModal';
import { OrdersBoard } from './components/OrdersBoard';
import { ReloadPrompt } from './components/ReloadPrompt';
import { cn } from './lib/utils';
import { 
  Orbit, 
  RotateCcw, 
  Plus, 
  Settings, 
  Menu, 
  X, 
  History, 
  TrendingUp, 
  MessageSquareText, 
  Trash2, 
  ChevronLeft,
  Archive,
  Edit2,
  Check,
  Wifi,
  WifiOff,
  Download
} from 'lucide-react';
import { ChatConversation } from './types';

export default function App() {
  const [view, setView] = useState<'chat' | 'orders'>('chat');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [personality, setPersonality] = useState<Personality>({
    persona: 'friendly',
    length: 'standard',
    formality: 'casual'
  });
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // PWA & Online Status Logic
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  // Load conversations from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('aura_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setConversations(parsed);
          // Set the most recently updated conversation as active
          const sorted = [...parsed].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
          const mostRecent = sorted[0];
          if (mostRecent) {
            setCurrentConversationId(mostRecent.id);
            setMessages(mostRecent.messages);
          }
        }
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
  }, []);

  // Save conversations to local storage
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('aura_chat_history', JSON.stringify(conversations));
    } else {
      localStorage.removeItem('aura_chat_history');
    }
  }, [conversations]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, view]);

  const handleSend = async (content: string, attachments: Attachment[] = []) => {
    const userMessage: Message = { role: 'user', content, attachments };
    let activeId = currentConversationId;
    let currentMsgs = [...messages, userMessage];

    // Create new conversation if none exists
    if (!activeId) {
      activeId = Date.now().toString();
      const newConversation: ChatConversation = {
        id: activeId,
        title: content.slice(0, 40) + (content.length > 40 ? '...' : ''),
        messages: [userMessage],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversationId(activeId);
    } else {
      // Update existing conversation
      setConversations(prev => prev.map(c => 
        c.id === activeId ? { ...c, messages: [...c.messages, userMessage], updatedAt: Date.now() } : c
      ));
    }

    setMessages(currentMsgs);
    setIsLoading(true);
    if (window.innerWidth < 768) setIsSidebarOpen(false);

    try {
      const history = messages; 
      let assistantContent = "";
      let hasPlayedSound = false;
      
      const stream = sendMessageStream(history, content, personality, attachments);
      
      setMessages(prev => [...prev, { role: 'model', content: '' }]);

      for await (const chunk of stream) {
        if (!hasPlayedSound && chunk) {
          const audio = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_730623190e.mp3');
          audio.volume = 0.4;
          audio.play().catch(e => console.log("Audio play blocked by browser:", e));
          hasPlayedSound = true;
        }
        
        assistantContent += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { 
            role: 'model', 
            content: assistantContent 
          };
          return newMessages;
        });
      }

      // Sync final assistant message back to conversation store
      setConversations(prev => prev.map(c => 
        c.id === activeId ? { 
          ...c, 
          messages: [...c.messages, userMessage, { role: 'model', content: assistantContent }],
          updatedAt: Date.now() 
        } : c
      ));

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = { 
        role: 'model', 
        content: 'I encountered an error. Please check your API key and network connection.' 
      };
      setMessages(prev => [...prev, errorMessage]);
      
      setConversations(prev => prev.map(c => 
        c.id === activeId ? { ...c, messages: [...c.messages, userMessage, errorMessage], updatedAt: Date.now() } : c
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setView('chat');
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const selectConversation = (id: string) => {
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      setCurrentConversationId(id);
      setMessages(conv.messages);
      setView('chat');
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    }
  };

  const deleteConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('מחק שיחה זו לצמיתות?')) {
      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentConversationId === id) {
        setCurrentConversationId(null);
        setMessages([]);
      }
    }
  };

  const renameConversation = (e: React.MouseEvent, id: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingId(id);
    setEditingTitle(currentTitle);
  };

  const saveTitle = (id: string) => {
    if (editingTitle.trim()) {
      setConversations(prev => prev.map(c => 
        c.id === id ? { ...c, title: editingTitle.trim(), updatedAt: Date.now() } : c
      ));
    }
    setEditingId(null);
  };

  const toggleArchive = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConversations(prev => prev.map(c => {
      if (c.id === id) {
        const newStatus = c.status === 'archived' ? 'active' : 'archived';
        return { ...c, status: newStatus as any, updatedAt: Date.now() };
      }
      return c;
    }));
  };

  const clearChat = () => {
    if (confirm('נקה את כל היסטוריית השיחות?')) {
      setConversations([]);
      setMessages([]);
      setCurrentConversationId(null);
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    }
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-border-color space-y-2">
        <button 
          onClick={() => {
            setView('chat');
            if (window.innerWidth < 768) setIsSidebarOpen(false);
          }}
          className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${view === 'chat' ? 'bg-accent text-white shadow-lg' : 'bg-transparent text-text-muted hover:bg-accent-light hover:text-accent'}`}
        >
          <MessageSquareText size={20} />
          <span>צ'אט Aura</span>
        </button>
        <button 
          onClick={() => {
            setView('orders');
            if (window.innerWidth < 768) setIsSidebarOpen(false);
          }}
          className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${view === 'orders' ? 'bg-accent text-white shadow-lg' : 'bg-transparent text-text-muted hover:bg-accent-light hover:text-accent'}`}
        >
          <TrendingUp size={20} />
          <span>לוח הזמנות</span>
        </button>
      </div>
      
      <div className="flex-1 overflow-hidden p-4 space-y-4">
        {view === 'chat' ? (
          <>
            <button 
              onClick={createNewChat}
              className="w-full flex items-center justify-center gap-2 p-3 bg-zinc-50 text-text-muted border border-dashed border-border-color rounded-lg font-semibold hover:bg-accent-light hover:text-accent hover:border-accent transition-all group mb-2"
            >
              <Plus size={18} />
              <span>שיחה חדשה</span>
            </button>
            
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar min-h-0">
              {['active', 'archived'].map((status) => {
                const filtered = conversations.filter(c => (c.status || 'active') === status);
                if (filtered.length === 0 && status === 'archived') return null;

                return (
                  <div key={status} className="space-y-1">
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest px-2 mb-2 opacity-50 flex items-center justify-between">
                      <span>{status === 'active' ? 'שיחות פעילות' : 'ארכיון'}</span>
                      <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-[8px]">{filtered.length}</span>
                    </p>
                    {filtered.length === 0 && status === 'active' ? (
                      <div className="px-2 py-4 text-center">
                        <p className="text-xs text-text-muted italic">אין שיחות פעילות</p>
                      </div>
                    ) : (
                      filtered.map(conv => (
                        <div key={conv.id} className="group relative">
                          {editingId === conv.id ? (
                            <div className="flex items-center gap-2 p-1 bg-white ring-1 ring-accent rounded-lg mx-1 shadow-sm">
                              <input
                                autoFocus
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveTitle(conv.id);
                                  if (e.key === 'Escape') setEditingId(null);
                                }}
                                className="flex-1 bg-transparent text-xs p-1 outline-none font-medium"
                              />
                              <button onClick={() => saveTitle(conv.id)} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded">
                                <Check size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => selectConversation(conv.id)}
                              className={`group w-full flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all text-right ${currentConversationId === conv.id ? 'bg-accent/10 text-accent font-bold ring-1 ring-inset ring-accent/30' : 'hover:bg-zinc-50 text-text-muted font-medium'}`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="relative">
                                  <MessageSquareText size={14} className={`shrink-0 ${currentConversationId === conv.id ? 'text-accent' : 'text-zinc-400'}`} />
                                  {conv.status === 'archived' && (
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 border border-white rounded-full" />
                                  )}
                                </div>
                                <span className={cn("truncate text-xs", conv.status === 'archived' && "opacity-60 italic")}>{conv.title}</span>
                              </div>
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                <button 
                                  onClick={(e) => renameConversation(e, conv.id, conv.title)}
                                  className="p-1 hover:bg-zinc-100 rounded text-text-muted"
                                  title="שנה שם"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button 
                                  onClick={(e) => toggleArchive(e, conv.id)}
                                  className={cn("p-1 rounded", conv.status === 'archived' ? "text-amber-500 hover:bg-amber-50" : "text-text-muted hover:bg-zinc-100")}
                                  title={conv.status === 'archived' ? "הוצא מהארכיון" : "העבר לארכיון"}
                                >
                                  <Archive size={12} />
                                </button>
                                <button 
                                  onClick={(e) => deleteConversation(e, conv.id)}
                                  className="p-1 hover:bg-red-50 hover:text-red-500 rounded text-text-muted"
                                  title="מחק"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>

            <div className="px-3 py-2 bg-accent/5 ring-1 ring-inset ring-accent/20 rounded-lg text-xs font-semibold text-accent uppercase tracking-wider flex items-center gap-2 mt-2">
              <History size={12} className="animate-pulse" />
              מצב זיכרון פעיל
            </div>
          </>
        ) : (
            <div className="p-4 bg-zinc-50 rounded-2xl border border-border-color">
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 opacity-50">סטטוס סטודיו</h4>
                <p className="text-sm font-medium text-text-dark">סימולציה פעילה: אופטימיזציה של צמיחה חודשית.</p>
            </div>
        )}
        
        <div className="space-y-2">
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest px-3 mb-1 opacity-50">אישיות Aura</p>
            <div className="px-3 py-2 bg-zinc-50 rounded-lg text-sm text-text-dark border border-border-color flex justify-between items-center">
            <span className="font-medium">
                {personality.persona === 'friendly' ? 'ידידותי' : 
                 personality.persona === 'professional' ? 'מקצועי' : 
                 personality.persona === 'humorous' ? 'הומוריסטי' :
                 personality.persona === 'sarcastic' ? 'עוקצני' :
                 personality.persona === 'enthusiastic' ? 'נלהב' : 'תמציתי'}
            </span>
            <button onClick={() => setIsSettingsOpen(true)} className="p-1 hover:bg-zinc-200 rounded text-accent">
                <Settings size={14} />
            </button>
            </div>
        </div>
      </div>

      <div className="p-4 border-t border-border-color space-y-3">
        {showInstallBanner && (
          <button 
            onClick={handleInstallClick}
            className="w-full flex items-center gap-3 p-3 rounded-xl font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all border border-emerald-100"
          >
            <Download size={20} />
            <span>התקן אפליקציה</span>
          </button>
        )}
        
        <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-widest p-2 rounded-lg bg-zinc-50 border border-border-color">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi size={12} className="text-emerald-500" />
            ) : (
              <WifiOff size={12} className="text-rose-500" />
            )}
            <span className={isOnline ? "text-emerald-500" : "text-rose-500"}>
              {isOnline ? "מחובר לשרת" : "מצב אופליין"}
            </span>
          </div>
          <span className="text-text-muted">AURA V2.7</span>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-bg-main font-sans text-text-dark overflow-hidden relative" dir="rtl">
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        personality={personality}
        onUpdate={(updates) => setPersonality(prev => ({ ...prev, ...updates }))}
      />

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[40] md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-72 bg-sidebar-bg border-l border-border-color flex-col h-full shrink-0 shadow-sm z-30">
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 bottom-0 right-0 w-72 bg-sidebar-bg border-l border-border-color flex flex-col z-[50] md:hidden shadow-2xl"
          >
            <div className="absolute left-0 top-1/2 -translate-x-full p-2" onClick={() => setIsSidebarOpen(false)}>
               <div className="bg-white p-2 rounded-r-lg shadow-lg border-y border-r border-border-color">
                  <X size={20} className="text-text-muted" />
               </div>
            </div>
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-white border-b border-border-color shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Burger Menu Button - Advanced Design */}
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2.5 bg-zinc-50 border border-border-color rounded-xl text-text-dark transition-all shadow-sm"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.button>

            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 rounded-full user-bubble-gradient flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                {view === 'chat' ? 'AI' : <TrendingUp size={16} />}
              </div>
              <div>
                <h2 className="text-[14px] md:text-[16px] font-bold m-0 leading-tight truncate max-w-[120px] md:max-w-none">
                    {view === 'chat' ? 'עוזר AI אישי' : 'לוח הזמנות פעיל'}
                </h2>
                <div className="flex items-center gap-1.5 leading-none mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] md:text-[12px] text-emerald-600 font-medium">
                      {view === 'chat' ? 'זמין' : 'סנכרון חי פעיל'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-zinc-50 rounded-lg text-text-muted hover:text-accent transition-colors"
              title="הגדרות"
            >
              <Settings size={18} />
            </motion.button>
            {view === 'chat' && (
                <motion.button 
                    whileHover={{ scale: 1.1, rotate: -15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={clearChat}
                    className="p-2 hover:bg-red-50 rounded-lg text-text-muted hover:text-red-500 transition-colors"
                    title="מחק הכל"
                >
                    <RotateCcw size={18} />
                </motion.button>
            )}
          </div>
        </header>

        {/* Dynamic Display Area */}
        <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
            {view === 'chat' ? (
                <motion.div 
                    key="chat"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    ref={scrollRef}
                    className="h-full overflow-y-auto scroll-smooth chat-dot-bg p-8 flex flex-col"
                >
                    <AnimatePresence initial={false}>
                    {messages.length === 0 ? (
                        <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col items-center justify-center py-12 text-center"
                        >
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-border-color">
                            <Orbit className="h-8 w-8 text-accent" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight mb-3 text-text-dark tracking-tighter">Aura - מוח לוגיסטי</h2>
                        <p className="text-text-muted max-w-sm mb-8 leading-relaxed">
                            אהלן שותף, אני Aura. כאן כדי לנהל את ההזמנות וההפצה של ח. סבן. מה הסידור להיום אחי?
                        </p>
                        
                        <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                            {[
                            "מה המצב של עלי?",
                            "צריך דוח בוקר למחר",
                            "חוקי הזמנת בטון",
                            "הזמנה חדשה לזבולון"
                            ].map((text, i) => (
                            <button
                                key={i}
                                onClick={() => handleSend(text)}
                                className="px-4 py-2 bg-white hover:bg-accent-light hover:text-accent border border-border-color rounded-full text-sm font-medium transition-all shadow-sm"
                            >
                                {text}
                            </button>
                            ))}
                        </div>
                        </motion.div>
                    ) : (
                        <motion.div layout className="flex flex-col">
                        {messages.map((message, index) => (
                            <ChatMessage 
                            key={`msg-${index}`} 
                            message={message} 
                            isLast={index === messages.length - 1} 
                            />
                        ))}
                        {isLoading && messages[messages.length - 1]?.role === 'user' && (
                          <motion.div 
                            layout
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="self-end mb-6"
                          >
                            <div className="bg-white border border-border-color px-5 py-4 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-3">
                              <div className="flex gap-1.5 py-1">
                                {[0, 1, 2].map((i) => (
                                  <motion.div
                                    key={i}
                                    animate={{ y: [0, -6, 0] }}
                                    transition={{
                                      duration: 0.6,
                                      repeat: Infinity,
                                      delay: i * 0.15,
                                      ease: "easeInOut"
                                    }}
                                    className="w-1.5 h-1.5 bg-accent rounded-full"
                                  />
                                ))}
                              </div>
                              <span className="text-xs font-bold text-accent uppercase tracking-wider">Aura מקלידה...</span>
                            </div>
                          </motion.div>
                        )}
                        </motion.div>
                    )}
                    </AnimatePresence>
                </motion.div>
            ) : (
                <motion.div 
                    key="orders"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="h-full w-full"
                >
                    <OrdersBoard />
                </motion.div>
            )}
            </AnimatePresence>
        </div>

        {/* Input (only for chat) */}
        {view === 'chat' && (
            <ChatInput onSend={handleSend} isLoading={isLoading} onNewChat={createNewChat} />
        )}
      </main>
      <ReloadPrompt />
    </div>
  );
}
