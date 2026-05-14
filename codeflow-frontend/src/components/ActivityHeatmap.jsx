import { useState, useMemo } from 'react';
import { 
    format, getDay, eachDayOfInterval, endOfMonth, 
    isFuture, differenceInCalendarDays, parseISO
} from 'date-fns';
import { 
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger 
} from "@/components/ui/tooltip";
import { FaInfoCircle, FaChevronRight } from 'react-icons/fa';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from 'next/link';

const ActivityHeatmap = ({ activityData }) => {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [activeDay, setActiveDay] = useState(null);

    // Helper to safely get count regardless of data format (Array vs Number)
    const getCount = (data) => {
        if (Array.isArray(data)) return data.length;
        return Number(data) || 0;
    };

    const calendarData = useMemo(() => {
        const months = [];
        for (let m = 0; m < 12; m++) {
            const monthStart = new Date(selectedYear, m, 1);
            const monthEnd = endOfMonth(monthStart);
            const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
            const startDay = getDay(monthStart); 
            const padding = Array(startDay).fill(null);
            months.push({ name: format(monthStart, 'MMM'), days: [...padding, ...daysInMonth] });
        }
        return months;
    }, [selectedYear]);

    const stats = useMemo(() => {
        if (!activityData) return { total: 0, activeDays: 0, maxStreak: 0 };
        
        const dates = Object.keys(activityData).sort();
        const yearDates = dates.filter(dateStr => parseISO(dateStr).getFullYear() === selectedYear);
        const activeDays = yearDates.length;
        
        // --- FIX: Handle Number or Array ---
        const totalSubmissions = yearDates.reduce((acc, d) => acc + getCount(activityData[d]), 0);
        
        let maxStreak = 0, currentStreak = 0, prevDate = null;
        dates.forEach((dateStr) => {
            const currentDate = parseISO(dateStr);
            if (prevDate) {
                const diff = differenceInCalendarDays(currentDate, prevDate);
                if (diff === 1) currentStreak++;
                else if (diff > 1) currentStreak = 1;
            } else currentStreak = 1;
            if (currentStreak > maxStreak) maxStreak = currentStreak;
            prevDate = currentDate;
        });
        return { total: totalSubmissions, activeDays, maxStreak };
    }, [activityData, selectedYear]);

    const getColor = (date) => {
        if (!date) return 'invisible'; 
        if (isFuture(date)) return 'bg-transparent'; 
        
        const iso = format(date, 'yyyy-MM-dd');
        // --- FIX: Use helper ---
        const count = activityData && activityData[iso] ? getCount(activityData[iso]) : 0;
        
        if (count === 0) return 'bg-gray-100 hover:bg-gray-200'; 
        if (count <= 2) return 'bg-green-200'; 
        if (count <= 4) return 'bg-green-400'; 
        return 'bg-green-600'; 
    };

    return (
        <div className="w-full bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3 text-gray-700">
                    <span className="text-xl font-medium text-gray-900">{stats.total} submissions</span>
                    <span className="text-sm text-gray-500 flex items-center gap-1">in {selectedYear} <FaInfoCircle className="text-xs" /></span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex gap-4">
                        <span>Total active days: <strong className="text-gray-900">{stats.activeDays}</strong></span>
                        <span>Max streak: <strong className="text-gray-900">{stats.maxStreak}</strong></span>
                    </div>
                    
                    <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
                        <SelectTrigger className="w-[80px] h-7 bg-white border border-gray-200 text-gray-900 hover:text-gray-900 text-xs font-medium hover:bg-gray-50 focus:ring-0">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200 text-gray-900">
                            {[0, 1, 2].map(i => (
                                <SelectItem 
                                    key={i} 
                                    value={(currentYear - i).toString()} 
                                    className="focus:bg-gray-100 focus:text-gray-900 cursor-pointer"
                                >
                                    {currentYear - i}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200">
                <div className="flex gap-3 min-w-max">
                    {calendarData.map((month, mIdx) => (
                        <div key={mIdx} className="flex flex-col gap-2">
                            <div className="grid grid-rows-7 grid-flow-col gap-[3px]" style={{ height: '88px' }}>
                                {month.days.map((day, dIdx) => {
                                    const iso = day ? format(day, 'yyyy-MM-dd') : null;
                                    const dayData = iso ? activityData?.[iso] : null;
                                    const count = dayData ? getCount(dayData) : 0;

                                    return (
                                        <TooltipProvider key={dIdx}>
                                            <Tooltip delayDuration={0}>
                                                <TooltipTrigger asChild>
                                                    <div 
                                                        onClick={() => {
                                                            // Only open modal if we actually have array data (detailed submissions)
                                                            if (day && Array.isArray(dayData) && dayData.length > 0) {
                                                                setActiveDay({ date: day, data: dayData });
                                                            }
                                                        }}
                                                        className={`w-[11px] h-[11px] rounded-[2px] transition-colors cursor-pointer ${getColor(day)}`} 
                                                    />
                                                </TooltipTrigger>
                                                {day && (
                                                    <TooltipContent className="bg-gray-900 text-white text-xs border-none px-2 py-1">
                                                        <p>{format(day, 'MMM do')}: {count} submissions</p>
                                                    </TooltipContent>
                                                )}
                                            </Tooltip>
                                        </TooltipProvider>
                                    );
                                })}
                            </div>
                            <span className="text-[10px] text-gray-400 text-center font-medium mt-1">{month.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* MODAL (Only renders if data is array type) */}
            {activeDay && (
                <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setActiveDay(null)}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden border border-gray-200" onClick={e => e.stopPropagation()}>
                        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800">{format(activeDay.date, 'MMMM do, yyyy')}</h3>
                            <button onClick={() => setActiveDay(null)} className="text-gray-400 hover:text-gray-600"><FaChevronRight className="rotate-90" /></button>
                        </div>
                        <div className="p-2 max-h-[300px] overflow-y-auto">
                            {activeDay.data.map((sub, i) => (
                                <Link href={sub.questionId ? `/problems/${sub.questionId}` : '#'} key={i} className="block">
                                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group">
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600">{sub.title}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded ${sub.status === 'Accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {sub.status}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivityHeatmap;