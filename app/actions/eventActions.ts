'use server'

import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';

// --- ACTIONS ADMIN ---

export async function createEvent(formData: FormData) {
    const title = formData.get('title') as string;
    const type = (formData.get('type') as string) || 'DATE_POLL';
    const allowMultipleChoices = formData.get('allowMultipleChoices') === 'true';
    const pollOptionsRaw = formData.get('pollOptions') as string | null;
    const pollOptions = pollOptionsRaw ?? null;

    const event = await prisma.event.create({
        data: {
            title,
            type,
            pollOptions,
            allowMultipleChoices,
        }
    });

    await prisma.token.create({
        data: {
            eventId: event.id,
            type: 'PUBLIC'
        }
    });

    revalidatePath('/');
}

export async function generateTokens(eventId: string, count: number) {
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

    return events.map(event => ({
        ...event,
        pollOptions: event.pollOptions ? JSON.parse(event.pollOptions) : [],
        responses: event.responses.map(response => ({
            ...response,
            dates: response.dates ? JSON.parse(response.dates) : [],
            choices: response.choices ? JSON.parse(response.choices) : [],
        }))
    }));
}

// --- ACTIONS INVITÉ ---

export async function verifyToken(tokenId: string) {
    const token = await prisma.token.findUnique({
        where: { id: tokenId },
        include: {
            event: {
                include: { responses: true }
            }
        }
    });

    if (!token) return { error: "Lien invalide" };
    if (token.type === 'PRIVATE' && token.isUsed) return { error: "Ce lien a déjà été utilisé" };

    const event = {
        ...token.event,
        pollOptions: token.event.pollOptions ? JSON.parse(token.event.pollOptions) : [],
        responses: token.event.responses.map(r => ({
            ...r,
            dates: r.dates ? JSON.parse(r.dates) : [],
            choices: r.choices ? JSON.parse(r.choices) : [],
        }))
    };

    return { success: true, event };
}

export async function submitResponse(
    tokenId: string,
    name: string,
    dates: string[],
    comment: string,
    choices: string[] = []
) {
    const tokenDoc = await prisma.token.findUnique({ where: { id: tokenId } });
    if (!tokenDoc) throw new Error("Token introuvable");

    await prisma.$transaction(async (tx) => {
        await tx.response.create({
            data: {
                guestName: name,
                dates: dates.length > 0 ? JSON.stringify(dates) : null,
                choices: choices.length > 0 ? JSON.stringify(choices) : null,
                comment: comment || null,
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
