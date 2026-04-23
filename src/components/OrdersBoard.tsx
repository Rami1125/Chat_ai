import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { 
  Truck, 
  Users, 
  Package, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Construction, 
  Search, 
  Filter, 
  X, 
  Palette, 
  Settings2, 
  Calendar,
  MoreVertical,
  Plus,
  Share2,
  Phone,
  MessageCircle,
  TrendingUp,
  Box,
  ChevronDown
} from 'lucide-react';

// Fix Leaflet icon issue
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

// Map center updater helper
const RecenterMap = ({ coords }: { coords: { lat: number; lng: number } }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([coords.lat, coords.lng], 13);
  }, [coords, map]);
  return null;
};

export const OrdersBoard = () => {
  const [rounds, setRounds] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Real-time Firebase Sync logic
  useEffect(() => {
    setIsSyncing(true);
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRounds(ordersData);
      setIsSyncing(false);
      
      // Also update local cache for lightning-fast subsequent loads
      localStorage.setItem('sabanos_orders_cache', JSON.stringify(ordersData));
    }, (error) => {
      handleFirestoreError(error, 'list', 'orders');
      setIsSyncing(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync logic for color configuration
  const [statusColors, setStatusColors] = useState<Record<string, string>>({
    'בדרך': 'blue',
    'בוצע': 'emerald',
    'העמסה': 'amber',
    'מוכנה': 'purple',
    'בהכנה': 'zinc'
  });

  const availableColors = ['blue', 'emerald', 'amber', 'purple', 'zinc', 'rose', 'sky'];
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    zinc: 'bg-zinc-50 text-zinc-600 border-zinc-200',
    rose: 'bg-rose-50 text-rose-600 border-rose-200',
    sky: 'bg-sky-50 text-sky-600 border-sky-200',
  };

  const getStatusColor = (status: string) => {
    const colorKey = statusColors[status] || 'zinc';
    return colorClasses[colorKey];
  };

  const [search, setSearch] = useState('');
  const [driverFilter, setDriverFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [selectedOrderForMap, setSelectedOrderForMap] = useState<any>(null);

  const generateShareText = (round: any) => {
    return `📦 *SabanOS - פרטי הזמנה*
👤 *לקוח:* ${round.customer}
📍 *יעד:* ${round.destination}
🚛 *נהג:* ${round.driver}
⏰ *זמן:* ${round.time}
🏗️ *מחסן:* ${round.warehouse}
📝 *סחורה:* ${round.items}
🔄 *סטטוס:* ${round.status}

הופק ע"י נועה AI 🤖`;
  };

  const handleWhatsAppShare = (round: any) => {
    const text = generateShareText(round);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filteredRounds = useMemo(() => {
    return rounds.filter(round => {
      const matchesSearch = 
        round.customer.toLowerCase().includes(search.toLowerCase()) ||
        round.destination.toLowerCase().includes(search.toLowerCase()) ||
        round.driver.toLowerCase().includes(search.toLowerCase()) ||
        round.items.toLowerCase().includes(search.toLowerCase());
      
      const matchesDriver = driverFilter === 'all' || round.driver === driverFilter;
      const matchesStatus = statusFilter === 'all' || round.status === statusFilter;
      const matchesWarehouse = warehouseFilter === 'all' || round.warehouse === warehouseFilter;

      const roundDate = round.date ? new Date(round.date).getTime() : -Infinity;
      const start = startDate ? new Date(startDate).getTime() : -Infinity;
      const end = endDate ? new Date(endDate).getTime() : Infinity;
      const matchesDate = roundDate >= start && roundDate <= end;

      return matchesSearch && matchesDriver && matchesStatus && matchesWarehouse && matchesDate;
    });
  }, [rounds, search, driverFilter, statusFilter, warehouseFilter, startDate, endDate]);

  const stats = useMemo(() => ({
    total: rounds.length,
    completed: rounds.filter(r => r.status === 'בוצע').length,
    pending: rounds.filter(r => r.status === 'בהכנה' || r.status === 'מוכנה').length,
    inTransit: rounds.filter(r => r.status === 'בדרך').length,
    activeDrivers: new Set(rounds.map(r => r.driver)).size,
  }), [rounds]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, 'update', `orders/${orderId}`);
    }
  };

  const createDummyOrder = async () => {
    try {
      await addDoc(collection(db, 'orders'), {
        customer: 'לקוח חדש',
        destination: 'אתר בנייה',
        driver: 'עלי',
        items: 'חומרי איטום',
        status: 'בהכנה',
        warehouse: 'החרש',
        priority: 'medium',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        coords: { lat: 31.6667, lng: 34.5667 }
      });
    } catch (error) {
      handleFirestoreError(error, 'create', 'orders');
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-main text-text-dark font-sans overflow-hidden" dir="rtl">
      {/* Top Header - Global Tools */}
      <header className="bg-sidebar-bg border-b border-border-color px-4 md:px-8 py-3 md:py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-accent rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-accent/20 shrink-0">
            <TrendingUp size={20} className="md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-black tracking-tighter truncate">SabanOS - לוח הפצה</h1>
            <div className="hidden sm:flex items-center gap-2 text-[10px] md:text-xs font-bold text-text-muted">
              <Clock size={12} />
              <span className="truncate">עדכון: {new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="w-1 h-1 bg-border-color rounded-full shrink-0" />
              <span>{filteredRounds.length} פריטים</span>
              {isSyncing && (
                <>
                  <span className="w-1 h-1 bg-border-color rounded-full shrink-0" />
                  <span className="text-accent animate-pulse">סנכרון פעיל...</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-sidebar-bg border border-border-color rounded-xl text-xs font-bold hover:bg-bg-main transition-all shadow-sm">
            <Share2 size={16} className="text-accent" />
            <span>שתף דוח</span>
          </button>
          <button 
            onClick={createDummyOrder}
            className="flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-accent text-white rounded-xl text-xs font-black shadow-lg shadow-accent/30 hover:bg-accent-dark transition-all active:scale-95 shrink-0"
          >
            <Plus size={18} />
            <span className="hidden xs:inline">הזמנה חדשה</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden lg:flex-row flex-col">
        {/* Right Sidebar - Stats & Tools (Hidden on Mobile) */}
        <aside className="hidden lg:flex w-80 border-l border-border-color bg-sidebar-bg overflow-y-auto p-6 space-y-8 shrink-0">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-500/10 dark:bg-blue-900/10 p-4 rounded-3xl border border-blue-500/20">
              <div className="text-blue-600 mb-1"><Truck size={20} /></div>
              <div className="text-2xl font-black text-blue-700 dark:text-blue-400">{stats.inTransit}</div>
              <div className="text-[10px] font-bold text-blue-500 uppercase">בדרך ליעד</div>
            </div>
            <div className="bg-emerald-500/10 dark:bg-emerald-900/10 p-4 rounded-3xl border border-emerald-500/20">
              <div className="text-emerald-600 mb-1"><CheckCircle2 size={20} /></div>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{stats.completed}</div>
              <div className="text-[10px] font-bold text-emerald-500 uppercase">הושלמו</div>
            </div>
            <div className="bg-amber-500/10 dark:bg-amber-900/10 p-4 rounded-3xl border border-amber-500/20">
              <div className="text-amber-600 mb-1"><Clock size={20} /></div>
              <div className="text-2xl font-black text-amber-700 dark:text-amber-400">{stats.pending}</div>
              <div className="text-[10px] font-bold text-amber-500 uppercase">ממתינים</div>
            </div>
            <div className="bg-bg-main p-4 rounded-3xl border border-border-color">
              <div className="text-text-muted mb-1"><Users size={20} /></div>
              <div className="text-2xl font-black text-text-dark">{stats.activeDrivers}</div>
              <div className="text-[10px] font-bold text-text-muted uppercase">נהגים פעילים</div>
            </div>
          </div>

          {/* Active Drivers List */}
          <div>
            <h3 className="text-sm font-black mb-4 flex items-center justify-between">
              <span>סטטוס נהגים</span>
              <span className="text-[10px] bg-bg-main px-2 py-0.5 rounded-full text-text-muted">חי</span>
            </h3>
            <div className="space-y-3">
              {['חכמת', 'עלי'].map((driver) => (
                <div key={driver} className="flex items-center justify-between p-3 rounded-2xl bg-bg-main border border-border-color">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-sidebar-bg rounded-xl flex items-center justify-center shadow-sm text-lg border border-border-color">
                      {driver === 'חכמת' ? '🏗️' : driver === 'עלי' ? '🚛' : '🚐'}
                    </div>
                    <div>
                      <p className="text-xs font-bold">{driver}</p>
                      <p className="text-[10px] text-emerald-500 font-medium italic">בתנועה • 12 קמ"ש</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1.5 hover:bg-white rounded-lg text-blue-500 transition-colors">
                      <Phone size={14} />
                    </button>
                    <button className="p-1.5 hover:bg-white rounded-lg text-emerald-500 transition-colors">
                      <MessageCircle size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Alerts */}
          <div>
            <h3 className="text-sm font-black mb-4 text-rose-500 flex items-center gap-2">
              <AlertCircle size={16} />
              התראות דחופות
            </h3>
            <div className="space-y-3">
              <div className="bg-rose-50/10 dark:bg-rose-900/10 p-3 rounded-2xl border border-rose-100 dark:border-rose-900/20 border-r-4 border-r-rose-500">
                <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400">חסר מלאי: בטון ב-30</p>
                <p className="text-[10px] text-rose-600 dark:text-rose-500 opacity-80 leading-relaxed">משלוח "זבולון" מעוכב - ממתינים למערבל מהמרכזי.</p>
              </div>
              <div className="bg-amber-50/10 dark:bg-amber-900/10 p-3 rounded-2xl border border-amber-100 dark:border-amber-900/20 border-r-4 border-r-amber-500">
                <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">נהג "עלי" - חריגה</p>
                <p className="text-[10px] text-amber-600 dark:text-amber-500 opacity-80 leading-relaxed">זמן העמסה מעל 45 דק' באתר מרכזי.</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Central Dashboard Grid */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto space-y-6">
          {/* Mobile Quick Stats (Visible only on mobile) */}
          <div className="lg:hidden flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {[
              { label: 'בדרך', count: stats.inTransit, color: 'blue' },
              { label: 'בוצע', count: stats.completed, color: 'emerald' },
              { label: 'ממתין', count: stats.pending, color: 'amber' },
              { label: 'נהגים', count: stats.activeDrivers, color: 'purple' }
            ].map(stat => (
              <div key={stat.label} className={cn("px-4 py-2 rounded-2xl border shrink-0 flex items-center gap-2", 
                stat.color === 'blue' ? "bg-blue-50/20 border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-400" :
                stat.color === 'emerald' ? "bg-emerald-50/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400" :
                stat.color === 'amber' ? "bg-amber-50/20 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400" :
                "bg-purple-50/20 border-purple-100 dark:border-purple-900/30 text-purple-700 dark:text-purple-400"
              )}>
                <span className="text-[10px] font-black uppercase tracking-wider">{stat.label}</span>
                <span className="font-black text-sm">{stat.count}</span>
              </div>
            ))}
          </div>

          {/* Critical Alerts Banner Hub */}
          <div className="flex gap-4 overflow-hidden">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex-1 flex gap-4 overflow-x-auto no-scrollbar pb-2"
            >
              {[
                { id: 1, type: 'stock', title: 'חסר במלאי: בטון ב-30', desc: 'מעכב 2 הזמנות להיום', icon: <Package size={16} />, color: 'rose' },
                { id: 2, type: 'delay', title: 'עיכוב באתר מרכזי', desc: 'זמן העמסה מעל הממוצע (65 דק\')', icon: <Clock size={16} />, color: 'amber' },
                { id: 3, type: 'vehicle', title: 'מנוף 🏗️ חכמת - תקלה', desc: 'ממתין לתיקון במוסך - זמני', icon: <Truck size={16} />, color: 'blue' }
              ].map((alert) => (
                <div 
                  key={alert.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-3xl border min-w-[300px] shrink-0 transition-all hover:scale-[1.02] cursor-pointer shadow-sm",
                    alert.color === 'rose' ? "bg-rose-500/10 border-rose-500/20" :
                    alert.color === 'amber' ? "bg-amber-500/10 border-amber-500/20" : "bg-blue-500/10 border-blue-500/20"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                    alert.color === 'rose' ? "bg-rose-500 text-white" :
                    alert.color === 'amber' ? "bg-amber-500 text-white" : "bg-blue-500 text-white"
                  )}>
                    {alert.icon}
                  </div>
                  <div>
                    <h4 className={cn(
                      "text-xs font-black",
                      alert.color === 'rose' ? "text-rose-700" :
                      alert.color === 'amber' ? "text-amber-700" : "text-blue-700"
                    )}>{alert.title}</h4>
                    <p className={cn(
                      "text-[10px] whitespace-nowrap opacity-80",
                      alert.color === 'rose' ? "text-rose-600" :
                      alert.color === 'amber' ? "text-amber-600" : "text-blue-600"
                    )}>{alert.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Controls & Filter Bar */}
          <div className="bg-sidebar-bg p-4 md:p-5 rounded-3xl md:rounded-[2.5rem] border border-border-color shadow-sm space-y-4">
            <div className="flex flex-col gap-4">
              <div className="relative flex-1 group">
                <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors" />
                <input 
                  type="text"
                  placeholder="חיפוש לקוח, נהג, כתובת..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-bg-main border border-border-color rounded-2xl py-3 pr-12 pl-4 text-sm outline-none focus:ring-4 focus:ring-accent/10 focus:bg-sidebar-bg text-text-dark transition-all font-medium"
                />
              </div>
              
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 shrink-0">
                <div className="relative col-span-1">
                  <select 
                    value={driverFilter}
                    onChange={(e) => setDriverFilter(e.target.value)}
                    className="w-full appearance-none bg-bg-main border border-border-color rounded-2xl py-3 pr-4 pl-10 text-xs font-black outline-none focus:ring-4 focus:ring-accent/10 cursor-pointer hover:bg-sidebar-bg text-text-dark transition-all sm:min-w-[120px]"
                  >
                    <option value="all">כל הנהגים</option>
                    <option value="חכמת">חכמת</option>
                    <option value="עלי">עלי</option>
                  </select>
                  <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>

                <div className="relative col-span-1">
                  <select 
                    value={warehouseFilter}
                    onChange={(e) => setWarehouseFilter(e.target.value)}
                    className="w-full appearance-none bg-bg-main border border-border-color rounded-2xl py-3 pr-4 pl-10 text-xs font-black outline-none focus:ring-4 focus:ring-accent/10 cursor-pointer hover:bg-sidebar-bg text-text-dark transition-all sm:min-w-[120px]"
                  >
                    <option value="all">כל המחסנים</option>
                    <option value="החרש">החרש</option>
                    <option value="התלמיד">התלמיד</option>
                  </select>
                  <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
                
                <div className="relative col-span-2 sm:col-auto">
                    <button className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-bg-main border border-border-color rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-sidebar-bg transition-all text-text-dark">
                        <span className="flex items-center gap-2">
                           <Calendar size={14} className="text-accent" />
                           {startDate ? `${startDate} - ${endDate}` : 'כל התאריכים'}
                        </span>
                        <ChevronDown size={14} className="text-text-muted" />
                    </button>
                </div>

                <button 
                  onClick={() => setIsColorModalOpen(true)}
                  className="col-span-2 sm:col-auto flex items-center justify-center gap-2 px-4 py-3 bg-sidebar-bg border border-border-color rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-bg-main transition-all text-accent"
                >
                  <Palette size={14} />
                  <span>צבעי סטטוס</span>
                </button>
              </div>
            </div>
          </div>

          {/* Orders Display - Responsive Table/Cards */}
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block bg-sidebar-bg rounded-[2.5rem] border border-border-color shadow-xl shadow-bg-main overflow-hidden">
              <div className="overflow-x-auto overflow-y-auto max-h-[600px] no-scrollbar">
                <table className="w-full text-right border-collapse">
                  <thead className="sticky top-0 bg-sidebar-bg z-10 border-b-2 border-bg-main">
                    <tr className="text-[10px] font-black text-text-muted tracking-[0.2em] uppercase">
                      <th className="px-8 py-6">תעדוף</th>
                      <th className="px-6 py-6 text-center">זמן ונהג</th>
                      <th className="px-6 py-6">לקוח ויעד</th>
                      <th className="px-6 py-6">פירוט סחורה</th>
                      <th className="px-6 py-6">סטטוס</th>
                      <th className="px-8 py-6"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bg-main">
                    <AnimatePresence mode="popLayout">
                      {filteredRounds.length > 0 ? (
                        filteredRounds.map((round, idx) => (
                          <motion.tr 
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ delay: 0.03 * idx }}
                            key={round.id}
                            className="hover:bg-bg-main transition-all group"
                          >
                            <td className="px-8 py-5">
                              <div className={cn(
                                "w-2 h-8 rounded-full",
                                round.priority === 'high' ? "bg-rose-500 shadow-lg shadow-rose-200" :
                                round.priority === 'medium' ? "bg-amber-400 shadow-lg shadow-amber-200" : "bg-blue-400 shadow-lg shadow-blue-200"
                              )} />
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-sm font-black text-text-dark">{round.time}</span>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-bg-main rounded-full">
                                  <span className="text-[9px] font-bold text-text-muted">{round.driver}</span>
                                  {round.status === 'בדרך' && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />}
                                  {round.priority === 'high' && round.status !== 'בוצע' && (
                                    <AlertCircle size={10} className="text-rose-500 animate-pulse" />
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 min-w-[180px]">
                              <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm font-black text-text-dark">{round.customer}</p>
                                  <span className="text-[9px] px-1.5 py-0.5 bg-bg-main text-text-muted rounded font-bold uppercase tracking-tighter">
                                      מחסן {round.warehouse}
                                  </span>
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-text-muted font-bold group/loc cursor-pointer hover:text-accent transition-colors" onClick={() => setSelectedOrderForMap(round)}>
                                <MapPin size={10} className="text-accent" />
                                <span className="border-b border-dotted border-border-color group-hover/loc:border-accent">
                                  {round.destination}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <p className="text-[11px] font-bold text-text-muted leading-relaxed max-w-[200px]">
                                {round.items}
                              </p>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex flex-col gap-2">
                                <button 
                                  onClick={() => {
                                    const statuses = ['בהכנה', 'מוכנה', 'העמסה', 'בדרך', 'בוצע'];
                                    const nextIdx = (statuses.indexOf(round.status) + 1) % statuses.length;
                                    updateOrderStatus(round.id, statuses[nextIdx]);
                                  }}
                                  className={cn(
                                    "px-3 py-1.5 rounded-2xl text-[10px] font-black border text-center transition-all hover:brightness-95 active:scale-95",
                                    getStatusColor(round.status)
                                  )}
                                >
                                  {round.status}
                                </button>
                                <div className="w-full bg-bg-main h-1 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: round.status === 'בוצע' ? '100%' : round.status === 'בדרך' ? '70%' : round.status === 'העמסה' ? '30%' : '10%' }}
                                    className={cn(
                                      "h-full",
                                      round.status === 'בוצע' ? "bg-emerald-500" : "bg-accent"
                                    )}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5 text-left">
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleWhatsAppShare(round)}
                                  className="p-2 hover:bg-emerald-50/10 rounded-xl text-emerald-600 transition-all"
                                  title="שתף בוואטסאפ"
                                >
                                  <MessageCircle size={16} />
                                </button>
                                <button className="p-2 hover:bg-sidebar-bg hover:shadow-md border border-transparent hover:border-border-color rounded-xl text-text-muted hover:text-accent transition-all">
                                  <Edit2 size={16} />
                                </button>
                                <button className="p-2 hover:bg-sidebar-bg hover:shadow-md border border-transparent hover:border-border-color rounded-xl text-text-muted hover:text-text-dark transition-all">
                                  <MoreVertical size={16} />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-8 py-24 text-center">
                            <div className="flex flex-col items-center gap-4 opacity-40">
                              <Box size={48} className="text-text-muted opacity-30" />
                              <p className="text-lg font-black text-text-muted">אין הזמנות תואמות לסינון</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredRounds.map((round) => (
                <motion.div 
                  key={round.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-sidebar-bg rounded-3xl border border-border-color p-5 shadow-sm space-y-4 relative overflow-hidden"
                >
                  {/* Status Accent Strip */}
                  <div className={cn("absolute top-0 right-0 bottom-0 w-1.5", 
                    round.status === 'בדרך' ? 'bg-blue-500' : 
                    round.status === 'בוצע' ? 'bg-emerald-500' : 'bg-amber-500'
                  )} />

                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 bg-bg-main rounded-2xl flex items-center justify-center text-xl shadow-inner border border-border-color">
                        {round.driver === 'חכמת' ? '🏗️' : '🚛'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-black truncate text-text-dark">{round.customer}</h3>
                        <p className="text-[10px] font-bold text-text-muted italic">#{round.id} • {round.time}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const statuses = ['בהכנה', 'מוכנה', 'העמסה', 'בדרך', 'בוצע'];
                        const nextIdx = (statuses.indexOf(round.status) + 1) % statuses.length;
                        updateOrderStatus(round.id, statuses[nextIdx]);
                      }}
                      className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95", getStatusColor(round.status))}
                    >
                      {round.status}
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-text-muted font-sans">
                      <MapPin size={14} className="text-accent shrink-0" />
                      <button 
                        onClick={() => setSelectedOrderForMap(round)}
                        className="text-right border-b border-dotted border-border-color transition-colors active:text-accent"
                      >
                        {round.destination}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-text-muted bg-bg-main p-2.5 rounded-xl border border-border-color">
                      <Package size={14} className="text-text-muted shrink-0" />
                      <span className="truncate">{round.items}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border-color">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-black text-accent">
                        {round.warehouse[0]}
                      </div>
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">מחסן {round.warehouse}</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2.5 bg-blue-50/10 text-blue-600 rounded-xl hover:bg-blue-100 transition-all active:scale-90">
                        <Phone size={14} />
                      </button>
                      <button 
                        onClick={() => handleWhatsAppShare(round)}
                        className="p-2.5 bg-emerald-50/10 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all active:scale-90"
                      >
                        <MessageCircle size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
              {filteredRounds.length === 0 && (
                <div className="text-center py-20 bg-bg-main rounded-[3rem] border border-dashed border-border-color">
                  <p className="text-text-muted font-bold">לא נמצאו הזמנות</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Map Modal */}
      <AnimatePresence>
        {selectedOrderForMap && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrderForMap(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 100 }}
              className="relative bg-sidebar-bg w-full max-w-4xl h-[80vh] rounded-[3rem] shadow-2xl border border-border-color overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-border-color flex items-center justify-between shrink-0 bg-sidebar-bg z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight text-text-dark">{selectedOrderForMap.customer}</h3>
                    <p className="text-xs font-bold text-text-muted">{selectedOrderForMap.destination}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedOrderForMap(null)}
                  className="p-3 hover:bg-bg-main rounded-2xl text-text-muted transition-all active:scale-90"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Map Container Area */}
              <div className="flex-1 relative bg-bg-main">
                <MapContainer 
                  center={[selectedOrderForMap.coords.lat, selectedOrderForMap.coords.lng]} 
                  zoom={13} 
                  style={{ height: '100%', width: '100%' }}
                  className="z-0"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[selectedOrderForMap.coords.lat, selectedOrderForMap.coords.lng]}>
                    <Popup>
                      <div className="p-1" dir="rtl">
                        <p className="font-bold text-sm mb-1 text-text-dark">{selectedOrderForMap.customer}</p>
                        <p className="text-xs text-text-muted">{selectedOrderForMap.items}</p>
                        <p className="text-[10px] bg-bg-main px-2 py-0.5 rounded mt-2 inline-block font-bold text-text-dark">
                          {selectedOrderForMap.driver} • {selectedOrderForMap.time}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                  <RecenterMap coords={selectedOrderForMap.coords} />
                </MapContainer>

                {/* Quick Info Overlay */}
                <div className="absolute bottom-6 right-6 left-6 z-[1000] flex gap-3 pointer-events-none">
                  <div className="bg-sidebar-bg/95 backdrop-blur-sm p-5 rounded-3xl border border-border-color shadow-xl flex-1 pointer-events-auto">
                    <div className="flex items-center justify-between">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">משימה נוכחית</p>
                          <p className="text-sm font-black text-text-dark">{selectedOrderForMap.items}</p>
                       </div>
                       <button className="px-5 py-2.5 bg-accent text-white rounded-2xl text-xs font-black shadow-lg shadow-accent/30 hover:bg-accent-dark transition-all active:scale-95">
                          פתח בניווט (Waze)
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Simple helper for CN since I don't want to import it everywhere if not needed, but here it is
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

// Icons from lucide-react (re-used from TrainingStudio logic)
const Edit2 = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;
