import { Alert, AlertIcon, Box, Circle, Flex, HStack, SimpleGrid, Skeleton, Text } from '@chakra-ui/react';
import { useAchievements } from '../../../hooks';
import { ink, inkSoft, card, line, serif, amber, amberTint, amberDeep } from '../../../theme/brand';

const AchievementsGrid = () => {
  const { data, isLoading, error } = useAchievements();

  if (isLoading && !data) {
    return (
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} h="120px" borderRadius="2xl" />
        ))}
      </SimpleGrid>
    );
  }

  return (
    <Box>
      {error && (
        <Alert status="error" borderRadius="xl" fontSize="sm" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {data && (
        <Flex justify="space-between" align="center" bg={card} border="1px solid" borderColor={line} borderRadius="xl" p={4} mb={5}>
          <Text fontFamily={serif} fontWeight="600" color={ink}>
            Total XP: {data.totalXP}
          </Text>
          <Text fontSize="sm" color={inkSoft}>
            {data.unlockedCount}/{data.achievements.length} unlocked
          </Text>
        </Flex>
      )}

      <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
        {data?.achievements.map((item) => (
          <Box
            key={item.type}
            bg={item.unlocked ? 'white' : card}
            border="1px solid"
            borderColor={item.unlocked ? amberTint : line}
            borderRadius="2xl"
            p={5}
            opacity={item.unlocked ? 1 : 0.65}
            transition="all 0.2s ease"
            _hover={item.unlocked ? { transform: 'translateY(-3px)', boxShadow: '0 12px 24px rgba(46,31,38,0.08)' } : {}}
          >
            <HStack spacing={3} mb={2}>
              <Circle size="40px" bg={item.unlocked ? amber : line} color="white">
                <Text fontSize="lg">{item.unlocked ? '🏆' : '🔒'}</Text>
              </Circle>
              <Text fontFamily={serif} fontWeight="600" color={ink} fontSize="md">
                {item.title}
              </Text>
            </HStack>
            <Text fontSize="sm" color={inkSoft} mb={3}>
              {item.description}
            </Text>
            <Flex justify="space-between" align="center">
              <Text fontSize="xs" fontWeight="700" color={item.unlocked ? amberDeep : inkSoft}>
                +{item.xpReward} XP
              </Text>
              <Text fontSize="xs" color={inkSoft}>
                {item.unlocked ? `Unlocked ${new Date(item.unlockedAt || '').toLocaleDateString()}` : 'Locked'}
              </Text>
            </Flex>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default AchievementsGrid;
