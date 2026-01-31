'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

interface GuestCalendarFormProps {
    eventId: string;
    tokenId: string;
    submitAction: (tokenId: string, userName: string, dates: string[], comment: string) => Promise<any>;
}

export function GuestCalendarForm({ eventId, tokenId, submitAction }: GuestCalendarFormProps) {
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [submitting, setSubmitting] = useState(false);

    // État du formulaire
    const [userName, setUserName] = useState('');
    const [comment, setComment] = useState('');
    const [selectedDates, setSelectedDates] = useState<string[]>([]);

    // État du calendrier (Vue actuelle)
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // --- LOGIQUE CALENDRIER ---
    const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date: Date) => {
        const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return day === 0 ? 6 : day - 1; // Ajustement pour commencer Lundi (0) au lieu de Dimanche
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const toggleDate = (day: number) => {
        // Construction de la date au format YYYY-MM-DD UTC pour éviter les décalages horaires
        const year = currentMonth.getFullYear();
        const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const dateString = `${year}-${month}-${dayStr}`;

        setSelectedDates(prev => {
            if (prev.includes(dateString)) {
                return prev.filter(d => d !== dateString);
            } else {
                return [...prev, dateString].sort();
            }
        });
    };

    // --- SOUMISSION ---
    const handleSubmit = async () => {
        if (!userName.trim() || selectedDates.length === 0) return;
        setSubmitting(true);
        try {
            await submitAction(tokenId, userName, selectedDates, comment);
            setStep('success');
        } catch (error) {
            console.error(error);
            alert("Une erreur est survenue lors de l'envoi.");
        } finally {
            setSubmitting(false);
        }
    };

    // --- RENDER SUCCESS ---
    if (step === 'success') {
        return (
            <div className="text-center py-10 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Réponse enregistrée !</h2>
                <p className="text-slate-500 mb-8">Merci {userName}, vos disponibilités ont bien été transmises.</p>
                <button
                    onClick={() => window.close()}
                    className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                >
                    Fermer la page
                </button>
            </div>
        );
    }

    // --- RENDER CALENDRIER ---
    const daysInMonth = getDaysInMonth(currentMonth);
    const startOffset = getFirstDayOfMonth(currentMonth);
    const monthLabel = currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    return (
        <div className="space-y-8">
            {/* 1. Identité */}
            <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    1. Votre Prénom
                </label>
                <input
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 text-lg font-bold transition-all"
                    placeholder="Ex: Thomas"
                />
            </div>

            {/* 2. Calendrier */}
            <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    2. Vos disponibilités
                </label>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                    {/* Header Mois */}
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-white rounded-lg transition-colors text-slate-500 hover:text-indigo-600">
                            <ChevronLeft size={20} />
                        </button>
                        <h3 className="text-lg font-black text-slate-800 capitalize select-none">
                            {monthLabel}
                        </h3>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-white rounded-lg transition-colors text-slate-500 hover:text-indigo-600">
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Grille Jours - CORRECTION ICI (utilisation de index pour la key) */}
                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, index) => (
                            <div key={index} className="text-center text-[10px] font-black text-slate-400 uppercase">
                                {d}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {/* Cases vides début de mois */}
                        {Array.from({ length: startOffset }).map((_, i) => (
                            <div key={`empty-${i}`} />
                        ))}

                        {/* Jours du mois */}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const year = currentMonth.getFullYear();
                            const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
                            const dateString = `${year}-${month}-${String(day).padStart(2, '0')}`;
                            const isSelected = selectedDates.includes(dateString);

                            // Vérification si c'est aujourd'hui
                            const today = new Date();
                            const isToday = today.getDate() === day &&
                                today.getMonth() === currentMonth.getMonth() &&
                                today.getFullYear() === currentMonth.getFullYear();

                            return (
                                <button
                                    key={day}
                                    onClick={() => toggleDate(day)}
                                    className={cn(
                                        "aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all border relative",
                                        isSelected
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-lg scale-95"
                                            : "bg-white text-slate-700 border-slate-100 hover:border-indigo-300 hover:bg-indigo-50",
                                        isToday && !isSelected && "ring-2 ring-indigo-100 text-indigo-600"
                                    )}
                                >
                                    <span>{day}</span>
                                    {isToday && !isSelected && (
                                        <span className="w-1 h-1 bg-indigo-500 rounded-full absolute bottom-2"></span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-4 text-center">
                        <p className="text-xs text-slate-400 font-medium">
                            {selectedDates.length} date(s) sélectionnée(s)
                        </p>
                    </div>
                </div>
            </div>

            {/* 3. Commentaire */}
            <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    3. Un commentaire ? (Optionnel)
                </label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 min-h-[100px] resize-none transition-all"
                    placeholder="Je ne suis pas sûr pour le 24..."
                />
            </div>

            {/* Bouton Action */}
            <button
                onClick={handleSubmit}
                disabled={!userName.trim() || selectedDates.length === 0 || submitting}
                className={cn(
                    "w-full py-5 bg-indigo-600 text-white rounded-2xl text-lg font-black shadow-xl shadow-indigo-100 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2",
                    (!userName.trim() || selectedDates.length === 0) && "opacity-50 cursor-not-allowed",
                    submitting && "opacity-80 cursor-wait"
                )}
            >
                {submitting ? (
                    <>
                        <Loader2 className="animate-spin" /> Envoi en cours...
                    </>
                ) : (
                    "Valider mes disponibilités"
                )}
            </button>
        </div>
    );
}