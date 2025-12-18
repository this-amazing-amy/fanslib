import { Check, FolderOpen, Loader2, X } from 'lucide-react';
import { useLibraryVerification } from '../../hooks/useLibraryVerification';

type LibraryPathInputProps = {
  libraryPath: string;
  apiUrl: string;
  onChange: (value: string) => void;
};

type VerifyButtonProps = {
  status: 'idle' | 'checking' | 'verified' | 'error';
  verifiedFolderName: string | null;
  pathMismatch: boolean;
  onClick: () => void;
};

const VerifyButton = ({
  status,
  verifiedFolderName,
  pathMismatch,
  onClick,
}: VerifyButtonProps) => {
  const isVerified = status === 'verified';
  const isChecking = status === 'checking';

  const buttonContent = isChecking ? (
    <>
      <Loader2 className='w-4 h-4 animate-spin' />
      Verifying...
    </>
  ) : isVerified ? (
    <>
      <Check className='w-4 h-4' />
      Verified &quot;{verifiedFolderName}&quot;
      {pathMismatch && (
        <span className='text-warning text-xs ml-1'>(path mismatch)</span>
      )}
    </>
  ) : (
    <>
      <FolderOpen className='w-4 h-4' />
      Verify Folder Access
    </>
  );

  return (
    <button
      onClick={onClick}
      disabled={isChecking}
      className={`w-full px-4 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-2 ${
        isVerified
          ? 'bg-success/20 border-success text-success'
          : 'bg-base-100 hover:bg-base-200 border-transparent text-base-content'
      }`}
      title='Select library folder and verify file access'
    >
      {buttonContent}
    </button>
  );
};

type ErrorMessageProps = {
  message: string;
};

const ErrorMessage = ({ message }: ErrorMessageProps) => (
  <div className='mt-3 px-4 py-3 rounded-lg text-sm bg-error/20 text-error'>
    <div className='flex items-start gap-2'>
      <X className='w-4 h-4 mt-0.5 flex-shrink-0' />
      <div className='text-sm break-words whitespace-pre-wrap'>{message}</div>
    </div>
  </div>
);

export const LibraryPathInput = ({
  libraryPath,
  apiUrl,
  onChange,
}: LibraryPathInputProps) => {
  const { status, errorMessage, verifiedFolderName, verify } =
    useLibraryVerification();

  const handleVerify = async () => {
    const updatedPath = await verify(apiUrl, libraryPath);
    if (updatedPath) {
      onChange(updatedPath);
    }
  };

  const pathMismatch = Boolean(
    verifiedFolderName && !libraryPath.trim().endsWith(verifiedFolderName)
  );

  return (
    <div>
      <label className='block text-sm font-medium mb-2'>
        Library Folder Path
      </label>

      <div className='space-y-2'>
        <input
          type='text'
          value={libraryPath}
          onChange={(e) => onChange(e.target.value)}
          placeholder='/Users/you/Pictures/library'
          className='w-full px-3 py-2 bg-base-200 rounded-lg text-sm text-base-content border border-base-300 focus:border-primary focus:outline-none'
        />

        <VerifyButton
          status={status}
          verifiedFolderName={verifiedFolderName}
          pathMismatch={pathMismatch}
          onClick={handleVerify}
        />
      </div>

      {status === 'error' && errorMessage && (
        <ErrorMessage message={errorMessage} />
      )}
    </div>
  );
};
