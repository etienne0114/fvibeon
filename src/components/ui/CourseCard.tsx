import { Badge, Box, Button, Flex, Heading, HStack, Stack, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';

interface CourseCardProps {
  title: string;
  description: string;
  level: string;
  learners: number;
  onEnroll: () => void;
  duration?: number;
  status?: string;
}

const levelColorMap: Record<string, string> = {
  BEGINNER: 'green',
  INTERMEDIATE: 'orange',
  ADVANCED: 'red',
};

const CourseCard = ({ title, description, level, learners, onEnroll, duration, status }: CourseCardProps) => (
  <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }} style={{ height: '100%' }}>
    <Box
      borderWidth="1px"
      borderColor="gray.100"
      borderRadius="2xl"
      p={6}
      h="full"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      bg="white"
      boxShadow="premium"
      position="relative"
      overflow="hidden"
      transition="all 0.3s ease"
      _hover={{ boxShadow: 'premium-hover' }}
    >
      <Box
        position="absolute"
        top={0}
        left={0}
        w="full"
        h="3px"
        bg={status === 'ARCHIVED' ? 'gray.300' : 'learning.400'}
      />

      <Stack spacing={4} flexGrow={1}>
        <Flex justify="space-between" align="flex-start" gap={3}>
          <Heading size="md" color="gray.800" fontWeight="800" letterSpacing="tight" noOfLines={2}>
            {title}
          </Heading>
          <Badge
            colorScheme={levelColorMap[level] || (status === 'ARCHIVED' ? 'gray' : 'learning')}
            borderRadius="full"
            px={3}
            py={1}
            fontSize="xs"
            fontWeight="bold"
            flexShrink={0}
          >
            {level}
          </Badge>
        </Flex>
        <Text noOfLines={3} color="gray.500" fontSize="sm" lineHeight="tall">
          {description}
        </Text>
        <HStack spacing={4} fontSize="xs" color="gray.400" fontWeight="medium">
          <Flex align="center" gap={1}>
            <Text>👥</Text>
            <Text>{learners.toLocaleString()} learners</Text>
          </Flex>
          {duration && (
            <Flex align="center" gap={1}>
              <Text>⏱</Text>
              <Text>{duration} mins</Text>
            </Flex>
          )}
        </HStack>
      </Stack>
      <Button
        mt={5}
        colorScheme="learning"
        size="sm"
        onClick={onEnroll}
        alignSelf="flex-start"
        borderRadius="lg"
      >
        Enroll now
      </Button>
    </Box>
  </motion.div>
);

export default CourseCard;
