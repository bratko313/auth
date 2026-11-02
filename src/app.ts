import 'dotenv/config';

import express from 'express';
import path from 'node:path';
import oidc from 'express-openid-connect';

import adminRoutes from './routes/adminRoutes.js';
import passApiRoutes from './routes/passApiRoutes.js';

import {
    testDatabaseConnection
} from './config/database.js';

import {
    getPassCounts
} from './services/passService.js';

import publicRoutes from './routes/publicRoutes.js';

const { auth, requiresAuth } = oidc;

const app = express();

const port = Number(process.env.PORT ?? 4080);
const baseURL =
    process.env.BASE_URL ?? `http://localhost:${port}`;

app.set(
    'views',
    path.join(import.meta.dirname, 'views')
);

app.set('view engine', 'pug');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const oidcConfigured = [
    process.env.AUTH0_SECRET,
    process.env.AUTH0_CLIENT_ID,
    process.env.AUTH0_CLIENT_SECRET,
    process.env.AUTH0_ISSUER_BASE_URL
].every(Boolean);


if (oidcConfigured) {
    app.use(auth({
        authRequired: false,
        auth0Logout: true,
        secret: process.env.AUTH0_SECRET!,
        baseURL,
        clientID: process.env.AUTH0_CLIENT_ID!,
        clientSecret: process.env.AUTH0_CLIENT_SECRET!,
        issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL!,
        routes: {
            logout: false
        },
        authorizationParams: {
            response_type: 'code',
            scope: 'openid profile email'
        }
    }));

    app.post('/logout', (req, res) => {
        res.oidc.logout({
            returnTo: baseURL
        });
    });

    app.use('/admin', adminRoutes);

    app.get('/private', requiresAuth(), (req, res) => {
        res.render('private', {
            user: JSON.stringify(req.oidc.user)
        });
    });
}


app.get('/', async (req, res, next) => {
    try {
        const counts = await getPassCounts();

        const authenticated =
            oidcConfigured && req.oidc.isAuthenticated();

        const username = authenticated
            ? req.oidc.user?.name ?? req.oidc.user?.sub
            : undefined;

        res.render('index', {
            username,
            totalPasses: counts.total,
            activePasses: counts.active,
            authEnabled: oidcConfigured
        });

    } catch (error) {
        next(error);
    }
});

app.use(publicRoutes);

async function start(): Promise<void> {
    try {
        await testDatabaseConnection();

        app.listen(port, '0.0.0.0', () => {
            console.log(`Server running at ${baseURL}`);
        });

    } catch (error) {
        console.error('Failed to start application:', error);
        process.exit(1);
    }
}

app.use('/passes', passApiRoutes);

void start();
