const backendBaseUrl = `http://localhost:6970`;

export const getMediaFileUrl = (id: string) => `${backendBaseUrl}/api/media/${id}/file`;

export const getMediaThumbnailUrl = (id: string) => `${backendBaseUrl}/api/media/${id}/thumbnail`;
