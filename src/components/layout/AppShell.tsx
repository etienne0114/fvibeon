import { 
  Box, Flex, Heading, HStack, 
  Input, InputGroup, InputLeftElement, 
  Avatar, IconButton, Text,
  useColorModeValue
} from '@chakra-ui/react';
import { SearchIcon, BellIcon } from '@chakra-ui/icons';

interface AppShellProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

const AppShell = ({
  title = 'Vibeon Learn Studio',
  children,
  actions,
}: AppShellProps) => {
  const bgColor = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)');
  const borderColor = useColorModeValue('gray.100', 'gray.700');

  return (
    <Flex h="100vh" bg="gray.50" direction="column" overflow="hidden">
      {/* Top Navbar with Glassmorphism */}
      <Flex 
        as="nav" 
        align="center" 
        justify="space-between" 
        wrap="wrap" 
        padding="0.75rem 2rem" 
        bg={bgColor} 
        backdropFilter="blur(12px)"
        color="gray.600" 
        borderBottom="1px solid"
        borderColor={borderColor}
        position="sticky"
        top="0"
        zIndex="1000"
        boxShadow="sm"
      >
        <Flex align="center">
          <Heading 
            as="h1" 
            size="md" 
            color="learning.600"
            fontWeight="800"
            letterSpacing="tighter"
          >
            {title}
          </Heading>
        </Flex>

        <Flex flex={1} justify="center" px={8} display={{ base: 'none', md: 'flex' }}>
          <InputGroup maxW="500px">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input 
              placeholder="Search courses, lessons, or exercises..." 
              bg="gray.100" 
              border="none"
              _focus={{ bg: 'white', boxShadow: 'premium', border: '1px solid', borderColor: 'learning.200' }}
            />
          </InputGroup>
        </Flex>

        <HStack spacing={4}>
          {actions}
          <Box position="relative">
            <IconButton
              aria-label="Notifications"
              icon={<BellIcon />}
              variant="ghost"
              size="md"
              borderRadius="full"
              _hover={{ bg: 'learning.50' }}
            />
            <Box
              position="absolute"
              top="8px"
              right="8px"
              w="8px"
              h="8px"
              bg="learning.500"
              borderRadius="full"
              border="2px solid white"
            />
          </Box>
          <Box borderLeft="1px solid" borderColor="gray.200" pl={4} ml={2}>
            <Avatar 
              size="sm" 
              name="User" 
              src="https://bit.ly/broken-link" 
              bg="learning.500"
              color="white"
            />
          </Box>
        </HStack>
      </Flex>

      <Box flex={1} minH={0} w="full" display="flex" flexDirection="column" overflow="hidden">
        {children}
      </Box>
    </Flex>
  );
};

export default AppShell;
