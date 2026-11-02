import { Router } from 'express';
import { validate as isUUID } from 'uuid';

import { requireScope } from '../middleware/oauthMiddleware.js';

import {
    createPass,
    getPassById
} from '../services/passService.js';

import {
    generatePassQR
} from '../services/qrService.js';

const router = Router();

router.get(
    '/:id',
    requireScope('read:passes'),
    async (req, res, next) => {
        try {
            const id = req.params.id;

            if (typeof id !== 'string' || !isUUID(id)) {
                res.sendStatus(404);
                return;
            }

            const pass = await getPassById(id);

            if (!pass) {
                res.sendStatus(404);
                return;
            }

            res.status(200).json({
                id: pass.id,
                name: pass.name,
                document: pass.document,
                issuedAt: pass.issuedAt.toISOString(),
                status: pass.status
            });

        } catch (error) {
            next(error);
        }
    }
);

router.post(
    '/',
    requireScope('create:passes'),
    async (req, res, next) => {
        try {
            const { name, document } = req.body ?? {};

            if (
                typeof name !== 'string' ||
                typeof document !== 'string' ||
                name.trim().length === 0 ||
                document.trim().length === 0
            ) {
                res.status(400).json({
                    error: 'Name and document must not be empty'
                });
                return;
            }

            const baseURL = (
                process.env.RENDER_EXTERNAL_URL ||
                process.env.BASE_URL
            )?.replace(/\/+$/, '');

            if (!baseURL) {
                throw new Error('Public base URL is not configured');
            }

            const pass = await createPass(
                name.trim(),
                document.trim()
            );

            const apiURL = new URL(
                `/passes/${pass.id}`,
                baseURL
            ).toString();

            const qrCode = await generatePassQR(
                pass.id,
                baseURL
            );

            res
                .status(201)
                .set({
                    'Content-Type': 'image/png',
                    'Location': apiURL,
                    'Cache-Control': 'no-store'
                })
                .send(qrCode);

        } catch (error) {
            next(error);
        }
    }
);

export default router;
