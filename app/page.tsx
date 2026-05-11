export const dynamic = 'force-dynamic';

import { getDashboardData, createEvent, generateTokens } from '@/app/actions/eventActions';
import { LayoutDashboard, Calendar, BarChart2 } from 'lucide-react';
import { EventClientManager } from '@/app/_components/EventClientManager';
import { CreateEventForm } from '@/app/_components/CreateEventForm';

export default async function AdminDashboard() {
    const events = await getDashboardData();

    return (
        <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
            <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col z-10 shadow-sm">
                <div className="p-6 border-b border-slate-100 font-black text-indigo-600 text-xl flex items-center gap-2 tracking-tight">
                    <LayoutDashboard size={20} /> Les Gants Méléciens
                </div>
                <div className="p-4 flex flex-col h-full overflow-hidden">
                    <CreateEventForm action={createEvent} />

                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Historique</div>
                    <div className="flex-1 overflow-y-auto space-y-1">
                        {events && events.length > 0 ? events.map((e: any) => (
                            <div key={e.id} className="px-3 py-2.5 text-sm text-slate-600 bg-white border border-transparent hover:border-slate-200 hover:bg-slate-50 rounded-lg cursor-default transition-all">
                                <div className="truncate font-medium">{e.title}</div>
                                <div className="flex items-center gap-1 mt-0.5">
                                    {e.type === 'SIMPLE_POLL' ? (
                                        <>
                                            <BarChart2 size={10} className="text-violet-500 shrink-0" />
                                            <span className="text-[10px] text-violet-500 font-bold">Sondage</span>
                                        </>
                                    ) : (
                                        <>
                                            <Calendar size={10} className="text-indigo-400 shrink-0" />
                                            <span className="text-[10px] text-indigo-400 font-bold">Disponibilités</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <div className="px-3 py-2 text-xs text-slate-400 italic">Aucun événement</div>
                        )}
                    </div>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto bg-slate-50">
                <EventClientManager initialEvents={events} generateAction={generateTokens} />
            </main>
        </div>
    );
}
