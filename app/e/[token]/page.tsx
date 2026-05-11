import { verifyToken, submitResponse } from '@/app/actions/eventActions';
import { GuestCalendarForm } from '@/app/_components/GuestCalendarForm';
import { GuestPollForm } from '@/app/_components/GuestPollForm';
import { Calendar, BarChart2 } from 'lucide-react';

export default async function GuestPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;

    if (!token) {
        return <div className="p-10 text-red-500">Erreur : Aucun jeton fourni.</div>;
    }

    const result = await verifyToken(token);

    if (result.error || !result.event) {
        return (
            <div className="h-screen flex items-center justify-center font-bold text-red-500">
                {result.error || "Événement introuvable"}
            </div>
        );
    }

    const { event } = result;
    const isSimplePoll = event.type === 'SIMPLE_POLL';

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
                {/* Header */}
                <div className={`p-8 text-white ${isSimplePoll ? 'bg-violet-600' : 'bg-indigo-600'}`}>
                    <div className="flex items-center gap-2 mb-1">
                        {isSimplePoll ? (
                            <BarChart2 size={16} className="opacity-70" />
                        ) : (
                            <Calendar size={16} className="opacity-70" />
                        )}
                        <span className="text-xs font-bold opacity-70 uppercase tracking-wider">
                            {isSimplePoll ? 'Sondage' : 'Disponibilités'}
                        </span>
                    </div>
                    <h1 className="text-3xl font-black">{event.title}</h1>
                    <p className="opacity-80 text-sm mt-1">Répondez à l'invitation</p>
                </div>

                {/* Formulaire conditionnel */}
                <div className="p-8">
                    {isSimplePoll ? (
                        <GuestPollForm
                            eventId={event.id}
                            tokenId={token}
                            pollOptions={event.pollOptions as string[]}
                            allowMultipleChoices={event.allowMultipleChoices}
                            submitAction={submitResponse}
                            existingResponses={event.responses}
                        />
                    ) : (
                        <GuestCalendarForm
                            eventId={event.id}
                            tokenId={token}
                            submitAction={submitResponse}
                            existingResponses={event.responses}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
