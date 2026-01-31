'use server'

import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';

// --- ACTIONS ADMIN (On ne touche pas, ça marche avec les <form>) ---

export async function createEvent(formData: FormData) {
    const title = formData.get('title') as string;

    await prisma.event.create({
        data: { title }
    });

    revalidatePath('/');
}

export async function generateTokens(eventId: string, count: number) {
    const tokensData = Array.from({ length: count }).map(() => ({
        eventId,
    }));

    await prisma.token.createMany({
        data: tokensData,
    });

    revalidatePath('/');
}

export async function getDashboardData() {
    const events = await prisma.event.findMany({
        include: {
            tokens: true,
            responses: true
        },
        orderBy: { createdAt: 'desc' }
    });

    // Adaptation MySQL (JSON string -> Array)
    const eventsWithParsedDates = events.map(event => ({
        ...event,
        responses: event.responses.map(response => ({
            ...response,
            dates: response.dates ? JSON.parse(response.dates as string) : []
        }))
    }));

    return eventsWithParsedDates;
}

// --- ACTIONS INVITÉ ---

export async function verifyToken(tokenId: string) {
    const token = await prisma.token.findUnique({
        where: { id: tokenId },
        include: { event: true }
    });

    if (!token) return { error: "Lien invalide" };
    if (token.isUsed) return { error: "Ce lien a déjà été utilisé" };

    return { success: true, event: token.event };
}

/**
 * CORRECTION ICI :
 * On change la signature pour accepter les types bruts envoyés par le composant React.
 * On ne passe plus 'formData' mais 'name', 'dates' (array), 'comment'.
 */
export async function submitResponse(tokenId: string, name: string, dates: string[], comment: string) {

    // 1. On récupère l'info du token pour être sûr de l'eventId (Sécurité)
    const tokenDoc = await prisma.token.findUnique({
        where: { id: tokenId }
    });

    if (!tokenDoc) throw new Error("Token introuvable");

    // 2. On transforme le tableau JS ["2024-01-01"] en String pour MySQL
    const datesJSON = JSON.stringify(dates);

    await prisma.$transaction([
        prisma.response.create({
            data: {
                guestName: name,
                dates: datesJSON, // On stocke la string
                comment: comment,
                eventId: tokenDoc.eventId, // On utilise l'ID de l'event lié au token
                tokenId: tokenId
            }
        }),
        prisma.token.update({
            where: { id: tokenId },
            data: {
                isUsed: true,
                usedBy: name
            }
        })
    ]);

    return { success: true };
}