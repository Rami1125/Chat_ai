import { Personality } from '../lib/gemini';
import { X, CircleUser, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  personality: Personality;
  onUpdate: (updates: Partial<Personality>) => void;
}

export const SettingsModal = ({ isOpen, onClose, personality, onUpdate }: SettingsModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 bottom-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-white rounded-3xl shadow-2xl z-[60] overflow-hidden border border-border-color"
          >
            <div className="p-6 border-b border-border-color flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-accent" />
                <h2 className="text-xl font-bold tracking-tight">הגדרות Aura AI</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Persona Selection */}
              <section className="space-y-3">
                <label className="text-sm font-semibold text-text-muted flex items-center gap-2">
                  <CircleUser className="w-4 h-4" />
                  אישיות (Persona)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['friendly', 'professional', 'humorous', 'sarcastic', 'enthusiastic', 'concise'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => onUpdate({ persona: p })}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        personality.persona === p 
                          ? 'bg-accent text-white shadow-md' 
                          : 'bg-zinc-100 text-text-muted hover:bg-zinc-200'
                      }`}
                    >
                      {p === 'friendly' ? 'ידידותי' : 
                       p === 'professional' ? 'מקצועי' : 
                       p === 'humorous' ? 'הומוריסטי' :
                       p === 'sarcastic' ? 'עוקצני' :
                       p === 'enthusiastic' ? 'נלהב' : 'תמציתי'}
                    </button>
                  ))}
                </div>
              </section>

              {/* Formality Selection */}
              <section className="space-y-3">
                <label className="text-sm font-semibold text-text-muted">רמת פורמליות</label>
                <div className="flex gap-2 p-1 bg-zinc-100 rounded-xl">
                  {(['casual', 'formal'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => onUpdate({ formality: f })}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        personality.formality === f 
                          ? 'bg-white shadow-sm text-accent' 
                          : 'text-text-muted hover:text-text-dark'
                      }`}
                    >
                      {f === 'casual' ? 'יומיומי' : 'רשמי'}
                    </button>
                  ))}
                </div>
              </section>

              {/* Length Selection */}
              <section className="space-y-3">
                <label className="text-sm font-semibold text-text-muted">אורך תשובות</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['short', 'standard', 'detailed'] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => onUpdate({ length: l })}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        personality.length === l 
                          ? 'bg-accent text-white shadow-md' 
                          : 'bg-zinc-100 text-text-muted hover:bg-zinc-200'
                      }`}
                    >
                      {l === 'short' ? 'קצר' : l === 'standard' ? 'רגיל' : 'מפורט'}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div className="p-6 bg-zinc-50/50 border-t border-border-color">
              <button
                onClick={onClose}
                className="w-full py-3 bg-text-dark text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg"
              >
                שמור שינויים
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
