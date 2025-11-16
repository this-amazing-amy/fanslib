import { AlertTriangle, Eye, EyeOff, InfoIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Textarea } from "~/components/ui/Textarea";
import {
  useClearFanslyCredentialsMutation,
  useFanslyCredentialsQuery,
  useSaveFanslyCredentialsMutation,
} from "~/lib/queries/settings";
import { SettingRow } from "./SettingRow";

type FanslyCredentials = {
  fanslyAuth?: string;
  fanslySessionId?: string;
  fanslyClientCheck?: string;
  fanslyClientId?: string;
};

const toast = () => {};

const parseFetchRequest = (fetchRequest: string): Partial<FanslyCredentials> => {
  const credentials: Partial<FanslyCredentials> = {};

  try {
    // Extract authorization header
    const authMatch = fetchRequest.match(/"authorization":\s*"([^"]+)"/);
    if (authMatch) {
      credentials.fanslyAuth = authMatch[1];
    }

    // Extract fansly-session-id header
    const sessionMatch = fetchRequest.match(/"fansly-session-id":\s*"([^"]+)"/);
    if (sessionMatch) {
      credentials.fanslySessionId = sessionMatch[1];
    }

    // Extract fansly-client-check header
    const clientCheckMatch = fetchRequest.match(/"fansly-client-check":\s*"([^"]+)"/);
    if (clientCheckMatch) {
      credentials.fanslyClientCheck = clientCheckMatch[1];
    }

    // Extract fansly-client-id header
    const clientIdMatch = fetchRequest.match(/"fansly-client-id":\s*"([^"]+)"/);
    if (clientIdMatch) {
      credentials.fanslyClientId = clientIdMatch[1];
    }
  } catch (error) {
    console.error("Error parsing fetch request:", error);
  }

  return credentials;
};

export const FanslySettings = () => {
  const { data: loadedCredentials } = useFanslyCredentialsQuery();
  const saveMutation = useSaveFanslyCredentialsMutation();
  const clearMutation = useClearFanslyCredentialsMutation();

  const [credentials, setCredentials] = useState<FanslyCredentials>(loadedCredentials ?? {});
  const [showTokens, setShowTokens] = useState(false);
  const [fetchRequest, setFetchRequest] = useState("");

  const saveCredentials = useCallback(async () => {
    try {
      await saveMutation.mutateAsync(credentials);
      toast();
    } catch (error) {
      toast();
      console.error("Failed to save Fansly credentials:", error);
    }
  }, [credentials, saveMutation]);

  const clearCredentials = useCallback(async () => {
    try {
      await clearMutation.mutateAsync();
      setCredentials({});
      setFetchRequest("");
      toast();
    } catch (error) {
      toast();
      console.error("Failed to clear Fansly credentials:", error);
    }
  }, [clearMutation]);

  const updateCredential = (key: keyof FanslyCredentials, value: string) => {
    setCredentials((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const parseFetchRequestAndUpdateCredentials = () => {
    const parsed = parseFetchRequest(fetchRequest);

    if (Object.keys(parsed).length === 0) {
      toast();
      return;
    }

    const missingHeaders = [];
    if (!parsed.fanslyAuth) missingHeaders.push("authorization");
    if (!parsed.fanslySessionId) missingHeaders.push("fansly-session-id");
    if (!parsed.fanslyClientCheck) missingHeaders.push("fansly-client-check");
    if (!parsed.fanslyClientId) missingHeaders.push("fansly-client-id");

    if (missingHeaders.length > 0) {
      toast();
    }

    setCredentials(parsed);

    if (missingHeaders.length === 0) {
      toast();
    }
  };

  const inputType = showTokens ? "text" : "password";
  const hasAllCredentials =
    credentials.fanslyAuth &&
    credentials.fanslySessionId &&
    credentials.fanslyClientCheck &&
    credentials.fanslyClientId;
  const hasAnyCredentials =
    credentials.fanslyAuth ||
    credentials.fanslySessionId ||
    credentials.fanslyClientCheck ||
    credentials.fanslyClientId;
  const isLoading = saveMutation.isPending || clearMutation.isPending;

  return (
    <div className="space-y-4">
      {hasAnyCredentials && (
        <>
          {!hasAllCredentials && (
            <div className="relative w-full rounded-lg border p-4 border-error/50 text-error">
              <div className="flex">
                <AlertTriangle className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  All four credentials are required for Fansly analytics to work properly.
                </div>
              </div>
            </div>
          )}

          <SettingRow title="Credentials" description="Fansly API credentials for analytics">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTokens(!showTokens)}
              className="w-auto"
            >
              {showTokens ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showTokens ? "Hide" : "Show"} Tokens
            </Button>
          </SettingRow>

          <SettingRow title="Authorization Header" variant="secondary" spacing="compact">
            <Input
              type={inputType}
              id="fansly-auth"
              placeholder="Enter the authorization header value"
              value={credentials.fanslyAuth ?? ""}
              onChange={(value) => updateCredential("fanslyAuth", value)}
              className="max-w-md"
            />
          </SettingRow>

          <SettingRow title="Session ID" variant="secondary" spacing="compact">
            <Input
              type={inputType}
              id="fansly-session-id"
              placeholder="Enter the fansly-session-id header value"
              value={credentials.fanslySessionId ?? ""}
              onChange={(value) => updateCredential("fanslySessionId", value)}
              className="max-w-md"
            />
          </SettingRow>

          <SettingRow title="Client Check" variant="secondary" spacing="compact">
            <Input
              type={inputType}
              id="fansly-client-check"
              placeholder="Enter the fansly-client-check header value"
              value={credentials.fanslyClientCheck ?? ""}
              onChange={(value) => updateCredential("fanslyClientCheck", value)}
              className="max-w-md"
            />
          </SettingRow>

          <SettingRow title="Client ID" variant="secondary" spacing="compact">
            <Input
              type={inputType}
              id="fansly-client-id"
              placeholder="Enter the fansly-client-id header value"
              value={credentials.fanslyClientId ?? ""}
              onChange={(value) => updateCredential("fanslyClientId", value)}
              className="max-w-md"
            />
          </SettingRow>

          <SettingRow>
            <div className="flex gap-2">
              <Button onClick={saveCredentials} disabled={isLoading || !hasAllCredentials}>
                Save Credentials
              </Button>
              <Button variant="outline" onClick={clearCredentials} disabled={isLoading}>
                Clear All
              </Button>
            </div>
          </SettingRow>
        </>
      )}
      <SettingRow
        title="Parse credentials"
        descriptionSlot={
          <div className="relative w-full rounded-lg p-4 bg-base-100 text-base-content">
            <div className="flex">
              <InfoIcon className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                To fetch analytics data from Fansly, copy a fetch request from Chrome DevTools.
                <br />
                Go to Fansly → Developer Tools → Network tab → find any API request → right-click →
                Copy as fetch and paste it below.
              </div>
            </div>
          </div>
        }
      >
        <div className="space-y-4 pt-8 w-full">
          <Textarea
            id="fetch-request"
            placeholder="Paste the entire fetch request copied from Chrome DevTools Network tab here..."
            value={fetchRequest}
            onChange={(value) => setFetchRequest(value)}
            className="min-h-[120px] font-mono text-xs"
          />
          <Button
            onClick={parseFetchRequestAndUpdateCredentials}
            disabled={!fetchRequest.trim()}
            className="w-fit"
          >
            Parse
          </Button>
        </div>
      </SettingRow>
    </div>
  );
};
