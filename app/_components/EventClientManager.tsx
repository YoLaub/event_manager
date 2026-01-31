'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Link as LinkIcon, Check, ExternalLink } from 'lucide-react';

export function EventClientManager({ initialEvents, generateAction }) {
    const [selectedId, setSelectedId] = useState(initialEvents[0]?.id);
    const activeEvent = initialEvents.find(e => e.id === selectedId) || initialEvents[0];

    if (!activeEvent) return <div className="p-10 text-slate-400">Aucun événement sélectionné.</div>;

    const stats = activeEvent.responses ? activeEvent.responses.reduce((acc, curr) => {
        curr.dates.forEach(date => { acc[date] = (acc[date] || 0) + 1; });
        return acc;
    }, {}) : {};

    const chartData = Object.entries(stats).map(([date, count]) => ({ date, count: Number(count) }));

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h1 className="text-3xl font-black">{activeEvent.title}</h1>
                {initialEvents.length > 1 && (
                    <select className="p-2 border rounded-lg" onChange={(e) => setSelectedId(e.target.value)} value={activeEvent.id}>
                        {initialEvents.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                    </select>
                )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold mb-6 text-slate-800">Tendances</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <XAxis dataKey="date" fontSize={10} tickFormatter={(val) => new Date(val).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'})} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#4f46e5" radius={[4,4,0,0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[400px]">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><LinkIcon size={16}/> Générer des liens</h3>
                    <button onClick={() => generateAction(activeEvent.id, 5)} className="w-full py-2 bg-indigo-50 text-indigo-700 font-bold rounded-lg mb-4 text-sm">+ 5 Liens</button>
                    <div className="flex-1 overflow-y-auto space-y-2">
                        {activeEvent.tokens?.map(token => (
                            <div key={token.id} className={`p-2 rounded border text-xs flex justify-between items-center ${token.isUsed ? 'bg-slate-50 opacity-50' : ''}`}>
                                <span className="font-mono text-slate-400">...{token.id.slice(-6)}</span>
                                {token.isUsed ? <span className="text-green-600 font-bold">{token.usedBy}</span> :
                                    <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/e/${token.id}`); alert('Copié !'); }} className="text-indigo-600 font-bold">Copier</button>
                                }
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* TABLEAU RÉPONSES - RESTAURÉ */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 font-bold text-slate-800">Détails des participants</div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Nom</th>
                            <th className="px-6 py-4">Disponibilités</th>
                            <th className="px-6 py-4">Commentaire</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                        {activeEvent.responses && activeEvent.responses.length > 0 ? activeEvent.responses.map(resp => (
                            <tr key={resp.id} className="hover:bg-slate-50/50">
                                <td className="px-6 py-4 font-bold text-slate-700">{resp.guestName}</td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {resp.dates.map(d => (
                                            <span key={d} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-bold">
                          {new Date(d).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'})}
                        </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-500 italic">{resp.comment || '-'}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-slate-400">Aucune réponse pour le moment.</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}