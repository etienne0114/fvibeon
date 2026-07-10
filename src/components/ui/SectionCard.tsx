import { Box, useColorModeValue } from '@chakra-ui/react';

interface SectionCardProps {
  children: React.ReactNode;
  borderRadius?: string;
  background?: string;
  boxShadow?: string;
}

const SectionCard = ({ children, borderRadius = '2xl', background, boxShadow = 'premium' }: SectionCardProps) => {
  const bg = background || useColorModeValue('white', 'gray.800');
  return (
    <Box 
      bg={bg} 
      borderRadius={borderRadius} 
      boxShadow={boxShadow} 
      p={{ base: 4, md: 8 }}
      border="1px solid"
      borderColor={useColorModeValue('gray.100', 'gray.700')}
      transition="all 0.3s ease"
    >
      {children}
    </Box>
  );
};

export default SectionCard;
