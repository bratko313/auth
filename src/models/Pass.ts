export type PassStatus = 'ACTIVE' | 'CANCELLED';

export interface Pass {
    id: string;
    name: string;
    document: string;
    issuedAt: Date;
    status: PassStatus;
}
