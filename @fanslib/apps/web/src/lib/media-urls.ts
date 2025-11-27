import { backendBaseUrl } from './config';

export const getMediaFileUrl = (id: string) => `${backendBaseUrl}/api/media/${id}/file`;

export const getMediaThumbnailUrl = (id: string) => `${backendBaseUrl}/api/media/${id}/thumbnail`;
