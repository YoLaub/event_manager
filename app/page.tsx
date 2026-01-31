export const dynamic = 'force-dynamic';

import { getDashboardData, createEvent, generateTokens } from '@/app/actions/eventActions';
import { LayoutDashboard, Plus } from 'lucide-react';
import { EventClientManager } from '@/app/_components/EventClientManager';

// Ceci est un Server Component
export default async function AdminDashboard() {
    // Récupération des données via Server Action ou Prisma direct
    const events = await getDashboardData();

    return (
        <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
            {/* SIDEBAR SIMPLE (Côté Serveur) */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col z-10 shadow-sm">
                <div className="p-6 border-b border-slate-100 font-black text-indigo-600 text-xl flex items-center gap-2 tracking-tight">
                    <LayoutDashboard size={20} /> EventArchitect
                </div>
                <div className="p-4 flex flex-col h-full">
                    {/* Formulaire simple via Server Action pour créer un event */}
                    <form action={createEvent} className="mb-6">
                        <input
                            name="title"
                            placeholder="Nouvel événement..."
                            className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl text-sm mb-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            required
                        />
                        <button className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
                            <Plus size={16} /> Créer
                        </button>
                    </form>

                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Historique</div>
                    <div className="flex-1 overflow-y-auto space-y-1">
                        {events && events.length > 0 ? events.map((e: any) => (
                            <div key={e.id} className="px-3 py-2 text-sm text-slate-600 truncate bg-white border border-transparent hover:border-slate-200 hover:bg-slate-50 rounded-lg cursor-default transition-all">
                                {e.title}
                            </div>
                        )) : (
                            <div className="px-3 py-2 text-xs text-slate-400 italic">Aucun événement</div>
                        )}
                    </div>
                </div>
            </aside>

            {/* ZONE PRINCIPALE - Gérée par le Client Component avec le système de partage */}
            <main className="flex-1 overflow-y-auto bg-slate-50">
                <EventClientManager initialEvents={events} generateAction={generateTokens} />
            </main>
        </div>
    );
}