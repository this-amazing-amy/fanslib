const backendBaseUrl = `http://localhost:8001`;

export const getMediaFileUrl = (id: string) => `${backendBaseUrl}/api/media/${id}/file`;

export const getMediaThumbnailUrl = (id: string) => `${backendBaseUrl}/api/media/${id}/thumbnail`;
