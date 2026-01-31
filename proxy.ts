import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
    // 1. Définir les chemins PUBLICS (accessibles sans mot de passe)
    // On laisse passer :
    // - /e/... (les liens invités)
    // - /_next/... (les fichiers internes de Next.js, CSS, JS)
    // - /favicon.ico, etc. (fichiers statiques)
    if (
        req.nextUrl.pathname.startsWith('/e/') ||
        req.nextUrl.pathname.startsWith('/_next') ||
        req.nextUrl.pathname.startsWith('/api') || // Si vous avez des routes API publiques
        req.nextUrl.pathname.includes('.') // Fichiers avec extension (images, fonts...)
    ) {
        return NextResponse.next();
    }

    // 2. Vérification de l'authentification (Basic Auth)
    const basicAuth = req.headers.get('authorization');

    if (basicAuth) {
        const authValue = basicAuth.split(' ')[1];
        // Décodage de "user:pass" en base64
        const [user, pwd] = atob(authValue).split(':');

        // --- CONFIGURATION DES IDENTIFIANTS ---
        // Pour plus de sécurité, utilisez des variables d'environnement : process.env.ADMIN_USER
        const validUser = process.env.ADMIN_USER || 'admin';
        const validPass = process.env.ADMIN_PASSWORD || 'monSuperMotDePasse';

        if (user === validUser && pwd === validPass) {
            return NextResponse.next();
        }
    }

    // 3. Si pas connecté ou mauvais mot de passe -> On renvoie une 401 qui déclenche la popup du navigateur
    return new NextResponse('Authentification requise pour accéder au Dashboard.', {
        status: 401,
        headers: {
            'WWW-Authenticate': 'Basic realm="Espace Admin"',
        },
    });
}

// Configuration : Le middleware s'exécute sur toutes les routes par défaut
// (Le filtrage se fait via le `if` au début de la fonction)
export const config = {
    matcher: '/:path*',
};