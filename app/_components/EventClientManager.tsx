'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
    Link as LinkIcon, Check, ExternalLink, Copy, Send, Mail, Plus, BarChart3, Globe
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

interface EventClientManagerProps {
    initialEvents: any[];
    generateAction: (eventId: string, count: number) => Promise<void>;
}

export function EventClientManager({ initialEvents, generateAction }: EventClientManagerProps) {
    // Gestion de la sélection (par défaut le premier)
    const [selectedId, setSelectedId] = useState(initialEvents[0]?.id);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);

    // Synchronisation si la liste change (création d'un event)
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

    // --- SÉPARATION DES LIENS ---
    // On cherche le lien PUBLIC (créé automatiquement)
    const publicLink = activeEvent.tokens?.find((t: any) => t.type === 'PUBLIC');
    // On filtre les liens PRIVÉS (générés manuellement)
    const privateLinks = activeEvent.tokens?.filter((t: any) => t.type !== 'PUBLIC') || [];

    // --- LOGIQUE DE PARTAGE ---
    const handleShare = (type: 'copy' | 'whatsapp' | 'email', token: string) => {
        const url = `${window.location.origin}/e/${token}`;
        const text = `Salut ! Voici le lien pour donner tes dispos pour "${activeEvent?.title}" : ${url}`;

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

    // --- LOGIQUE STATS ---
    const chartData = activeEvent.responses ? Object.entries(
        activeEvent.responses.reduce((acc: any, curr: any) => {
            let dates = [];
            try {
                dates = Array.isArray(curr.dates) ? curr.dates : JSON.parse(curr.dates || '[]');
            } catch (e) { dates = []; }

            dates.forEach((date: string) => { acc[date] = (acc[date] || 0) + 1; });
            return acc;
        }, {})
    ).map(([date, count]) => ({ date, count: Number(count) }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) : [];

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            {/* HEADER */}
            <header className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-100 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">{activeEvent.title}</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase mt-1 flex items-center gap-1">
                        <ExternalLink size={12}/> ID: {activeEvent.id}
                    </p>
                </div>
                {initialEvents.length > 1 && (
                    <select
                        className="p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                        onChange={(e) => setSelectedId(e.target.value)}
                        value={activeEvent.id}
                    >
                        {initialEvents.map((e: any) => <option key={e.id} value={e.id}>{e.title}</option>)}
                    </select>
                )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* COLONNE GAUCHE : GRAPHIQUE */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 h-96 flex flex-col">
                    <h3 className="font-bold mb-6 text-slate-800 flex items-center gap-2">
                        <BarChart3 className="text-indigo-600" size={20}/> Tendances
                    </h3>
                    <div className="flex-1 min-h-0">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <XAxis
                                        dataKey="date"
                                        fontSize={12}
                                        tickFormatter={(val) => new Date(val).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'})}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                                    <Bar dataKey="count" fill="#4f46e5" radius={[6,6,0,0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 italic">En attente de réponses...</div>
                        )}
                    </div>
                </div>

                {/* COLONNE DROITE : GESTION DES LIENS */}
                <div className="space-y-6">

                    {/* 1. LIEN GROUPE (Carte Bleue) */}
                    {publicLink ? (
                        <div className="bg-indigo-600 p-6 rounded-[2rem] shadow-lg shadow-indigo-200 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="font-bold flex items-center gap-2 mb-2 text-lg">
                                    <Globe size={20}/> Lien de Groupe
                                </h3>
                                <p className="text-indigo-100 text-xs mb-4 opacity-90 leading-relaxed">
                                    Partage ce lien à tout le monde. Il reste toujours actif.
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleShare('copy', publicLink.id)} // id utilisé comme token
                                        className="flex-1 py-3 bg-white text-indigo-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors"
                                    >
                                        {copiedToken === publicLink.id ? <Check size={14}/> : <Copy size={14}/>}
                                        {copiedToken === publicLink.id ? "Copié !" : "Copier"}
                                    </button>
                                    <button onClick={() => handleShare('whatsapp', publicLink.id)} className="p-3 rounded-xl bg-green-500 text-white hover:bg-green-400 transition-colors"><Send size={16}/></button>
                                    <button onClick={() => handleShare('email', publicLink.id)} className="p-3 rounded-xl bg-indigo-500 text-white hover:bg-indigo-400 transition-colors"><Mail size={16}/></button>
                                </div>
                            </div>
                            {/* Cercle déco */}
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
                        </div>
                    ) : (
                        <div className="p-4 bg-amber-50 text-amber-600 text-xs rounded-xl border border-amber-100 text-center">
                            Lien public manquant.
                        </div>
                    )}

                    {/* 2. LIENS PRIVÉS (Liste) */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col max-h-[300px]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <LinkIcon size={18} className="text-slate-400"/> Liens Privés
                            </h3>
                            <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded text-slate-500">Optionnel</span>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="w-full py-2 bg-slate-50 text-slate-600 font-bold rounded-xl mb-4 text-xs hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Plus size={14} /> {generating ? "..." : "+ 5 liens uniques"}
                        </button>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {privateLinks.length > 0 ? privateLinks.map((token: any, i: number) => {
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
                                                    onClick={() => handleShare('copy', token.id)}
                                                    className={cn(
                                                        "flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 transition-all",
                                                        copiedToken === token.id ? "bg-green-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                                    )}
                                                    title="Copier"
                                                >
                                                    {copiedToken === token.id ? <Check size={12}/> : <Copy size={12}/>} Copier
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

            {/* TABLEAU RÉPONSES */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-50 font-bold text-slate-800">Détails des participants</div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                        <tr>
                            <th className="px-8 py-4">Nom</th>
                            <th className="px-8 py-4">Disponibilités</th>
                            <th className="px-8 py-4">Commentaire</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                        {activeEvent.responses && activeEvent.responses.length > 0 ? activeEvent.responses.map((resp: any) => {
                            let dates = [];
                            try { dates = Array.isArray(resp.dates) ? resp.dates : JSON.parse(resp.dates || '[]'); } catch (e) { dates = []; }

                            return (
                                <tr key={resp.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-5 font-bold text-slate-700">{resp.guestName}</td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-wrap gap-1.5">
                                            {dates.map((d: string) => (
                                                <span key={d} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-bold border border-indigo-100">
                                                        {new Date(d).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'})}
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