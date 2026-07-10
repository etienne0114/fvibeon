import { Box, Text, Stack } from '@chakra-ui/react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: string;
}

const EmptyState = ({ title, description, icon = '📭' }: EmptyStateProps) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
    <Box 
      textAlign="center" 
      py={12} 
      px={8}
      borderRadius="2xl" 
      borderWidth={1} 
      borderColor="gray.100" 
      bg="white"
      boxShadow="premium"
    >
      <Stack spacing={3} align="center">
        <Text fontSize="4xl">{icon}</Text>
        <Text fontWeight="800" fontSize="lg" color="gray.700" letterSpacing="tight">
          {title}
        </Text>
        {description && (
          <Text color="gray.400" fontSize="sm" maxW="320px" fontWeight="medium">
            {description}
          </Text>
        )}
      </Stack>
    </Box>
  </motion.div>
);

export default EmptyState;
