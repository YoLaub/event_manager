'use client';

import { useState } from 'react';
import { Check, Loader2, Users, X, MessageSquare } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

interface GuestPollFormProps {
    eventId: string;
    tokenId: string;
    pollOptions: string[];
    allowMultipleChoices: boolean;
    submitAction: (tokenId: string, name: string, dates: string[], comment: string, choices: string[]) => Promise<any>;
    existingResponses?: any[];
}

export function GuestPollForm({
    eventId: _eventId,
    tokenId,
    pollOptions,
    allowMultipleChoices,
    submitAction,
    existingResponses = [],
}: GuestPollFormProps) {
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [submitting, setSubmitting] = useState(false);
    const [userName, setUserName] = useState('');
    const [comment, setComment] = useState('');
    const [selectedChoices, setSelectedChoices] = useState<string[]>([]);
    const [viewingParticipant, setViewingParticipant] = useState<any | null>(null);

    // Compte des votes par option
    const votesPerOption = existingResponses.reduce((acc, resp) => {
        const choices: string[] = Array.isArray(resp.choices) ? resp.choices : [];
        choices.forEach(c => { acc[c] = (acc[c] || 0) + 1; });
        return acc;
    }, {} as Record<string, number>);

    const totalVoters = existingResponses.length;

    const toggleChoice = (option: string) => {
        if (allowMultipleChoices) {
            setSelectedChoices(prev =>
                prev.includes(option) ? prev.filter(c => c !== option) : [...prev, option]
            );
        } else {
            setSelectedChoices(prev => (prev.includes(option) ? [] : [option]));
        }
    };

    const handleSubmit = async () => {
        if (!userName.trim() || selectedChoices.length === 0) return;
        setSubmitting(true);
        try {
            await submitAction(tokenId, userName, [], comment, selectedChoices);
            setStep('success');
        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'envoi.");
        } finally {
            setSubmitting(false);
        }
    };

    if (step === 'success') {
        return (
            <div className="text-center py-10 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">C'est noté !</h2>
                <p className="text-slate-500 mb-8">Merci {userName}, ta réponse a été enregistrée.</p>
                <button
                    onClick={() => window.close()}
                    className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                >
                    Fermer la page
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 relative">
            {/* 1. Prénom */}
            <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    1. Ton prénom et ton nom
                </label>
                <input
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 text-lg font-bold transition-all"
                    placeholder="Ex: Thomas"
                />
            </div>

            {/* 2. Options */}
            <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    2. {allowMultipleChoices ? 'Tes choix (plusieurs possibles)' : 'Ton choix'}
                </label>
                <div className="space-y-2.5">
                    {pollOptions.map(option => {
                        const isSelected = selectedChoices.includes(option);
                        const votes = votesPerOption[option] || 0;
                        const percentage = totalVoters > 0 ? Math.round((votes / totalVoters) * 100) : 0;

                        return (
                            <button
                                key={option}
                                type="button"
                                onClick={() => toggleChoice(option)}
                                className={cn(
                                    'w-full text-left px-5 py-4 rounded-2xl border-2 transition-all relative overflow-hidden',
                                    isSelected
                                        ? 'border-indigo-600 bg-indigo-600 text-white'
                                        : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50'
                                )}
                            >
                                {/* Barre de popularité en fond */}
                                {!isSelected && totalVoters > 0 && (
                                    <div
                                        className="absolute inset-y-0 left-0 bg-indigo-50 transition-all duration-500"
                                        style={{ width: `${percentage}%` }}
                                    />
                                )}

                                <div className="relative flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        {/* Indicateur radio/checkbox */}
                                        <div className={cn(
                                            'flex-shrink-0 flex items-center justify-center transition-all',
                                            allowMultipleChoices
                                                ? 'w-5 h-5 rounded-md border-2'
                                                : 'w-5 h-5 rounded-full border-2',
                                            isSelected
                                                ? 'border-white bg-white/20'
                                                : 'border-slate-300'
                                        )}>
                                            {isSelected && <Check size={12} className={allowMultipleChoices ? 'text-white' : 'text-white'} />}
                                        </div>
                                        <span className="font-bold text-sm">{option}</span>
                                    </div>

                                    {/* Compteur de votes */}
                                    {totalVoters > 0 && (
                                        <span className={cn(
                                            'text-xs font-bold shrink-0',
                                            isSelected ? 'text-indigo-100' : 'text-slate-400'
                                        )}>
                                            {votes > 0 ? `${votes} vote${votes > 1 ? 's' : ''}` : ''}
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 3. Commentaire */}
            <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    3. Note (Optionnel)
                </label>
                <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 min-h-[80px] resize-none transition-all"
                    placeholder="..."
                />
            </div>

            {/* Liste des participants */}
            {existingResponses.length > 0 && (
                <div className="bg-indigo-50/50 p-5 rounded-3xl border border-indigo-50">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-900 mb-3">
                        <Users size={16} className="text-indigo-600" /> Ils ont déjà répondu :
                    </h4>
                    <p className="text-[10px] text-indigo-400 mb-3 font-medium px-1">Cliquez pour voir le détail.</p>
                    <div className="flex flex-wrap gap-2">
                        {existingResponses.map((r, idx) => (
                            <button
                                key={idx}
                                onClick={() => setViewingParticipant(r)}
                                className="px-3 py-1 bg-white border border-indigo-100 text-slate-600 text-xs font-bold rounded-full shadow-sm hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md transition-all active:scale-95"
                            >
                                {r.guestName}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <button
                onClick={handleSubmit}
                disabled={!userName.trim() || selectedChoices.length === 0 || submitting}
                className={cn(
                    'w-full py-5 bg-indigo-600 text-white rounded-2xl text-lg font-black shadow-xl shadow-indigo-100 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2',
                    (!userName.trim() || selectedChoices.length === 0) && 'opacity-50 cursor-not-allowed',
                    submitting && 'opacity-80 cursor-wait'
                )}
            >
                {submitting ? <Loader2 className="animate-spin" /> : 'Valider ma réponse'}
            </button>

            {/* Modal détail participant */}
            {viewingParticipant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xs p-6 relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setViewingParticipant(null)}
                            className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                        >
                            <X size={16} />
                        </button>

                        <div className="text-center mb-5">
                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 font-black text-xl">
                                {(viewingParticipant.guestName || '?').charAt(0).toUpperCase()}
                            </div>
                            <h4 className="font-bold text-lg text-slate-900">{viewingParticipant.guestName}</h4>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Ses choix</p>
                        </div>

                        <div className="flex flex-wrap justify-center gap-2 mb-4">
                            {(Array.isArray(viewingParticipant.choices) ? viewingParticipant.choices : []).map((c: string) => (
                                <span key={c} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100">
                                    {c}
                                </span>
                            ))}
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
                    <div className="absolute inset-0 -z-10" onClick={() => setViewingParticipant(null)} />
                </div>
            )}
        </div>
    );
}
