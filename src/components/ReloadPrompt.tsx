import { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, X } from 'lucide-react';

export function ReloadPrompt() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const sw = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  if (!mounted || !sw) return null;

  const {
    offlineReady: [offlineReady, setOfflineReady] = [false, () => {}],
    needUpdate: [needUpdate, setNeedUpdate] = [false, () => {}],
    updateServiceWorker = () => Promise.resolve(),
  } = sw;

  const close = () => {
    setOfflineReady(false);
    setNeedUpdate(false);
  };

  return (
    <AnimatePresence>
      {(offlineReady || needUpdate) && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 right-6 z-[60] p-4 bg-sidebar-bg rounded-3xl shadow-2xl border border-border-color flex flex-col gap-3 min-w-[280px]"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                <RefreshCw size={20} className={needUpdate ? "animate-spin" : ""} />
              </div>
              <div>
                <p className="text-sm font-bold text-text-dark">
                  {offlineReady ? "האפליקציה מוכנה לעבודה באופליין" : "עדכון חדש זמין!"}
                </p>
                <p className="text-xs text-text-muted">
                  {offlineReady ? "ניתן להמשיך להשתמש בלוח ההזמנות ללא אינטרנט" : "לחץ לרענון כדי לקבל את הגרסה האחרונה"}
                </p>
              </div>
            </div>
            <button onClick={close} className="p-1 text-text-muted hover:bg-bg-main rounded-lg">
              <X size={16} />
            </button>
          </div>
          
          {needUpdate && (
            <button
              onClick={() => updateServiceWorker(true)}
              className="w-full bg-accent text-white py-2.5 rounded-xl font-bold hover:bg-accent-dark transition-all shadow-md active:scale-95 text-xs text-center"
            >
              רענן עכשיו
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
