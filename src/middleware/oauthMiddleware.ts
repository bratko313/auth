import type {
    Request,
    Response,
    NextFunction
} from 'express';

import {
    createRemoteJWKSet,
    jwtVerify
} from 'jose';

const authority = process.env.AUTH0_ISSUER_BASE_URL
    ?.replace(/\/+$/, '');

const audience = process.env.AUTH0_AUDIENCE;

if (!authority || !audience) {
    throw new Error('OAuth2 configuration is missing');
}

const issuer = `${authority}/`;

const JWKS = createRemoteJWKSet(
    new URL(`${authority}/.well-known/jwks.json`)
);

export function requireScope(requiredScope: string) {
    return async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {

        const authorization = req.headers.authorization;

        if (!authorization) {
            res.sendStatus(401);
            return;
        }

        const match = /^Bearer\s+(\S+)$/i.exec(authorization);

        if (!match) {
            res.sendStatus(401);
            return;
        }

        try {
            const { payload } = await jwtVerify(match[1], JWKS, {
                issuer,
                audience,
                algorithms: ['RS256']
            });

            const scopes =
                typeof payload.scope === 'string'
                    ? payload.scope.split(/\s+/)
                    : [];

            if (!scopes.includes(requiredScope)) {
                res.sendStatus(403);
                return;
            }

            next();

        } catch (error) {
            console.error('JWT verification failed:', error);
            res.sendStatus(401);
        }
    };
}
