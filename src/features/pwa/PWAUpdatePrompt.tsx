import { useEffect, useState } from 'react';
import { Box, Button, HStack, Text } from '@chakra-ui/react';
import { registerSW } from 'virtual:pwa-register';
import { ink, cream, rose } from '../../theme/brand';

// Mounted once at the app root. Registers the service worker that makes the
// app installable and lets previously-viewed courses/lessons open with no
// connection — this component only surfaces the two moments a learner
// actually needs to know about: an update is ready, or offline mode just
// became available for the first time.
const PWAUpdatePrompt = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateSW, setUpdateSW] = useState<((reload?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    const update = registerSW({
      onNeedRefresh: () => setNeedRefresh(true),
      onOfflineReady: () => setOfflineReady(true),
    });
    setUpdateSW(() => update);
  }, []);

  if (!needRefresh && !offlineReady) return null;

  return (
    <Box position="fixed" bottom={4} left="50%" transform="translateX(-50%)" zIndex={2000}>
      <HStack bg={ink} color="white" borderRadius="full" pl={5} pr={2} py={2} spacing={3} boxShadow="0 8px 24px rgba(0,0,0,0.25)">
        <Text fontSize="sm">
          {needRefresh ? 'A new version is ready.' : 'Vibeon Learn is ready to work offline.'}
        </Text>
        {needRefresh ? (
          <Button
            size="sm"
            bg={rose}
            color="white"
            borderRadius="full"
            _hover={{ opacity: 0.9 }}
            onClick={() => updateSW?.(true)}
          >
            Refresh
          </Button>
        ) : (
          <Button size="sm" variant="ghost" color={cream} onClick={() => setOfflineReady(false)}>
            Got it
          </Button>
        )}
      </HStack>
    </Box>
  );
};

export default PWAUpdatePrompt;
