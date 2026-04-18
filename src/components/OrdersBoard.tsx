import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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
  const [rounds, setRounds] = useState([
    { id: 1, date: '2026-04-18', time: '07:30', driver: 'חכמת', vehicle: 'מנוף 🏗️', warehouse: 'החרש', customer: 'זבולון-עדירן', destination: 'אתר אשקלון', coords: { lat: 31.6667, lng: 34.5667 }, status: 'בדרך', items: 'בטון ב-30 (7 קוב), ברזל 12"', priority: 'high' },
    { id: 2, date: '2026-04-18', time: '08:00', driver: 'עלי', vehicle: 'משאית 🚛', warehouse: 'התלמיד', customer: 'סביון', destination: 'גן יבנה', coords: { lat: 31.8105, lng: 34.7175 }, status: 'העמסה', items: 'ריצופית (50 שק), דבק שיש', priority: 'medium' },
    { id: 3, date: '2026-04-18', time: '09:15', driver: 'חכמת', vehicle: 'מנוף 🏗️', warehouse: 'החרש', customer: 'פרץ בוני הנגב', destination: 'באר שבע', coords: { lat: 31.2518, lng: 34.7913 }, status: 'מוכנה', items: 'איטום גגות, פלטות גבס', priority: 'high' },
  ]);

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

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] text-[#1e293b] font-sans overflow-hidden" dir="rtl">
      {/* Top Header - Global Tools */}
      <header className="bg-white border-b border-zinc-200 px-8 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-white shadow-lg shadow-accent/20">
            <TrendingUp size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter">לוח זמנים והפצה</h1>
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
              <Clock size={12} />
              <span>עדכון אחרון: {new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="w-1 h-1 bg-zinc-300 rounded-full" />
              <span>{filteredRounds.length} הזמנות מוצגות</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold hover:bg-zinc-50 transition-all shadow-sm">
            <Share2 size={16} className="text-accent" />
            <span>שתף דוח בוקר</span>
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl text-xs font-black shadow-lg shadow-accent/30 hover:bg-accent-dark transition-all active:scale-95">
            <Plus size={18} />
            <span>הזמנה חדשה</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Right Sidebar - Stats & Tools */}
        <aside className="w-80 border-l border-zinc-200 bg-white overflow-y-auto p-6 space-y-8 shrink-0">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100">
              <div className="text-blue-600 mb-1"><Truck size={20} /></div>
              <div className="text-2xl font-black text-blue-700">{stats.inTransit}</div>
              <div className="text-[10px] font-bold text-blue-500 uppercase">בדרך ליעד</div>
            </div>
            <div className="bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100">
              <div className="text-emerald-600 mb-1"><CheckCircle2 size={20} /></div>
              <div className="text-2xl font-black text-emerald-700">{stats.completed}</div>
              <div className="text-[10px] font-bold text-emerald-500 uppercase">הושלמו</div>
            </div>
            <div className="bg-amber-50/50 p-4 rounded-3xl border border-amber-100">
              <div className="text-amber-600 mb-1"><Clock size={20} /></div>
              <div className="text-2xl font-black text-amber-700">{stats.pending}</div>
              <div className="text-[10px] font-bold text-amber-500 uppercase">ממתינים</div>
            </div>
            <div className="bg-zinc-50/50 p-4 rounded-3xl border border-zinc-100">
              <div className="text-zinc-600 mb-1"><Users size={20} /></div>
              <div className="text-2xl font-black text-zinc-700">{stats.activeDrivers}</div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase">נהגים פעילים</div>
            </div>
          </div>

          {/* Active Drivers List */}
          <div>
            <h3 className="text-sm font-black mb-4 flex items-center justify-between">
              <span>סטטוס נהגים</span>
              <span className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded-full text-zinc-500">חי</span>
            </h3>
            <div className="space-y-3">
              {['חכמת', 'עלי'].map((driver) => (
                <div key={driver} className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-lg">
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
              <div className="bg-rose-50 p-3 rounded-2xl border border-rose-100 border-r-4 border-r-rose-500">
                <p className="text-[11px] font-bold text-rose-700">חסר מלאי: בטון ב-30</p>
                <p className="text-[10px] text-rose-600 opacity-80 leading-relaxed">משלוח "זבולון" מעוכב - ממתינים למערבל מהמרכזי.</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100 border-r-4 border-r-amber-500">
                <p className="text-[11px] font-bold text-amber-700">נהג "עלי" - חריגה</p>
                <p className="text-[10px] text-amber-600 opacity-80 leading-relaxed">זמן העמסה מעל 45 דק' באתר מרכזי.</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Central Dashboard Grid */}
        <main className="flex-1 p-8 overflow-y-auto space-y-6">
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
                    alert.color === 'rose' ? "bg-rose-50 border-rose-100" :
                    alert.color === 'amber' ? "bg-amber-50 border-amber-100" : "bg-blue-50 border-blue-100"
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
          <div className="bg-white p-5 rounded-[2.5rem] border border-zinc-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1 group">
                <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-accent transition-colors" />
                <input 
                  type="text"
                  placeholder="חיפוש מהיר של לקוח, נהג, כתובת או מוצרים..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-3 pr-12 pl-4 text-sm outline-none focus:ring-4 focus:ring-accent/10 focus:bg-white transition-all font-medium"
                />
              </div>
              
              <div className="flex gap-2 shrink-0">
                <div className="relative">
                  <select 
                    value={driverFilter}
                    onChange={(e) => setDriverFilter(e.target.value)}
                    className="appearance-none bg-zinc-50 border border-zinc-100 rounded-2xl py-3 pr-4 pl-10 text-xs font-black outline-none focus:ring-4 focus:ring-accent/10 cursor-pointer hover:bg-white transition-all min-w-[140px]"
                  >
                    <option value="all">כל הנהגים</option>
                    <option value="חכמת">חכמת</option>
                    <option value="עלי">עלי</option>
                  </select>
                  <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none bg-zinc-50 border border-zinc-100 rounded-2xl py-3 pr-4 pl-10 text-xs font-black outline-none focus:ring-4 focus:ring-accent/10 cursor-pointer hover:bg-white transition-all min-w-[140px]"
                  >
                    <option value="all">כל הסטטוסים</option>
                    <option value="בהכנה">בהכנה</option>
                    <option value="מוכנה">מוכנה</option>
                    <option value="העמסה">העמסה</option>
                    <option value="בדרך">בדרך</option>
                    <option value="בוצע">בוצע</option>
                  </select>
                  <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select 
                    value={warehouseFilter}
                    onChange={(e) => setWarehouseFilter(e.target.value)}
                    className="appearance-none bg-zinc-50 border border-zinc-100 rounded-2xl py-3 pr-4 pl-10 text-xs font-black outline-none focus:ring-4 focus:ring-accent/10 cursor-pointer hover:bg-white transition-all min-w-[140px]"
                  >
                    <option value="all">כל המחסנים</option>
                    <option value="החרש">החרש</option>
                    <option value="התלמיד">התלמיד</option>
                  </select>
                  <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-50 pt-4">
               <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="flex items-center gap-2 text-xs font-black text-zinc-400 shrink-0">
                     <Calendar size={14} />
                     <span>תאריכי אספקה:</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                     <input 
                       type="date"
                       value={startDate}
                       onChange={(e) => setStartDate(e.target.value)}
                       className="bg-zinc-50 border border-zinc-100 rounded-xl py-2 px-4 text-xs font-bold outline-none focus:ring-4 focus:ring-accent/10 flex-1 hover:bg-white"
                     />
                     <span className="text-zinc-300 font-bold">~</span>
                     <input 
                       type="date"
                       value={endDate}
                       onChange={(e) => setEndDate(e.target.value)}
                       className="bg-zinc-50 border border-zinc-100 rounded-xl py-2 px-4 text-xs font-bold outline-none focus:ring-4 focus:ring-accent/10 flex-1 hover:bg-white"
                     />
                  </div>
               </div>

               <div className="flex items-center gap-2">
                 {(search || driverFilter !== 'all' || statusFilter !== 'all' || warehouseFilter !== 'all' || startDate || endDate) && (
                   <button 
                     onClick={() => {
                        setSearch('');
                        setDriverFilter('all');
                        setStatusFilter('all');
                        setWarehouseFilter('all');
                        setStartDate('');
                        setEndDate('');
                     }}
                     className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1"
                   >
                     <X size={14} />
                     נקה הכל
                   </button>
                 )}
                 <div className="h-6 w-px bg-zinc-200 mx-2" />
                 <button className="p-2 hover:bg-zinc-50 rounded-xl text-zinc-400 transition-colors">
                    <Box size={18} />
                 </button>
                 <button 
                  onClick={() => setIsColorModalOpen(true)}
                  className="p-2 hover:bg-zinc-50 rounded-xl text-zinc-400 hover:text-accent transition-colors"
                  title="התאמת צבעים"
                 >
                    <Palette size={18} />
                 </button>
               </div>
            </div>
          </div>

          {/* Color Customization Modal */}
          <AnimatePresence>
            {isColorModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsColorModalOpen(false)}
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-zinc-200 p-8 overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                        <Palette size={20} />
                      </div>
                      <h3 className="text-xl font-black tracking-tight">התאמת צבעי סטטוס</h3>
                    </div>
                    <button 
                      onClick={() => setIsColorModalOpen(false)}
                      className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-400 transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {Object.keys(statusColors).map(status => (
                      <div key={status} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-zinc-700">{status}</span>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black border transition-all",
                            getStatusColor(status)
                          )}>
                             תצוגה מקדימה
                          </span>
                        </div>
                        <div className="flex gap-2 justify-between bg-zinc-50 p-3 rounded-2xl border border-zinc-100">
                          {availableColors.map(color => (
                            <button
                              key={color}
                              onClick={() => setStatusColors(prev => ({ ...prev, [status]: color }))}
                              className={cn(
                                "w-6 h-6 rounded-full transition-all border-2",
                                statusColors[status] === color ? "border-accent scale-110 shadow-md shadow-accent/20" : "border-white hover:scale-110"
                              )}
                              style={{ 
                                backgroundColor: 
                                  color === 'blue' ? '#3b82f6' : 
                                  color === 'emerald' ? '#10b981' : 
                                  color === 'amber' ? '#f59e0b' : 
                                  color === 'purple' ? '#a855f7' : 
                                  color === 'zinc' ? '#71717a' : 
                                  color === 'rose' ? '#f43f5e' : '#0ea5e9' 
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10">
                    <button 
                      onClick={() => setIsColorModalOpen(false)}
                      className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-zinc-200 hover:bg-zinc-800 transition-all active:scale-[0.98]"
                    >
                      שמור שינויים
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Orders Table Container */}
          <div className="bg-white rounded-[2.5rem] border border-zinc-200 shadow-xl shadow-zinc-200/50 overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto max-h-[600px] no-scrollbar">
              <table className="w-full text-right border-collapse">
                <thead className="sticky top-0 bg-white z-10 border-b-2 border-zinc-50">
                  <tr className="text-[10px] font-black text-zinc-400 tracking-[0.2em] uppercase">
                    <th className="px-8 py-6">תעדוף</th>
                    <th className="px-6 py-6 text-center">זמן ונהג</th>
                    <th className="px-6 py-6">לקוח ויעד</th>
                    <th className="px-6 py-6">פירוט סחורה</th>
                    <th className="px-6 py-6">סטטוס</th>
                    <th className="px-8 py-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
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
                          className="hover:bg-zinc-50/70 transition-all group"
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
                              <span className="text-sm font-black text-[#1e293b]">{round.time}</span>
                              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-100 rounded-full">
                                <span className="text-[9px] font-bold text-zinc-500">{round.driver}</span>
                                {round.status === 'בדרך' && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />}
                                {round.priority === 'high' && round.status !== 'בוצע' && (
                                  <AlertCircle size={10} className="text-rose-500 animate-pulse" />
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 min-w-[180px]">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-black">{round.customer}</p>
                                <span className="text-[9px] px-1.5 py-0.5 bg-zinc-100 text-zinc-500 rounded font-bold uppercase tracking-tighter">
                                    מחסן {round.warehouse}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-bold group/loc cursor-pointer hover:text-accent transition-colors" onClick={() => setSelectedOrderForMap(round)}>
                              <MapPin size={10} className="text-accent" />
                              <span className="border-b border-dotted border-zinc-200 group-hover/loc:border-accent">
                                {round.destination}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <p className="text-[11px] font-bold text-zinc-500 leading-relaxed max-w-[200px]">
                              {round.items}
                            </p>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-2">
                              <span className={cn(
                                "px-3 py-1.5 rounded-2xl text-[10px] font-black border text-center transition-all",
                                getStatusColor(round.status)
                              )}>
                                {round.status}
                              </span>
                              <div className="w-full bg-zinc-100 h-1 rounded-full overflow-hidden">
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
                              <button className="p-2 hover:bg-white hover:shadow-md border border-transparent hover:border-zinc-100 rounded-xl text-zinc-400 hover:text-accent transition-all">
                                <Edit2 size={16} />
                              </button>
                              <button className="p-2 hover:bg-white hover:shadow-md border border-transparent hover:border-zinc-100 rounded-xl text-zinc-400 hover:text-emerald-500 transition-all">
                                <CheckCircle2 size={16} />
                              </button>
                              <button className="p-2 hover:bg-white hover:shadow-md border border-transparent hover:border-zinc-100 rounded-xl text-zinc-400 hover:text-zinc-600 transition-all">
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
                            <Box size={48} className="text-zinc-300" />
                            <div>
                               <p className="text-lg font-black text-zinc-500">אין הזמנות תואמות לסינון</p>
                               <p className="text-sm font-bold text-zinc-400">נסה לשנות את טווח התאריכים או הנהג</p>
                            </div>
                            <button 
                              onClick={() => {
                                 setSearch('');
                                 setDriverFilter('all');
                                 setStatusFilter('all');
                                 setWarehouseFilter('all');
                                 setStartDate('');
                                 setEndDate('');
                              }}
                              className="px-6 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-xs font-black transition-all"
                            >
                              אפס את כל המערכת
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            
            {/* Table Footer */}
            <div className="bg-zinc-50 p-6 border-t border-zinc-100 flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm" />
                     <span className="text-[10px] font-bold text-zinc-500">עדיפות גבוהה</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm" />
                     <span className="text-[10px] font-bold text-zinc-500">עדיפות בינונית</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-blue-400 shadow-sm" />
                     <span className="text-[10px] font-bold text-zinc-500">עדיפות נמוכה</span>
                  </div>
               </div>
               
               <div className="flex items-center gap-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  <span>עמוד 1 מתוך 4</span>
                  <div className="flex gap-2">
                     <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-zinc-200 hover:bg-zinc-50 disabled:opacity-30" disabled>
                        <ChevronDown size={14} className="rotate-90" />
                     </button>
                     <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-zinc-200 hover:bg-zinc-50">
                        <ChevronDown size={14} className="-rotate-90" />
                     </button>
                  </div>
               </div>
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
              className="relative bg-white w-full max-w-4xl h-[80vh] rounded-[3rem] shadow-2xl border border-zinc-200 overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-zinc-100 flex items-center justify-between shrink-0 bg-white z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">{selectedOrderForMap.customer}</h3>
                    <p className="text-xs font-bold text-zinc-400">{selectedOrderForMap.destination}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedOrderForMap(null)}
                  className="p-3 hover:bg-zinc-100 rounded-2xl text-zinc-400 transition-all active:scale-90"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Map Container Area */}
              <div className="flex-1 relative bg-zinc-100">
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
                        <p className="font-bold text-sm mb-1">{selectedOrderForMap.customer}</p>
                        <p className="text-xs text-zinc-500">{selectedOrderForMap.items}</p>
                        <p className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded mt-2 inline-block font-bold">
                          {selectedOrderForMap.driver} • {selectedOrderForMap.time}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                  <RecenterMap coords={selectedOrderForMap.coords} />
                </MapContainer>

                {/* Quick Info Overlay */}
                <div className="absolute bottom-6 right-6 left-6 z-[1000] flex gap-3 pointer-events-none">
                  <div className="bg-white/95 backdrop-blur-sm p-5 rounded-3xl border border-white/20 shadow-xl flex-1 pointer-events-auto">
                    <div className="flex items-center justify-between">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">משימה נוכחית</p>
                          <p className="text-sm font-black text-zinc-900">{selectedOrderForMap.items}</p>
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
