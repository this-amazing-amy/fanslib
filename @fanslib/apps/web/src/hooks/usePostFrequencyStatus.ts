import { useEffect, useState } from 'react';

type PostFrequencyStatus = {
  canPost: boolean;
  timeLeft: string;
};

export const usePostFrequencyStatus = (
  lastPostDate?: string | null,
  maxPostFrequencyHours = 24
): PostFrequencyStatus => {
  const [status, setStatus] = useState<PostFrequencyStatus>({
    canPost: true,
    timeLeft: '',
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!lastPostDate) {
        setStatus({ canPost: true, timeLeft: '' });
        return;
      }

      const lastPost = new Date(lastPostDate);
      const nextPostTime = new Date(
        lastPost.getTime() + (maxPostFrequencyHours || 24) * 60 * 60 * 1000
      );
      const now = new Date();
      const diffMs = nextPostTime.getTime() - now.getTime();

      if (diffMs <= 0) {
        setStatus({ canPost: true, timeLeft: '' });
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setStatus({
        canPost: false,
        timeLeft: `${hours}h ${minutes}m`,
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000);

    return () => clearInterval(interval);
  }, [lastPostDate, maxPostFrequencyHours]);

  return status;
};
