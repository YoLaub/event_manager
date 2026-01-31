import { getDashboardData, createEvent, generateTokens } from '@/app/actions/eventActions'; // Utilisation de l'alias @/ standard Next.js
import { LayoutDashboard, Plus } from 'lucide-react';
import { EventClientManager } from '@/app/_components/EventClientManager';

// Ceci est un Server Component
export default async function AdminDashboard() {
  // Dans un environnement réel, ces fonctions appellent la base de données.
  // Si vous testez sans BDD configurée, cela peut échouer au runtime.
  const events = await getDashboardData();

  return (
      <div className="flex h-screen bg-slate-50 text-slate-900">
        {/* SIDEBAR SIMPLE */}
        <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
          <div className="p-6 border-b border-slate-100 font-black text-indigo-600 text-xl flex items-center gap-2">
            <LayoutDashboard size={20} /> EventArchitect
          </div>
          <div className="p-4">
            {/* Formulaire simple via Server Action pour créer un event */}
            <form action={createEvent} className="mb-6">
              <input
                  name="title"
                  placeholder="Nouvel événement..."
                  className="w-full px-3 py-2 border rounded-lg text-sm mb-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
              />
              <button className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors">
                <Plus size={14} className="inline mr-1" /> Créer
              </button>
            </form>

            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Historique</div>
            <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
              {events && events.length > 0 ? events.map(e => (
                  <div key={e.id} className="px-3 py-2 text-sm text-slate-600 truncate hover:bg-slate-50 rounded cursor-default">
                    {e.title}
                  </div>
              )) : (
                  <div className="px-3 py-2 text-xs text-slate-400 italic">Aucun événement</div>
              )}
            </div>
          </div>
        </aside>

        {/* ZONE PRINCIPALE - Gérée par un Client Component pour l'interactivité (Tabs, Graphs) */}
        <main className="flex-1 overflow-y-auto p-8">
          <EventClientManager initialEvents={events} generateAction={generateTokens} />
        </main>
      </div>
  );
}