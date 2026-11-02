import { randomUUID } from 'node:crypto';
import { pool } from '../config/database.js';
import type { Pass } from '../models/Pass.js';

interface PassRow {
    id: string;
    name: string;
    document: string;
    issued_at: Date;
    status: Pass['status'];
}

function mapPass(row: PassRow): Pass {
    return {
        id: row.id,
        name: row.name,
        document: row.document,
        issuedAt: row.issued_at,
        status: row.status
    };
}

export async function createPass(
    name: string,
    document: string
): Promise<Pass> {

    const id = randomUUID();

    const result = await pool.query<PassRow>(
        `INSERT INTO passes (id, name, document)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [id, name, document]
    );

    return mapPass(result.rows[0]);
}

export async function getPassById(
    id: string
): Promise<Pass | null> {

    const result = await pool.query<PassRow>(
        'SELECT * FROM passes WHERE id = $1',
        [id]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return mapPass(result.rows[0]);
}

export async function getPassCounts(): Promise<{
    total: number;
    active: number;
}> {

    const result = await pool.query<{
        total: string;
        active: string;
    }>(
        `SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (
                WHERE status = 'ACTIVE'
            ) AS active
         FROM passes`
    );

    return {
        total: Number(result.rows[0].total),
        active: Number(result.rows[0].active)
    };
}

export async function getAllPasses(): Promise<Pass[]> {
    const result = await pool.query<PassRow>(
        'SELECT * FROM passes ORDER BY issued_at DESC'
    );

    return result.rows.map(mapPass);
}

export async function cancelPass(id: string): Promise<boolean> {
    const result = await pool.query(
        `UPDATE passes
         SET status = 'CANCELLED'
         WHERE id = $1`,
        [id]
    );

    return (result.rowCount ?? 0) > 0;
}

export async function deletePass(id: string): Promise<boolean> {
    const result = await pool.query(
        'DELETE FROM passes WHERE id = $1',
        [id]
    );

    return (result.rowCount ?? 0) > 0;
}
