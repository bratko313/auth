import { Router } from 'express';
import oidc from 'express-openid-connect';

import {
    getAllPasses,
    cancelPass,
    deletePass
} from '../services/passService.js';

const { requiresAuth } = oidc;

const router = Router();

router.use(requiresAuth());

router.use((req, res, next) => {
    if (req.method !== 'POST') {
        next();
        return;
    }

    const origin = req.get('Origin');
    const expectedOrigin = process.env.BASE_URL;

    if (!origin || !expectedOrigin || origin !== expectedOrigin) {
        res.sendStatus(403);
        return;
    }

    next();
});

router.get('/passes', async (req, res, next) => {
    try {
        const passes = await getAllPasses();

        res.render('adminPasses', {
            passes
        });

    } catch (error) {
        next(error);
    }
});

router.post('/passes/:id/cancel', async (req, res, next) => {
    try {
        const id = req.params.id;

        if (typeof id !== 'string') {
            res.sendStatus(400);
            return;
        }

        const success = await cancelPass(id);

        if (!success) {
            res.sendStatus(404);
            return;
        }

        res.redirect('/admin/passes');

    } catch (error) {
        next(error);
    }
});

router.post('/passes/:id/delete', async (req, res, next) => {
    try {
        const id = req.params.id;

        if (typeof id !== 'string') {
            res.sendStatus(400);
            return;
        }

        const success = await deletePass(id);

        if (!success) {
            res.sendStatus(404);
            return;
        }

        res.redirect('/admin/passes');

    } catch (error) {
        next(error);
    }
});

export default router;
