import { useCallback, useEffect, useState } from "react";
import { Image, Video, Check, X, Loader2, ArrowRight, ExternalLink } from "lucide-react";
import { getSettings } from "../../lib/storage";
import { addLogEntry } from "../../lib/activity-log";
import { eden } from "../../lib/api";
import { getMediaThumbnailUrl } from "../../lib/utils";

type Suggestion = {
  postMediaId: string;
  mediaId: string;
  filename: string;
  confidence: number;
  caption?: string;
  scheduleName?: string;
};

type Candidate = {
  id: string;
  filename: string;
  caption: string | null;
  fanslyPostId: string;
  mediaType: string;
  suggestions: Suggestion[];
  selectedIndex: number;
  suggestionsLoading: boolean;
};

type RawCandidate = {
  id: string;
  filename: string;
  caption: string | null;
  fanslyPostId: string;
  mediaType: string;
};

const CONFIDENCE_THRESHOLD = 0.05;

const getVisibleSuggestions = (suggestions: Suggestion[]): Suggestion[] => {
  if (suggestions.length <= 1) return suggestions;
  const topConfidence = suggestions[0].confidence;
  return suggestions.filter((s) => topConfidence - s.confidence <= CONFIDENCE_THRESHOLD);
};

export const BackfillTab = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState("");

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const settings = await getSettings();
      const currentApiUrl = settings.apiUrl;
      setApiUrl(currentApiUrl);
      const api = eden(currentApiUrl);
      const response = await api.api.analytics.candidates.$get({
        query: { status: "pending", limit: "20" },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const parsed = await response.json();
      const data = parsed.items as RawCandidate[];

      const initial: Candidate[] = data.map((c) => ({
        id: c.id,
        filename: c.filename,
        caption: c.caption,
        fanslyPostId: c.fanslyPostId,
        mediaType: c.mediaType,
        suggestions: [],
        selectedIndex: 0,
        suggestionsLoading: true,
      }));

      setCandidates(initial);

      // Fetch suggestions for each candidate
      data.forEach((c) => {
        fetchSuggestions(currentApiUrl, c.id);
      });
    } catch (err) {
      console.error("Failed to load candidates:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const fetchSuggestions = async (suggestionsApiUrl: string, candidateId: string) => {
    try {
      const api = eden(suggestionsApiUrl);
      const response = await api.api.analytics.candidates["by-id"][":id"].suggestions.$get({
        param: { id: candidateId },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const suggestions = (await response.json()) as Suggestion[];

      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId
            ? { ...c, suggestions, selectedIndex: 0, suggestionsLoading: false }
            : c,
        ),
      );
    } catch {
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, suggestionsLoading: false } : c)),
      );
    }
  };

  const handleConfirm = async (candidate: Candidate, suggestion: Suggestion) => {
    setActionInProgress(candidate.id);

    try {
      const settings = await getSettings();
      const api = eden(settings.apiUrl);
      const response = await api.api.analytics.candidates["by-id"][":id"].match.$post({
        param: { id: candidate.id },
        json: { postMediaId: suggestion.postMediaId },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await addLogEntry({
        type: "success",
        message: `Matched "${candidate.filename}" to "${suggestion.filename}"`,
      });

      setCandidates((prev) => prev.filter((c) => c.id !== candidate.id));
    } catch (err) {
      console.error("Failed to confirm match:", err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleIgnore = async (candidate: Candidate) => {
    setActionInProgress(candidate.id);

    try {
      const settings = await getSettings();
      const api = eden(settings.apiUrl);
      const response = await api.api.analytics.candidates["by-id"][":id"].ignore.$post({
        param: { id: candidate.id },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await addLogEntry({
        type: "warning",
        message: `Ignored candidate "${candidate.filename}"`,
      });

      setCandidates((prev) => prev.filter((c) => c.id !== candidate.id));
    } catch (err) {
      console.error("Failed to ignore candidate:", err);
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
        <div className="text-sm text-base-content/50 text-center py-8">No unmatched candidates</div>
      ) : (
        <div className="space-y-2 max-h-[calc(100vh-10rem)] overflow-y-auto">
          {candidates.map((candidate) => {
            const isActioning = actionInProgress === candidate.id;
            const captionPreview = candidate.caption
              ? candidate.caption.slice(0, 60) + (candidate.caption.length > 60 ? "..." : "")
              : null;
            const visible = getVisibleSuggestions(candidate.suggestions);

            return (
              <div key={candidate.id} className="card card-compact bg-base-200 p-3">
                {/* Candidate (Fansly side) */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="shrink-0">
                    {candidate.mediaType === "video" ? (
                      <Video className="w-3.5 h-3.5 text-base-content/50" />
                    ) : (
                      <Image className="w-3.5 h-3.5 text-base-content/50" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-base-content/40 font-semibold">
                      Fansly
                    </div>
                    <div className="text-xs font-medium truncate">{candidate.filename}</div>
                    {captionPreview && (
                      <div className="text-[10px] text-base-content/50 truncate">
                        {captionPreview}
                      </div>
                    )}
                  </div>
                  <a
                    href={`https://fansly.com/post/${candidate.fanslyPostId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-xs btn-square shrink-0"
                    title="View on Fansly"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Match suggestions */}
                {candidate.suggestionsLoading ? (
                  <div className="text-[10px] text-base-content/40 flex items-center gap-1 pl-5">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Finding matches...
                  </div>
                ) : visible.length > 0 ? (
                  <div className="space-y-1.5">
                    {visible.map((suggestion) => {
                      const suggestionCaptionPreview = suggestion.caption
                        ? suggestion.caption.slice(0, 60) +
                          (suggestion.caption.length > 60 ? "..." : "")
                        : null;

                      return (
                        <div key={suggestion.postMediaId} className="flex items-center gap-2">
                          <ArrowRight className="w-3.5 h-3.5 text-green-600 shrink-0" />
                          {/* Thumbnail */}
                          <div className="w-10 h-10 rounded overflow-hidden bg-base-300 shrink-0">
                            <img
                              src={getMediaThumbnailUrl(apiUrl, suggestion.mediaId)}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <div className="text-[10px] uppercase tracking-wider text-base-content/40 font-semibold">
                                Library match
                              </div>
                              {suggestion.scheduleName && (
                                <span className="badge badge-xs badge-primary">
                                  {suggestion.scheduleName}
                                </span>
                              )}
                            </div>
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
                              onClick={() => handleConfirm(candidate, suggestion)}
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
                          </div>
                        </div>
                      );
                    })}
                    {/* Ignore button below all suggestions */}
                    <div className="flex justify-end pt-0.5">
                      <button
                        onClick={() => handleIgnore(candidate)}
                        disabled={isActioning}
                        className="btn btn-ghost btn-xs gap-1"
                        title="Ignore"
                      >
                        <X className="w-3 h-3" />
                        <span className="text-[10px]">Ignore</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pl-5">
                    <div className="text-[10px] text-base-content/40 flex-1">No match found</div>
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
