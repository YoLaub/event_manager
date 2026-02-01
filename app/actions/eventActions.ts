'use server'

import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';

// --- ACTIONS ADMIN ---

export async function createEvent(formData: FormData) {
    const title = formData.get('title') as string;

    const event = await prisma.event.create({
        data: { title }
    });

    // ARCHITECTURE HYBRIDE : On crée automatiquement un lien PUBLIC (Groupe)
    await prisma.token.create({
        data: {
            eventId: event.id,
            type: 'PUBLIC' // Assure-toi d'avoir ajouté ce champ dans ton schema.prisma
        }
    });

    revalidatePath('/');
}

export async function generateTokens(eventId: string, count: number) {
    // Les liens générés manuellement sont des liens PRIVÉS
    const tokensData = Array.from({ length: count }).map(() => ({
        eventId,
        type: 'PRIVATE'
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

// --- ACTIONS INVITÉ ---

export async function verifyToken(tokenId: string) {
    const token = await prisma.token.findUnique({
        where: { id: tokenId },
        include: {
            event: {
                // UPDATE ICI : On inclut les réponses pour les afficher à l'invité
                include: { responses: true }
            }
        }
    });

    if (!token) return { error: "Lien invalide" };
    if (token.type === 'PRIVATE' && token.isUsed) return { error: "Ce lien a déjà été utilisé" };

    return { success: true, event: token.event };
}

export async function submitResponse(tokenId: string, name: string, dates: string[], comment: string) {
    const tokenDoc = await prisma.token.findUnique({ where: { id: tokenId } });
    if (!tokenDoc) throw new Error("Token introuvable");

    const datesJSON = JSON.stringify(dates);

    await prisma.$transaction(async (tx) => {
        await tx.response.create({
            data: {
                guestName: name,
                dates: datesJSON, // Note: Assure-toi que ton schema a bien 'selectedDates' ou 'dates' (on a utilisé 'dates' String @db.Text dans le dernier schema valide)
                comment: comment,
                eventId: tokenDoc.eventId,
                tokenId: tokenId
            }
        });

        if (tokenDoc.type === 'PRIVATE') {
            await tx.token.update({
                where: { id: tokenId },
                data: { isUsed: true, usedBy: name }
            });
        }
    });

    return { success: true };
}