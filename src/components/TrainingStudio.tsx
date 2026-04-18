import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Truck, Users, Package, AlertCircle, CheckCircle2, Clock, MapPin, Construction, Search, Filter, X, Palette, Settings2, Calendar } from 'lucide-react';

export const TrainingStudio = () => {
  const [rounds, setRounds] = useState([
    { id: 1, date: '2026-04-18', time: '07:30', driver: 'חכמת', vehicle: 'מנוף 🏗️', warehouse: 'מרכזי', customer: 'זבולון-עדירן', destination: 'אתר אשקלון', status: 'בדרך' },
    { id: 2, date: '2026-04-18', time: '08:00', driver: 'עלי', vehicle: 'משאית 🚛', warehouse: 'מרכזי', customer: 'סביון', destination: 'גן יבנה', status: 'העמסה' },
    { id: 3, date: '2026-04-18', time: '09:15', driver: 'חכמת', vehicle: 'מנוף 🏗️', warehouse: 'משני', customer: 'פרץ בוני הנגב', destination: 'באר שבע', status: 'מוכנה' },
    { id: 4, date: '2026-04-19', time: '10:00', driver: 'פואד', vehicle: 'טנדר', warehouse: 'מרכזי', customer: 'פרטי', destination: 'אשדוד', status: 'בהכנה' },
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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredRounds = useMemo(() => {
    return rounds.filter(round => {
      const matchesSearch = 
        round.customer.toLowerCase().includes(search.toLowerCase()) ||
        round.destination.toLowerCase().includes(search.toLowerCase()) ||
        round.driver.toLowerCase().includes(search.toLowerCase());
      
      const matchesDriver = driverFilter === 'all' || round.driver === driverFilter;
      const matchesStatus = statusFilter === 'all' || round.status === statusFilter;

      const roundDate = round.date ? new Date(round.date).getTime() : -Infinity;
      const start = startDate ? new Date(startDate).getTime() : -Infinity;
      const end = endDate ? new Date(endDate).getTime() : Infinity;
      const matchesDate = roundDate >= start && roundDate <= end;

      return matchesSearch && matchesDriver && matchesStatus && matchesDate;
    });
  }, [rounds, search, driverFilter, statusFilter, startDate, endDate]);

  const stats = useMemo(() => ({
    total: rounds.length,
    completed: rounds.filter(r => r.status === 'בוצע').length,
    pending: rounds.filter(r => r.status === 'בהכנה' || r.status === 'מוכנה').length,
    inTransit: rounds.filter(r => r.status === 'בדרך').length,
  }), [rounds]);

  return (
    <div className="flex flex-col h-full gap-6 p-6 overflow-y-auto bg-bg-main" dir="rtl">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-dark flex items-center gap-2">
            <Construction className="text-accent" />
            סבבי בוקר - ח. סבן
          </h2>
          <p className="text-text-muted text-sm">מרכז שליטה לוגיסטי - {new Date().toLocaleDateString('he-IL')}</p>
        </div>
        
        <div className="flex gap-3">
          <div className="bg-white p-3 rounded-2xl border border-border-color shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent font-bold">{stats.total}</div>
            <span className="text-xs font-bold text-text-muted uppercase">סה"כ סבבים</span>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-border-color shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 font-bold">{stats.inTransit}</div>
            <span className="text-xs font-bold text-text-muted uppercase">בדרך</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rules & Inventory Tips (Knowledge Base Sidebar) */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="bg-white p-6 rounded-3xl border border-border-color shadow-sm"
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-accent" />
              חוקי הזמנה ומלאי
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-3 p-3 bg-zinc-50 rounded-2xl border border-border-color">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-xs">
                  <span className="text-xs font-bold text-accent">!</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-text-dark">בטון ב-30</p>
                  <p className="text-[11px] text-text-muted">מחייב מינימום 6 קוב להזמנה.</p>
                </div>
              </li>
              <li className="flex gap-3 p-3 bg-zinc-50 rounded-2xl border border-border-color">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-xs">
                  <span className="text-xs font-bold text-accent">!</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-text-dark">שקי ריצופית</p>
                  <p className="text-[11px] text-text-muted">מעל 40 שק מחייב משטח סבן בפיקדון.</p>
                </div>
              </li>
              <li className="flex gap-3 p-3 bg-zinc-50 rounded-2xl border border-border-color opacity-60">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-xs">
                  <span className="text-xs font-bold text-zinc-400">i</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-text-dark">הובלת מנוף</p>
                  <p className="text-[11px] text-text-muted">יש לוודא דרכי גישה פנויות לקמ"ש.</p>
                </div>
              </li>
            </ul>
          </motion.div>

          <div className="bg-accent text-white p-5 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="font-bold text-sm mb-1 uppercase tracking-wider">לקוחות VIP</h4>
              <p className="text-xs opacity-90 mb-4">זבולון-עדירן, עודד וסמיר - עדיפות בקו ראשון.</p>
              <button className="text-[10px] font-bold bg-white/20 px-3 py-1 rounded-full border border-white/30">ניהול אתרים</button>
            </div>
            <Construction className="absolute -bottom-4 -right-4 w-24 h-24 opacity-20 rotate-12" />
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-3xl border border-border-color shadow-sm"
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Palette size={20} className="text-accent" />
              התאמת צבעי סטטוס
            </h3>
            <div className="space-y-3">
              {Object.keys(statusColors).map(status => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-muted">{status}</span>
                  <div className="flex gap-1">
                    {availableColors.map(color => (
                      <button
                        key={color}
                        onClick={() => setStatusColors(prev => ({ ...prev, [status]: color }))}
                        className={`w-4 h-4 rounded-full transition-all border-2 ${
                            statusColors[status] === color ? 'border-accent scale-125' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color === 'emerald' ? '#10b981' : color === 'amber' ? '#f59e0b' : color === 'purple' ? '#a855f7' : color === 'zinc' ? '#71717a' : color === 'rose' ? '#f43f5e' : color === 'sky' ? '#0ea5e9' : '#3b82f6' }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Schedule Table (The Report) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col gap-3 bg-white p-4 rounded-3xl border border-border-color shadow-sm">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input 
                  type="text"
                  placeholder="חיפוש נהג, לקוח או יעד..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-zinc-50 border border-border-color rounded-xl py-2 pr-10 pl-4 text-xs outline-none focus:ring-2 focus:ring-accent/20 transition-all font-medium"
                />
                {search && (
                  <button 
                    onClick={() => setSearch('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-dark"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              
              <div className="flex gap-2">
                <div className="relative">
                  <select 
                    value={driverFilter}
                    onChange={(e) => setDriverFilter(e.target.value)}
                    className="appearance-none bg-zinc-50 border border-border-color rounded-xl py-2 pr-4 pl-10 text-xs font-bold outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
                  >
                    <option value="all">כל הנהגים</option>
                    <option value="חכמת">חכמת</option>
                    <option value="עלי">עלי</option>
                    <option value="פואד">פואד</option>
                  </select>
                  <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>

                <div className="relative">
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none bg-zinc-50 border border-border-color rounded-xl py-2 pr-4 pl-10 text-xs font-bold outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
                  >
                    <option value="all">כל הסטטוסים</option>
                    <option value="בהכנה">בהכנה</option>
                    <option value="מוכנה">מוכנה</option>
                    <option value="העמסה">העמסה</option>
                    <option value="בדרך">בדרך</option>
                    <option value="בוצע">בוצע</option>
                  </select>
                  <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-3 border-t border-zinc-100 pt-3">
              <div className="flex items-center gap-2 text-xs font-bold text-text-muted">
                <Calendar size={14} />
                <span>טווח תאריכים:</span>
              </div>
              <div className="flex items-center gap-2 flex-1 w-full md:w-auto">
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-zinc-50 border border-border-color rounded-xl py-1.5 px-3 text-xs font-medium outline-none focus:ring-2 focus:ring-accent/20 flex-1"
                />
                <span className="text-zinc-300">עד</span>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-zinc-50 border border-border-color rounded-xl py-1.5 px-3 text-xs font-medium outline-none focus:ring-2 focus:ring-accent/20 flex-1"
                />
                {(startDate || endDate) && (
                  <button 
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    title="נקה תאריכים"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-border-color shadow-sm overflow-hidden overflow-x-auto no-scrollbar">
            <table className="w-full text-right">
              <thead className="bg-zinc-50 border-b border-border-color text-[11px] font-bold text-text-muted uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">שעה</th>
                  <th className="px-6 py-4">נהג</th>
                  <th className="px-6 py-4">לקוח / יעד</th>
                  <th className="px-6 py-4">סטטוס</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <AnimatePresence mode="popLayout">
                  {filteredRounds.length > 0 ? (
                    filteredRounds.map((round, idx) => (
                      <motion.tr 
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: 0.05 * idx }}
                        key={round.id}
                        className="hover:bg-zinc-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-zinc-400" />
                        <span className="text-xs font-bold">{round.time}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-zinc-100 rounded-full flex items-center justify-center text-[10px] font-bold">
                          {round.driver === 'חכמת' ? '🏗️' : '🚛'}
                        </div>
                        <span className="text-xs font-medium">{round.driver}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold">{round.customer}</p>
                      <div className="flex items-center gap-1 text-[10px] text-text-muted opacity-80">
                        <MapPin size={10} />
                        {round.destination}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${getStatusColor(round.status)}`}>
                        {round.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <button className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-zinc-100 rounded-lg transition-all text-text-muted">
                        <CheckCircle2 size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-zinc-50/20"
                >
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-50">
                      <Search size={32} className="text-zinc-300" />
                      <p className="text-sm font-medium text-text-muted">לא נמצאו תוצאות לחיפוש ולסינון הנוכחי</p>
                      <button 
                        onClick={() => {
                          setSearch('');
                          setDriverFilter('all');
                          setStatusFilter('all');
                          setStartDate('');
                          setEndDate('');
                        }}
                        className="text-xs font-bold text-accent hover:underline mt-2"
                      >
                        נקה את כל המסננים
                      </button>
                    </div>
                  </td>
                </motion.tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

          <div className="flex justify-between items-center text-xs text-text-muted px-2">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              עדכון אחרון: 16:13
            </span>
            <span className="font-bold hover:text-accent cursor-pointer transition-colors">ייצוא דוח בוקר ל-PDF</span>
          </div>
        </div>
      </div>
    </div>
  );
};
