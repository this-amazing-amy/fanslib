const DEBUG_PREFIX = '[FansLib:Bridge]';

const debug = (level: 'info' | 'warn' | 'error', message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  const logArgs = data !== undefined ? [`[${timestamp}] ${DEBUG_PREFIX} ${message}`, data] : [`[${timestamp}] ${DEBUG_PREFIX} ${message}`];
  
  switch (level) {
    case 'info':
      console.log(...logArgs);
      break;
    case 'warn':
      console.warn(...logArgs);
      break;
    case 'error':
      console.error(...logArgs);
      break;
  }
};

debug('info', 'Bridge script starting in ISOLATED world', {
  location: window.location.href,
  hasChromeRuntime: typeof chrome !== 'undefined' && !!chrome.runtime,
});

window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  
  if (event.data.type === 'FANSLIB_TIMELINE_DATA') {
    debug('info', 'Received timeline data from MAIN world', {
      candidateCount: event.data.candidates?.length,
    });
    
    try {
      chrome.runtime.sendMessage({
        type: "FANSLY_TIMELINE_DATA",
        candidates: event.data.candidates,
      }).then(() => {
        debug('info', 'Message sent successfully to background script');
      }).catch((error) => {
        debug('error', 'Failed to send message to background script', {
          error,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      });
    } catch (error) {
      debug('error', 'Failed to forward message', {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }
  }
});

debug('info', 'Bridge message listener installed');

export {};

