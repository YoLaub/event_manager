'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Loader2, Users, X, Calendar, MessageSquare } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

interface GuestCalendarFormProps {
    eventId: string;
    tokenId: string;
    submitAction: (tokenId: string, userName: string, dates: string[], comment: string) => Promise<any>;
    existingResponses?: any[];
}

export function GuestCalendarForm({ eventId, tokenId, submitAction, existingResponses = [] }: GuestCalendarFormProps) {
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [submitting, setSubmitting] = useState(false);

    // État du formulaire
    const [userName, setUserName] = useState('');
    const [comment, setComment] = useState('');
    const [selectedDates, setSelectedDates] = useState<string[]>([]);

    // État du calendrier
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // NOUVEAU : État pour voir le détail d'un participant
    const [viewingParticipant, setViewingParticipant] = useState<any | null>(null);

    // --- CALCUL DES STATS ---
    const votesPerDay = existingResponses.reduce((acc, resp) => {
        let dates = [];
        try {
            dates = Array.isArray(resp.selectedDates)
                ? resp.selectedDates
                : JSON.parse(resp.selectedDates || resp.dates || '[]');
        } catch(e) { dates = [] }

        dates.forEach((d: string) => {
            acc[d] = (acc[d] || 0) + 1;
        });
        return acc;
    }, {} as Record<string, number>);

    // --- LOGIQUE CALENDRIER ---
    const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date: Date) => {
        const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return day === 0 ? 6 : day - 1;
    };

    const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    const toggleDate = (day: number) => {
        const year = currentMonth.getFullYear();
        const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const dateString = `${year}-${month}-${dayStr}`;

        setSelectedDates(prev => prev.includes(dateString) ? prev.filter(d => d !== dateString) : [...prev, dateString].sort());
    };

    const handleSubmit = async () => {
        if (!userName.trim() || selectedDates.length === 0) return;
        setSubmitting(true);
        try {
            await submitAction(tokenId, userName, selectedDates, comment);
            setStep('success');
        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'envoi.");
        } finally {
            setSubmitting(false);
        }
    };

    // Helper pour parser les dates d'un participant spécifique
    const getParticipantDates = (participant: any): string[] => {
        try {
            return Array.isArray(participant.selectedDates)
                ? participant.selectedDates
                : JSON.parse(participant.selectedDates || participant.dates || '[]');
        } catch (e) { return []; }
    };

    if (step === 'success') {
        return (
            <div className="text-center py-10 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">C'est noté !</h2>
                <p className="text-slate-500 mb-8">Merci {userName}, ta réponse a été ajoutée.</p>
                <button onClick={() => window.close()} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">Fermer la page</button>
            </div>
        );
    }

    const daysInMonth = getDaysInMonth(currentMonth);
    const startOffset = getFirstDayOfMonth(currentMonth);
    const monthLabel = currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    return (
        <div className="space-y-8 relative">
            {/* 1. Prénom */}
            <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">1. Ton Prénom</label>
                <input
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 text-lg font-bold transition-all"
                    placeholder="Ex: Thomas"
                />
            </div>

            {/* 2. Calendrier */}
            <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">2. Tes disponibilités</label>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-white rounded-lg transition-colors text-slate-500"><ChevronLeft size={20} /></button>
                        <h3 className="text-lg font-black text-slate-800 capitalize select-none">{monthLabel}</h3>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-white rounded-lg transition-colors text-slate-500"><ChevronRight size={20} /></button>
                    </div>

                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                            <div key={i} className="text-center text-[10px] font-black text-slate-400 uppercase">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: startOffset }).map((_, i) => <div key={`empty-${i}`} />)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const year = currentMonth.getFullYear();
                            const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
                            const dateString = `${year}-${month}-${String(day).padStart(2, '0')}`;
                            const isSelected = selectedDates.includes(dateString);

                            const popularity = votesPerDay[dateString] || 0;
                            const isToday = new Date().toDateString() === new Date(year, parseInt(month)-1, day).toDateString();

                            return (
                                <button
                                    key={day}
                                    onClick={() => toggleDate(day)}
                                    className={cn(
                                        "aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all border relative",
                                        isSelected
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-lg scale-95 z-10"
                                            : "bg-white text-slate-700 border-slate-100 hover:border-indigo-300 hover:bg-indigo-50",
                                        isToday && !isSelected && "ring-2 ring-indigo-100 text-indigo-600"
                                    )}
                                >
                                    <span>{day}</span>
                                    {popularity > 0 && !isSelected && (
                                        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-emerald-100 text-emerald-700 text-[9px] flex items-center justify-center rounded-full border border-white font-extrabold shadow-sm z-20" title={`${popularity} personnes disponibles`}>
                                            {popularity}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 3. Note */}
            <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">3. Note (Optionnel)</label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 min-h-[80px] resize-none transition-all"
                    placeholder="..."
                />
            </div>

            {/* LISTE DES PARTICIPANTS */}
            {existingResponses.length > 0 && (
                <div className="bg-indigo-50/50 p-5 rounded-3xl border border-indigo-50">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-900 mb-3">
                        <Users size={16} className="text-indigo-600"/> Ils ont déjà répondu :
                    </h4>
                    <p className="text-[10px] text-indigo-400 mb-3 font-medium px-1">Cliquez pour voir le détail.</p>
                    <div className="flex flex-wrap gap-2">
                        {existingResponses.map((r, idx) => (
                            <button
                                key={idx}
                                onClick={() => setViewingParticipant(r)}
                                className="px-3 py-1 bg-white border border-indigo-100 text-slate-600 text-xs font-bold rounded-full shadow-sm hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md transition-all active:scale-95"
                            >
                                {r.guestName || r.userName}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <button
                onClick={handleSubmit}
                disabled={!userName.trim() || selectedDates.length === 0 || submitting}
                className={cn(
                    "w-full py-5 bg-indigo-600 text-white rounded-2xl text-lg font-black shadow-xl shadow-indigo-100 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2",
                    (!userName.trim() || selectedDates.length === 0) && "opacity-50 cursor-not-allowed",
                    submitting && "opacity-80 cursor-wait"
                )}
            >
                {submitting ? <Loader2 className="animate-spin" /> : "Valider mes disponibilités"}
            </button>

            {/* MODAL DE DÉTAIL PARTICIPANT */}
            {viewingParticipant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xs p-6 relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setViewingParticipant(null)}
                            className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                        >
                            <X size={16} />
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 font-black text-xl">
                                {(viewingParticipant.guestName || viewingParticipant.userName || '?').charAt(0).toUpperCase()}
                            </div>
                            <h4 className="font-bold text-lg text-slate-900">{viewingParticipant.guestName || viewingParticipant.userName}</h4>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Ses disponibilités</p>
                        </div>

                        <div className="max-h-[200px] overflow-y-auto space-y-2 mb-4 pr-1 custom-scrollbar">
                            <div className="flex flex-wrap justify-center gap-2">
                                {getParticipantDates(viewingParticipant).sort().map((dateStr) => (
                                    <span key={dateStr} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100">
                                        {new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {viewingParticipant.comment && (
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                                <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 uppercase mb-1">
                                    <MessageSquare size={10} /> Note
                                </div>
                                <p className="text-sm text-slate-600 italic">"{viewingParticipant.comment}"</p>
                            </div>
                        )}
                    </div>
                    {/* Backdrop click to close */}
                    <div className="absolute inset-0 -z-10" onClick={() => setViewingParticipant(null)} />
                </div>
            )}
        </div>
    );
}