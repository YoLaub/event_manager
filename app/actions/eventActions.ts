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

export async function verifyToken(tokenId: string) {
    const token = await prisma.token.findUnique({
        where: { id: tokenId },
        include: { event: true }
    });

    if (!token) return { error: "Lien invalide" };

    // LOGIQUE HYBRIDE :
    // Si c'est un lien PRIVÉ et qu'il est déjà utilisé -> Erreur
    // Si c'est un lien PUBLIC -> On laisse passer (c'est un lien de groupe)
    if (token.type === 'PRIVATE' && token.isUsed) {
        return { error: "Ce lien a déjà été utilisé" };
    }

    return { success: true, event: token.event };
}

export async function submitResponse(tokenId: string, name: string, dates: string[], comment: string) {
    const tokenDoc = await prisma.token.findUnique({
        where: { id: tokenId }
    });

    if (!tokenDoc) throw new Error("Token introuvable");

    // Conversion pour MySQL
    const datesJSON = JSON.stringify(dates);

    // Préparation des opérations pour la transaction
    // 1. On crée la réponse dans tous les cas
    const operations: any[] = [
        prisma.response.create({
            data: {
                guestName: name,
                dates: datesJSON,
                comment: comment,
                eventId: tokenDoc.eventId,
                tokenId: tokenId
            }
        })
    ];

    // 2. On ne ferme le token (isUsed=true) QUE s'il est PRIVÉ
    if (tokenDoc.type === 'PRIVATE') {
        operations.push(
            prisma.token.update({
                where: { id: tokenId },
                data: {
                    isUsed: true,
                    usedBy: name
                }
            })
        );
    }

    await prisma.$transaction(operations);

    return { success: true };
}