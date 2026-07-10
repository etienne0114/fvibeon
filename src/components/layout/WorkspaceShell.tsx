import { 
  Box, Button, Divider, Flex, Heading, IconButton, 
  Spacer, Stack, Text, VStack, 
  useDisclosure, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader, DrawerBody,
  useBreakpointValue,
  Icon
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, ArrowLeftIcon, HamburgerIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type WorkspaceSection = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

interface WorkspaceShellProps {
  title?: string;
  subtitle?: string;
  sections: WorkspaceSection[];
  activeSection: string;
  onSectionChange: (section: string) => void;
  main: React.ReactNode;
  footer?: React.ReactNode;
  onLogout?: () => void;
}

const WorkspaceShell = ({
  title = 'Learn workspace',
  subtitle = 'Choose a panel to continue your journey',
  sections,
  activeSection,
  onSectionChange,
  main,
  onLogout,
}: WorkspaceShellProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const sidebarWidth = collapsed ? '80px' : '300px';

  const SidebarContent = () => (
    <VStack
      h="full"
      spacing={4}
      align="stretch"
      p={collapsed ? 2 : 6}
      bg="rgba(255, 255, 255, 0.6)"
      backdropFilter="blur(20px)"
      borderRight="1px solid"
      borderColor="gray.100"
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
    >
      <Flex align="center" justify={collapsed ? "center" : "space-between"} mb={4}>
        {!collapsed && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <Stack spacing={0}>
              <Heading size="sm" fontWeight="800" letterSpacing="tight" color="gray.800">
                {title}
              </Heading>
              <Text fontSize="xs" fontWeight="medium" color="gray.500">
                {subtitle}
              </Text>
            </Stack>
          </motion.div>
        )}
        {!isMobile && (
          <IconButton
            aria-label={collapsed ? 'Expand' : 'Collapse'}
            icon={collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            size="xs"
            variant="ghost"
            onClick={() => setCollapsed(!collapsed)}
            borderRadius="full"
            _hover={{ bg: 'learning.50', color: 'learning.600' }}
          />
        )}
      </Flex>

      <Stack spacing={2} flex={1}>
        {sections.map((section) => {
          const isActive = section.id === activeSection;
          return (
            <Button
              key={section.id}
              variant="ghost"
              justifyContent={collapsed ? "center" : "flex-start"}
              onClick={() => {
                onSectionChange(section.id);
                if (isMobile) onClose();
              }}
              h="auto"
              py={isActive ? 4 : 3}
              px={collapsed ? 0 : 4}
              bg={isActive ? 'white' : 'transparent'}
              boxShadow={isActive ? 'premium' : 'none'}
              _hover={{ 
                bg: isActive ? 'white' : 'learning.50',
                transform: 'translateX(4px)',
              }}
              transition="all 0.2s"
              borderRadius="xl"
              position="relative"
            >
              <Flex align="center" w="full">
                <Text fontSize="xl" mr={collapsed ? 0 : 3} filter={isActive ? 'none' : 'grayscale(100%)'}>
                  {section.icon}
                </Text>
                {!collapsed && (
                  <VStack align="flex-start" spacing={0} overflow="hidden">
                    <Text 
                      fontWeight={isActive ? "bold" : "medium"} 
                      color={isActive ? "learning.600" : "gray.700"}
                      fontSize="sm"
                    >
                      {section.title}
                    </Text>
                    <Text fontSize="xs" color="gray.400" fontWeight="normal" isTruncated maxW="180px">
                      {section.description}
                    </Text>
                  </VStack>
                )}
                {isActive && !collapsed && (
                  <Box 
                    position="absolute" 
                    right={2} 
                    w="4px" 
                    h="20px" 
                    bg="learning.500" 
                    borderRadius="full" 
                  />
                )}
              </Flex>
            </Button>
          );
        })}
      </Stack>

      <Divider opacity={0.5} />
      
      {!collapsed && (
        <Box px={2} py={2}>
          <Text fontSize="nx" color="gray.400" fontWeight="medium" lineHeight="short" style={{ fontSize: '10px' }}>
            Powered by Vibeon AI Multimodal Engine
          </Text>
        </Box>
      )}

      {onLogout && (
        <Button
          variant="ghost"
          colorScheme="gray"
          size="sm"
          leftIcon={<ArrowLeftIcon />}
          onClick={onLogout}
          justifyContent={collapsed ? "center" : "flex-start"}
          px={collapsed ? 0 : 4}
          borderRadius="xl"
          _hover={{ color: 'red.500', bg: 'red.50' }}
        >
          {!collapsed && "Logout"}
        </Button>
      )}
    </VStack>
  );

  return (
    <Flex h="full" flex={1} bg="gray.50" overflow="hidden">
      {/* Sidebar for Desktop */}
      {!isMobile && (
        <Box
          as="aside"
          w={sidebarWidth}
          transition="width 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          zIndex={10}
        >
          <SidebarContent />
        </Box>
      )}

      {/* Mobile Drawer Button and Sidebar */}
      {isMobile && (
        <>
          <IconButton
            aria-label="Open navigation"
            icon={<HamburgerIcon />}
            position="fixed"
            bottom={6}
            right={6}
            colorScheme="learning"
            borderRadius="full"
            size="lg"
            boxShadow="2xl"
            zIndex={2000}
            onClick={onOpen}
          />
          <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
            <DrawerOverlay backdropFilter="blur(4px)" />
            <DrawerContent bg="white" maxW="300px">
              <DrawerCloseButton />
              <DrawerHeader borderBottomWidth="1px" py={6}>
                 <Heading size="md" color="learning.600" fontWeight="800">
                  {title}
                </Heading>
              </DrawerHeader>
              <DrawerBody p={0}>
                <SidebarContent />
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        </>
      )}

      <Flex flex={1} direction="column" minH={0} overflow="hidden" position="relative">
        <Box 
          flex={1} 
          overflowY="auto" 
          py={{ base: 6, md: 10 }} 
          px={{ base: 4, md: 8 }}
          bg="gray.50"
        >
          <Box maxW="1200px" mx="auto" w="full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {main}
              </motion.div>
            </AnimatePresence>
          </Box>
        </Box>
      </Flex>
    </Flex>
  );
};

export default WorkspaceShell;
