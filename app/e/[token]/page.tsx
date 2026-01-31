// 📂 EMPLACEMENT DU FICHIER : app/e/[token]/page.tsx

import { verifyToken, submitResponse } from '@/app/actions/eventActions'; // Utilisation de l'alias @/ plus robuste
import { GuestCalendarForm } from '@/app/_components/GuestCalendarForm';

export default async function GuestPage({ params }: { params: Promise<{ token: string }> }) {

    // Utilisation de "await" pour déballer les paramètres (Requis pour Next.js 15+)
    const { token } = await params;

    if (!token) {
        return <div className="p-10 text-red-500">Erreur : Aucun jeton fourni.</div>;
    }

    const result = await verifyToken(token);

    if (result.error) {
        return (
            <div className="h-screen flex items-center justify-center font-bold text-red-500">
                {result.error}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
                <div className="bg-indigo-600 p-8 text-white">
                    <h1 className="text-3xl font-black">{result.event.title}</h1>
                    <p className="opacity-80 text-sm">Répondez à l'invitation</p>
                </div>
                <div className="p-8">
                    <GuestCalendarForm
                        eventId={result.event.id}
                        tokenId={token}
                        submitAction={submitResponse}
                    />
                </div>
            </div>
        </div>
    );
}