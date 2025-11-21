import { LogIn, RefreshCcw, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/Button";
import type { SessionStatus } from "~/lib/reddit/auth-status-utils";

type AuthenticationActionsProps = {
  sessionStatus: SessionStatus | null;
  isLoggingIn: boolean;
  isClearing: boolean;
  onLogin: () => void;
  onClearSession: () => void;
};

export const AuthenticationActions = ({
  sessionStatus,
  isLoggingIn,
  isClearing,
  onLogin,
  onClearSession,
}: AuthenticationActionsProps) => (
  <div className="flex flex-wrap gap-2 pt-4">
    <Button onPress={onLogin} isDisabled={isLoggingIn} size="sm">
      {isLoggingIn ? (
        <>
          <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
          Logging in...
        </>
      ) : (
        <>
          <LogIn className="mr-2 h-4 w-4" />
          Login to Reddit
        </>
      )}
    </Button>

    {sessionStatus?.hasSession && (
      <Button variant="outline" onPress={onClearSession} isDisabled={isClearing} size="sm">
        {isClearing ? (
          <>
            <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
            Clearing...
          </>
        ) : (
          <>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Session
          </>
        )}
      </Button>
    )}
  </div>
);
