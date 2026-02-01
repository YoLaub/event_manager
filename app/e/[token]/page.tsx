// 📂 EMPLACEMENT DU FICHIER : app/e/[token]/page.tsx

import { verifyToken, submitResponse } from '@/app/actions/eventActions';
import { GuestCalendarForm } from '@/app/_components/GuestCalendarForm';

export default async function GuestPage({ params }: { params: Promise<{ token: string }> }) {

    const { token } = await params;

    if (!token) {
        return <div className="p-10 text-red-500">Erreur : Aucun jeton fourni.</div>;
    }

    const result = await verifyToken(token);

    // 🛠️ CORRECTIF TYPESCRIPT :
    // On ajoute "|| !result.event" pour garantir au compilateur que l'event existe.
    // Si on passe cette condition, TypeScript sait que result.event est défini à 100%.
    if (result.error || !result.event) {
        return (
            <div className="h-screen flex items-center justify-center font-bold text-red-500">
                {result.error || "Événement introuvable"}
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
                        // NOUVEAU : On passe les réponses existantes
                        existingResponses={result.event.responses}
                    />
                </div>
            </div>
        </div>
    );
}