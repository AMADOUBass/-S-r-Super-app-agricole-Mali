import { Request } from 'express';
export interface JwtPayload {
    userId: string;
    telephone: string;
    role: string;
}
export interface AuthRequest extends Request {
    user?: JwtPayload;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface ProduitsQuery {
    type?: string;
    region?: string;
    commune?: string;
    search?: string;
    page?: string;
    limit?: string;
    minPrix?: string;
    maxPrix?: string;
}
export interface ElevageQuery {
    type?: string;
    region?: string;
    search?: string;
    page?: string;
    limit?: string;
}
export interface MaterielQuery {
    type?: string;
    region?: string;
    search?: string;
    dateDebut?: string;
    dateFin?: string;
    page?: string;
    limit?: string;
}
export interface SmsSendParams {
    to: string | string[];
    message: string;
}
export interface MeteoResponse {
    commune: string;
    latitude: number;
    longitude: number;
    previsions: {
        date: string;
        tempMax: number;
        tempMin: number;
        precipitation: number;
        vent: number;
        description: string;
    }[];
}
//# sourceMappingURL=index.d.ts.map