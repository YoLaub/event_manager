'use client';

import { useState, useRef } from 'react';
import { Plus, X, Calendar, BarChart2, ToggleLeft, ToggleRight } from 'lucide-react';

interface CreateEventFormProps {
    action: (formData: FormData) => Promise<void>;
}

export function CreateEventForm({ action }: CreateEventFormProps) {
    const [type, setType] = useState<'DATE_POLL' | 'SIMPLE_POLL'>('DATE_POLL');
    const [options, setOptions] = useState<string[]>(['', '']);
    const [allowMultiple, setAllowMultiple] = useState(false);
    const [pending, setPending] = useState(false);
    const titleRef = useRef<HTMLInputElement>(null);

    const addOption = () => setOptions(prev => [...prev, '']);
    const removeOption = (i: number) => setOptions(prev => prev.filter((_, idx) => idx !== i));
    const updateOption = (i: number, val: string) =>
        setOptions(prev => prev.map((o, idx) => (idx === i ? val : o)));

    const validOptions = options.filter(o => o.trim());
    const canSubmit = type === 'DATE_POLL' || validOptions.length >= 2;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!canSubmit) return;
        setPending(true);

        const fd = new FormData(e.currentTarget);
        fd.set('type', type);
        if (type === 'SIMPLE_POLL') {
            fd.set('pollOptions', JSON.stringify(validOptions));
            fd.set('allowMultipleChoices', allowMultiple ? 'true' : 'false');
        }

        await action(fd);

        // Reset form
        if (titleRef.current) titleRef.current.value = '';
        setOptions(['', '']);
        setAllowMultiple(false);
        setType('DATE_POLL');
        setPending(false);
    };

    return (
        <form onSubmit={handleSubmit} className="mb-6 space-y-3">
            <input
                ref={titleRef}
                name="title"
                placeholder="Titre de l'événement..."
                className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                required
            />

            {/* Sélecteur de type */}
            <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={() => setType('DATE_POLL')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                        type === 'DATE_POLL'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-500'
                    }`}
                >
                    <Calendar size={15} />
                    Disponibilités
                </button>
                <button
                    type="button"
                    onClick={() => setType('SIMPLE_POLL')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                        type === 'SIMPLE_POLL'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-500'
                    }`}
                >
                    <BarChart2 size={15} />
                    Sondage
                </button>
            </div>

            {/* Options du sondage */}
            {type === 'SIMPLE_POLL' && (
                <div className="space-y-2 pt-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                        Choix proposés
                    </div>

                    {options.map((opt, i) => (
                        <div key={i} className="flex gap-1.5 items-center">
                            <input
                                value={opt}
                                onChange={e => updateOption(i, e.target.value)}
                                placeholder={`Option ${i + 1}`}
                                className="flex-1 px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 transition-all min-w-0"
                            />
                            {options.length > 2 && (
                                <button
                                    type="button"
                                    onClick={() => removeOption(i)}
                                    className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={addOption}
                        className="w-full py-1.5 border border-dashed border-slate-300 rounded-lg text-xs text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all flex items-center justify-center gap-1"
                    >
                        <Plus size={12} /> Ajouter un choix
                    </button>

                    {/* Toggle choix multiple */}
                    <button
                        type="button"
                        onClick={() => setAllowMultiple(prev => !prev)}
                        className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all mt-1"
                    >
                        <span className="text-xs font-bold text-slate-600">Choix multiple</span>
                        {allowMultiple ? (
                            <ToggleRight size={22} className="text-indigo-600 flex-shrink-0" />
                        ) : (
                            <ToggleLeft size={22} className="text-slate-300 flex-shrink-0" />
                        )}
                    </button>
                </div>
            )}

            <button
                type="submit"
                disabled={pending || !canSubmit}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Plus size={16} /> {pending ? '...' : 'Créer'}
            </button>

            {type === 'SIMPLE_POLL' && validOptions.length < 2 && (
                <p className="text-[10px] text-amber-500 text-center font-medium">
                    Minimum 2 choix pour créer un sondage
                </p>
            )}
        </form>
    );
}
