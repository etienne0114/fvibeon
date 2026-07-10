import { Stack, Text, Box, useColorModeValue, Flex, Icon } from '@chakra-ui/react';
import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: string | number;
  helper?: string;
  accent?: string;
  icon?: any;
}

const StatCard = ({ label, value, helper, accent = 'learning.500', icon }: StatCardProps) => (
  <motion.div
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
  >
    <Box
      borderRadius="2xl"
      p={6}
      bg={useColorModeValue('white', 'gray.800')}
      borderWidth={1}
      borderColor={useColorModeValue('gray.50', 'gray.700')}
      boxShadow="premium"
      position="relative"
      overflow="hidden"
      transition="all 0.3s ease"
    >
      <Flex align="center" mb={4}>
        {icon && (
          <Flex 
            w={10} 
            h={10} 
            bg={`${accent.split('.')[0]}.50`} 
            color={accent} 
            borderRadius="xl" 
            align="center" 
            justify="center"
            mr={3}
          >
            <Icon as={icon} fontSize="xl" />
          </Flex>
        )}
        <Text fontSize="sm" fontWeight="bold" color="gray.500" letterSpacing="tight">
          {label}
        </Text>
      </Flex>
      
      <Stack spacing={0}>
        <Text fontSize="3xl" fontWeight="900" color="gray.800" letterSpacing="tighter">
          {value}
        </Text>
        {helper && (
          <Text fontSize="xs" fontWeight="medium" color="gray.400">
            {helper}
          </Text>
        )}
      </Stack>
      
      <Box 
        position="absolute" 
        bottom={-2} 
        right={-2} 
        w="48px" 
        h="48px" 
        bg={accent}
        borderRadius="full"
        opacity={0.08}
      />
    </Box>
  </motion.div>
);

export default StatCard;
