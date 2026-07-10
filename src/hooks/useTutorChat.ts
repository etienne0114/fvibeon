import { useCallback, useState } from 'react';
import { chatWithTutor } from '../api/learn';

export function useTutorChat() {
  const [message, setMessage] = useState('');
  const [helperText, setHelperText] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      setHelperText('Please write a quick prompt.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await chatWithTutor(trimmed);
      const payload = response?.data;
      if (payload?.data?.response) {
        setHelperText(payload.data.response);
      } else {
        setHelperText('Tutor heard you.');
      }
      setMessage('');
    } catch (err: any) {
      setHelperText(err?.message || 'Message failed to send');
    } finally {
      setIsLoading(false);
    }
  }, [message]);

  return {
    message,
    setMessage,
    helperText,
    isLoading,
    sendMessage,
  };
}
