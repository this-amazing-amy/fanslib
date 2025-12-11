type ConnectionStatusProps = {
  status: 'loading' | 'connected' | 'error';
  errorMessage: string | null;
};

export const ConnectionStatus = ({
  status,
  errorMessage,
}: ConnectionStatusProps) => {
  return (
    <div className='flex items-center gap-1.5 text-xs'>
      <span className='text-base-content/60'>
        {status === 'connected'
          ? 'Connected'
          : status === 'error'
            ? `Error: ${errorMessage}`
            : 'Connecting...'}
      </span>
      <div
        className={`w-2 h-2 rounded-full ${
          status === 'connected'
            ? 'bg-success'
            : status === 'error'
              ? 'bg-error'
              : 'bg-warning'
        }`}
      />
    </div>
  );
};
