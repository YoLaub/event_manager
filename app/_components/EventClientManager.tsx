'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
    Link as LinkIcon, Check, ExternalLink, Copy, Send, Mail, Plus,
    BarChart3, Globe, Calendar, BarChart2
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

interface EventClientManagerProps {
    initialEvents: any[];
    generateAction: (eventId: string, count: number) => Promise<void>;
}

export function EventClientManager({ initialEvents, generateAction }: EventClientManagerProps) {
    const [selectedId, setSelectedId] = useState(initialEvents[0]?.id);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        if (!initialEvents.find(e => e.id === selectedId) && initialEvents.length > 0) {
            setSelectedId(initialEvents[0].id);
        }
    }, [initialEvents, selectedId]);

    const activeEvent = initialEvents.find(e => e.id === selectedId) || initialEvents[0];

    if (!activeEvent) return (
        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-10">
            <BarChart3 size={48} className="mb-4 opacity-20" />
            <p>Aucun événement sélectionné.</p>
        </div>
    );

    const isSimplePoll = activeEvent.type === 'SIMPLE_POLL';

    const publicLink = activeEvent.tokens?.find((t: any) => t.type === 'PUBLIC');
    const privateLinks = activeEvent.tokens?.filter((t: any) => t.type !== 'PUBLIC') || [];

    const handleShare = (type: 'copy' | 'whatsapp' | 'email', token: string) => {
        const url = `${window.location.origin}/e/${token}`;
        const text = `Salut ! Voici le lien pour "${activeEvent?.title}" : ${url}`;

        if (type === 'copy') {
            navigator.clipboard.writeText(url);
            setCopiedToken(token);
            setTimeout(() => setCopiedToken(null), 2000);
        } else if (type === 'whatsapp') {
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        } else if (type === 'email') {
            window.open(`mailto:?subject=${encodeURIComponent("Invitation : " + activeEvent?.title)}&body=${encodeURIComponent(text)}`, '_blank');
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        await generateAction(activeEvent.id, 5);
        setGenerating(false);
    };

    // --- DONNÉES GRAPHIQUE ---
    const chartData = isSimplePoll
        ? (activeEvent.pollOptions as string[]).map((option: string) => {
            const count = activeEvent.responses.filter((r: any) =>
                Array.isArray(r.choices) && r.choices.includes(option)
            ).length;
            return { label: option, count };
        })
        : Object.entries(
            activeEvent.responses.reduce((acc: any, curr: any) => {
                const dates: string[] = Array.isArray(curr.dates) ? curr.dates : [];
                dates.forEach(date => { acc[date] = (acc[date] || 0) + 1; });
                return acc;
            }, {})
        ).map(([date, count]) => ({ label: date, count: Number(count) }))
            .sort((a, b) => new Date(a.label).getTime() - new Date(b.label).getTime());

    const accentColor = isSimplePoll ? '#7c3aed' : '#4f46e5';

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            {/* HEADER */}
            <header className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-100 gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        {isSimplePoll ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-violet-600 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                <BarChart2 size={10} /> Sondage
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                <Calendar size={10} /> Disponibilités
                            </span>
                        )}
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">{activeEvent.title}</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase mt-1 flex items-center gap-1">
                        <ExternalLink size={12} /> ID: {activeEvent.id}
                    </p>
                </div>
                {initialEvents.length > 1 && (
                    <select
                        aria-label="Sélectionner un événement"
                        className="p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                        onChange={e => setSelectedId(e.target.value)}
                        value={activeEvent.id}
                    >
                        {initialEvents.map((e: any) => (
                            <option key={e.id} value={e.id}>
                                {e.type === 'SIMPLE_POLL' ? '📊 ' : '📅 '}{e.title}
                            </option>
                        ))}
                    </select>
                )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* GRAPHIQUE */}
                <div className="lg:col-span-2 bg-white p-8 rounded-4xl shadow-sm border border-slate-100 h-96 flex flex-col">
                    <h3 className="font-bold mb-6 text-slate-800 flex items-center gap-2">
                        <BarChart3 className={isSimplePoll ? 'text-violet-600' : 'text-indigo-600'} size={20} />
                        {isSimplePoll ? 'Résultats du sondage' : 'Tendances'}
                    </h3>
                    <div className="flex-1 min-h-0">
                        {chartData.length > 0 && activeEvent.responses.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} layout={isSimplePoll ? 'vertical' : 'horizontal'}>
                                    {isSimplePoll ? (
                                        <>
                                            <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} fontSize={12} />
                                            <Tooltip
                                                cursor={{ fill: '#f1f5f9' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                formatter={(value: number | undefined) => [`${value ?? 0} vote${(value ?? 0) > 1 ? 's' : ''}`, '']}
                                                labelFormatter={label => label}
                                            />
                                            <Bar dataKey="count" fill={accentColor} radius={[0, 6, 6, 0]} barSize={32} name="Votes" />
                                        </>
                                    ) : (
                                        <>
                                            <XAxis
                                                dataKey="label"
                                                fontSize={12}
                                                tickFormatter={val => new Date(val).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#f1f5f9' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar dataKey="count" fill={accentColor} radius={[6, 6, 0, 0]} barSize={40} />
                                        </>
                                    )}
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 italic">
                                En attente de réponses...
                            </div>
                        )}
                    </div>
                </div>

                {/* GESTION DES LIENS */}
                <div className="space-y-6">
                    {/* Lien PUBLIC */}
                    {publicLink ? (
                        <div className={`p-6 rounded-4xl shadow-lg text-white relative overflow-hidden ${isSimplePoll ? 'bg-violet-600 shadow-violet-200' : 'bg-indigo-600 shadow-indigo-200'}`}>
                            <div className="relative z-10">
                                <h3 className="font-bold flex items-center gap-2 mb-2 text-lg">
                                    <Globe size={20} /> Lien de Groupe
                                </h3>
                                <p className="text-white/80 text-xs mb-4 leading-relaxed">
                                    Partage ce lien à tout le monde. Il reste toujours actif.
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleShare('copy', publicLink.id)}
                                        className={cn(
                                            'flex-1 py-3 bg-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors',
                                            isSimplePoll ? 'text-violet-700' : 'text-indigo-700'
                                        )}
                                    >
                                        {copiedToken === publicLink.id ? <Check size={14} /> : <Copy size={14} />}
                                        {copiedToken === publicLink.id ? "Copié !" : "Copier"}
                                    </button>
                                    <button type="button" title="Partager sur WhatsApp" onClick={() => handleShare('whatsapp', publicLink.id)} className="p-3 rounded-xl bg-green-500 text-white hover:bg-green-400 transition-colors"><Send size={16} /></button>
                                    <button type="button" title="Partager par email" onClick={() => handleShare('email', publicLink.id)} className={`p-3 rounded-xl text-white transition-colors ${isSimplePoll ? 'bg-violet-500 hover:bg-violet-400' : 'bg-indigo-500 hover:bg-indigo-400'}`}><Mail size={16} /></button>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl pointer-events-none" />
                        </div>
                    ) : (
                        <div className="p-4 bg-amber-50 text-amber-600 text-xs rounded-xl border border-amber-100 text-center">
                            Lien public manquant.
                        </div>
                    )}

                    {/* Liens PRIVÉS */}
                    <div className="bg-white p-6 rounded-4xl shadow-sm border border-slate-100 flex flex-col max-h-75">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <LinkIcon size={18} className="text-slate-400" /> Liens Privés
                            </h3>
                            <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded text-slate-500">Optionnel</span>
                        </div>

                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={generating}
                            className="w-full py-2 bg-slate-50 text-slate-600 font-bold rounded-xl mb-4 text-xs hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Plus size={14} /> {generating ? "..." : "+ 5 liens uniques"}
                        </button>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {privateLinks.length > 0 ? privateLinks.map((token: any) => {
                                const isUsed = !!token.isUsed;
                                return (
                                    <div key={token.id} className={cn("p-3 rounded-xl border transition-all text-xs", isUsed ? "bg-slate-50 border-slate-100 opacity-60" : "bg-white border-slate-200")}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-mono text-slate-400 font-bold">...{token.id.slice(-6)}</span>
                                            {isUsed ? (
                                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                    <Check size={10} /> {token.usedBy}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-bold">Unique</span>
                                            )}
                                        </div>
                                        {!isUsed && (
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleShare('copy', token.id)}
                                                    className={cn(
                                                        "flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 transition-all",
                                                        copiedToken === token.id ? "bg-green-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                                    )}
                                                >
                                                    {copiedToken === token.id ? <Check size={12} /> : <Copy size={12} />} Copier
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            }) : (
                                <p className="text-center text-xs text-slate-400 italic py-4">Aucun lien privé.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* TABLEAU DES RÉPONSES */}
            <div className="bg-white rounded-4xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-50 font-bold text-slate-800">
                    Détails des participants
                    {activeEvent.responses.length > 0 && (
                        <span className="ml-2 text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            {activeEvent.responses.length}
                        </span>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                            <tr>
                                <th className="px-8 py-4">Nom</th>
                                <th className="px-8 py-4">{isSimplePoll ? 'Réponse(s)' : 'Disponibilités'}</th>
                                <th className="px-8 py-4">Commentaire</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {activeEvent.responses && activeEvent.responses.length > 0 ? activeEvent.responses.map((resp: any) => {
                                const items: string[] = isSimplePoll
                                    ? (Array.isArray(resp.choices) ? resp.choices : [])
                                    : (Array.isArray(resp.dates) ? resp.dates : []);

                                return (
                                    <tr key={resp.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5 font-bold text-slate-700">{resp.guestName}</td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-wrap gap-1.5">
                                                {items.map(item => (
                                                    <span
                                                        key={item}
                                                        className={cn(
                                                            "px-2 py-0.5 rounded-md text-[10px] font-bold border",
                                                            isSimplePoll
                                                                ? "bg-violet-50 text-violet-700 border-violet-100"
                                                                : "bg-indigo-50 text-indigo-700 border-indigo-100"
                                                        )}
                                                    >
                                                        {isSimplePoll
                                                            ? item
                                                            : new Date(item).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-slate-500 italic max-w-xs truncate">{resp.comment || '-'}</td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={3} className="px-8 py-10 text-center text-slate-400 italic">Aucune réponse pour le moment.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
