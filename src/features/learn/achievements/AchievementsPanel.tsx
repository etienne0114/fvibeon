import { Box, Flex, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import { SectionCard, SectionHeading } from '../../../components';
import { useAchievements } from '../../../hooks';
import { motion } from 'framer-motion';

const AchievementsPanel = () => {
  const { data, isLoading, error } = useAchievements();

  return (
    <SectionCard>
      <SectionHeading title="Achievements" subtitle="Celebrating every unlocked milestone" />
      {isLoading && <Text fontSize="sm" color="gray.500">Loading achievements…</Text>}
      {error && (
        <Box bg="red.50" p={3} borderRadius="lg" mb={4}>
          <Text fontSize="sm" color="red.600" fontWeight="medium">{error}</Text>
        </Box>
      )}
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4} mt={2}>
        {data?.achievements.map((item) => (
          <motion.div
            key={item.type}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <Box
              bg={item.unlocked ? 'white' : 'gray.50'}
              borderRadius="2xl"
              p={5}
              borderWidth={1}
              borderColor={item.unlocked ? 'learning.200' : 'gray.100'}
              boxShadow={item.unlocked ? 'premium' : 'none'}
              transition="all 0.3s ease"
              _hover={{ boxShadow: 'premium-hover' }}
              position="relative"
              overflow="hidden"
              opacity={item.unlocked ? 1 : 0.7}
            >
              {item.unlocked && (
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  w="full"
                  h="3px"
                  bg="learning.400"
                />
              )}
              <Stack spacing={2}>
                <Flex align="center" gap={2}>
                  <Text fontSize="xl">{item.unlocked ? '🏆' : '🔒'}</Text>
                  <Text fontWeight="800" fontSize="md" color={item.unlocked ? 'gray.800' : 'gray.500'} letterSpacing="tight">
                    {item.title}
                  </Text>
                </Flex>
                <Text fontSize="sm" color="gray.500" fontWeight="medium">
                  {item.description}
                </Text>
                <Flex justify="space-between" align="center">
                  <Text fontSize="xs" fontWeight="bold" color={item.unlocked ? 'learning.600' : 'gray.400'}>
                    +{item.xpReward} XP
                  </Text>
                  <Text fontSize="xs" color="gray.400" fontWeight="medium">
                    {item.unlocked
                      ? `Unlocked ${new Date(item.unlockedAt || '').toLocaleDateString()}`
                      : 'Locked'}
                  </Text>
                </Flex>
              </Stack>
            </Box>
          </motion.div>
        ))}
      </SimpleGrid>
      {data && (
        <Flex
          mt={6}
          p={4}
          bg="gray.50"
          borderRadius="xl"
          justify="space-between"
          align="center"
        >
          <Text fontSize="sm" fontWeight="bold" color="gray.700">
            Total XP: {data.totalXP}
          </Text>
          <Text fontSize="sm" fontWeight="medium" color="gray.500">
            {data.unlockedCount}/{data.achievements.length} unlocked
          </Text>
        </Flex>
      )}
    </SectionCard>
  );
};

export default AchievementsPanel;
