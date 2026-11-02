import { Router } from 'express';
import { validate as isUUID } from 'uuid';
import {
    getPassById
} from '../services/passService.js';

const router = Router();

router.get('/info/:id', async (req, res, next) => {
    try {
        const id = req.params.id;

        if (typeof id !== 'string' || !isUUID(id)) {
            res.status(404).send('Propusnica nije pronađena');
            return;
        }

        const pass = await getPassById(id);

        if (!pass) {
            res.status(404).send('Propusnica nije pronađena');
            return;
        }

        res.render('passInfo', { pass });

    } catch (error) {
        next(error);
    }
});

export default router;
