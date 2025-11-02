import type {
  ClearFanslyCredentialsResponse,
  ImportDatabaseRequest,
  ImportDatabaseResponse,
  LoadFanslyCredentialsResponse,
  LoadSettingsResponse,
  PerformHealthCheckRequest,
  PerformHealthCheckResponse,
  ResetDatabaseResponse,
  SaveFanslyCredentialsRequest,
  SaveFanslyCredentialsResponse,
  SaveSettingsRequest,
  SaveSettingsResponse,
  ToggleSfwModeResponse,
  ValidateImportedDatabaseRequest,
  ValidateImportedDatabaseResponse,
} from '@fanslib/types';
import { apiRequest } from './client';

export const settingsApi = {
  get: () =>
    apiRequest<LoadSettingsResponse>('/api/settings'),

  save: (request: SaveSettingsRequest) =>
    apiRequest<SaveSettingsResponse>('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(request),
    }),

  toggleSfwMode: () =>
    apiRequest<ToggleSfwModeResponse>('/api/settings/toggle-sfw', {
      method: 'POST',
    }),

  resetDatabase: () =>
    apiRequest<ResetDatabaseResponse>('/api/settings/reset-database', {
      method: 'POST',
    }),

  getFanslyCredentials: () =>
    apiRequest<LoadFanslyCredentialsResponse>('/api/settings/fansly-credentials'),

  saveFanslyCredentials: (request: SaveFanslyCredentialsRequest) =>
    apiRequest<SaveFanslyCredentialsResponse>('/api/settings/fansly-credentials', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  clearFanslyCredentials: () =>
    apiRequest<ClearFanslyCredentialsResponse>('/api/settings/fansly-credentials', {
      method: 'DELETE',
    }),

  importDatabase: (request: ImportDatabaseRequest) =>
    apiRequest<ImportDatabaseResponse>('/api/settings/import-database', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  validateDatabase: (request: ValidateImportedDatabaseRequest) =>
    apiRequest<ValidateImportedDatabaseResponse>('/api/settings/validate-database', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  healthCheck: (request: PerformHealthCheckRequest) =>
    apiRequest<PerformHealthCheckResponse>('/api/settings/health-check', {
      method: 'POST',
      body: JSON.stringify(request),
    }),
};

