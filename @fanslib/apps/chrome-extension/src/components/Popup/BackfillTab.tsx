import { useCallback, useEffect, useState } from 'react';
import { parse as devalueParse } from 'devalue';
import { Image, Video, Check, X, Loader2, ArrowRight } from 'lucide-react';
import { getSettings } from '../../lib/storage';
import { addLogEntry } from '../../lib/activity-log';
import { getMediaThumbnailUrl } from '../../lib/utils';

const parseResponse = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (response.headers.get('X-Serialization') === 'devalue') {
    return devalueParse(text);
  }
  return JSON.parse(text);
};

type Suggestion = {
  postMediaId: string;
  mediaId: string;
  filename: string;
  confidence: number;
  caption?: string;
};

type Candidate = {
  id: string;
  filename: string;
  caption: string | null;
  mediaType: string;
  topSuggestion: Suggestion | null;
  suggestionsLoading: boolean;
};

type RawCandidate = {
  id: string;
  filename: string;
  caption: string | null;
  mediaType: string;
};

export const BackfillTab = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState('');

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const settings = await getSettings();
      const apiUrl = settings.apiUrl.replace(/\/+$/, '');
      setApiUrl(apiUrl);
      const response = await fetch(
        `${apiUrl}/api/analytics/candidates?status=pending&limit=20`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const parsed = (await parseResponse(response)) as
        | RawCandidate[]
        | { items: RawCandidate[]; total: number };
      const data = Array.isArray(parsed) ? parsed : parsed.items;

      const initial: Candidate[] = data.map((c) => ({
        id: c.id,
        filename: c.filename,
        caption: c.caption,
        mediaType: c.mediaType,
        topSuggestion: null,
        suggestionsLoading: true,
      }));

      setCandidates(initial);

      // Fetch suggestions for each candidate
      data.forEach((c) => {
        fetchSuggestions(apiUrl, c.id);
      });
    } catch (err) {
      console.error('Failed to load candidates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const fetchSuggestions = async (apiUrl: string, candidateId: string) => {
    try {
      const response = await fetch(
        `${apiUrl}/api/analytics/candidates/by-id/${candidateId}/suggestions`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const suggestions = (await parseResponse(response)) as Suggestion[];
      const topSuggestion = suggestions.length > 0 ? suggestions[0] : null;

      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId
            ? { ...c, topSuggestion, suggestionsLoading: false }
            : c
        )
      );
    } catch {
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId ? { ...c, suggestionsLoading: false } : c
        )
      );
    }
  };

  const handleConfirm = async (candidate: Candidate) => {
    if (!candidate.topSuggestion) return;
    setActionInProgress(candidate.id);

    try {
      const settings = await getSettings();
      const response = await fetch(
        `${settings.apiUrl.replace(/\/+$/, '')}/api/analytics/candidates/by-id/${candidate.id}/match`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postMediaId: candidate.topSuggestion.postMediaId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await addLogEntry({
        type: 'success',
        message: `Matched "${candidate.filename}" to "${candidate.topSuggestion.filename}"`,
      });

      setCandidates((prev) => prev.filter((c) => c.id !== candidate.id));
    } catch (err) {
      console.error('Failed to confirm match:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleIgnore = async (candidate: Candidate) => {
    setActionInProgress(candidate.id);

    try {
      const settings = await getSettings();
      const response = await fetch(
        `${settings.apiUrl.replace(/\/+$/, '')}/api/analytics/candidates/by-id/${candidate.id}/ignore`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await addLogEntry({
        type: 'warning',
        message: `Ignored candidate "${candidate.filename}"`,
      });

      setCandidates((prev) => prev.filter((c) => c.id !== candidate.id));
    } catch (err) {
      console.error('Failed to ignore candidate:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="px-3 pt-3 pb-4">
      <h3 className="text-sm font-semibold mb-3">Backfill Matching</h3>

      {loading ? (
        <div className="text-sm text-base-content/70 flex items-center gap-2 py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading candidates...
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-sm text-base-content/50 text-center py-8">
          No unmatched candidates
        </div>
      ) : (
        <div className="space-y-2 max-h-[calc(100vh-10rem)] overflow-y-auto">
          {candidates.map((candidate) => {
            const isActioning = actionInProgress === candidate.id;
            const captionPreview = candidate.caption
              ? candidate.caption.slice(0, 60) +
                (candidate.caption.length > 60 ? '...' : '')
              : null;
            const suggestion = candidate.topSuggestion;
            const suggestionCaptionPreview = suggestion?.caption
              ? suggestion.caption.slice(0, 60) +
                (suggestion.caption.length > 60 ? '...' : '')
              : null;

            return (
              <div
                key={candidate.id}
                className="card card-compact bg-base-200 p-3"
              >
                {/* Candidate (Fansly side) */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="shrink-0">
                    {candidate.mediaType === 'video' ? (
                      <Video className="w-3.5 h-3.5 text-base-content/50" />
                    ) : (
                      <Image className="w-3.5 h-3.5 text-base-content/50" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-base-content/40 font-semibold">Fansly</div>
                    <div className="text-xs font-medium truncate">
                      {candidate.filename}
                    </div>
                    {captionPreview && (
                      <div className="text-[10px] text-base-content/50 truncate">
                        {captionPreview}
                      </div>
                    )}
                  </div>
                </div>

                {/* Match arrow + suggestion */}
                {candidate.suggestionsLoading ? (
                  <div className="text-[10px] text-base-content/40 flex items-center gap-1 pl-5">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Finding matches...
                  </div>
                ) : suggestion ? (
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    {/* Thumbnail */}
                    <div className="w-10 h-10 rounded overflow-hidden bg-base-300 shrink-0">
                      <img
                        src={getMediaThumbnailUrl(apiUrl, suggestion.mediaId)}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] uppercase tracking-wider text-base-content/40 font-semibold">Library match</div>
                      <div className="text-xs truncate">{suggestion.filename}</div>
                      {suggestionCaptionPreview && (
                        <div className="text-[10px] text-base-content/50 truncate">
                          {suggestionCaptionPreview}
                        </div>
                      )}
                      <div className="text-[10px] text-green-600">
                        {Math.round(suggestion.confidence * 100)}% confidence
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleConfirm(candidate)}
                        disabled={isActioning}
                        className="btn btn-success btn-xs btn-square"
                        title="Confirm match"
                      >
                        {isActioning ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={() => handleIgnore(candidate)}
                        disabled={isActioning}
                        className="btn btn-ghost btn-xs btn-square"
                        title="Ignore"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pl-5">
                    <div className="text-[10px] text-base-content/40 flex-1">
                      No match found
                    </div>
                    <button
                      onClick={() => handleIgnore(candidate)}
                      disabled={isActioning}
                      className="btn btn-ghost btn-xs btn-square"
                      title="Ignore"
                    >
                      {isActioning ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
