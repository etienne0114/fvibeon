import {
  Box,
  Circle,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  Flex,
  HStack,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import {
  FiHome,
  FiBookOpen,
  FiGlobe,
  FiBookmark,
  FiHeadphones,
  FiTarget,
  FiAward,
  FiLogOut,
  FiChevronDown,
} from 'react-icons/fi';
import { ink, inkSoft, rose, cream, line, serif, roseTint, sageTint } from '../../theme/brand';

export interface HomeSection {
  id: string;
  title: string;
  icon: React.ElementType;
}

export const HOME_SECTIONS: HomeSection[] = [
  { id: 'dashboard', title: 'Dashboard', icon: FiHome },
  { id: 'courses', title: 'Courses', icon: FiBookOpen },
  { id: 'translator', title: 'Translator', icon: FiGlobe },
  { id: 'reading', title: 'Reading', icon: FiBookmark },
  { id: 'listening', title: 'Listening', icon: FiHeadphones },
  { id: 'practices', title: 'Practice', icon: FiTarget },
  { id: 'achievements', title: 'Achievements', icon: FiAward },
];

interface HomeShellProps {
  activeSection: string;
  onSectionChange: (id: string) => void;
  username?: string;
  streakDays?: number;
  onLogout?: () => void;
  children: React.ReactNode;
}

const NavItem = ({
  section,
  active,
  onClick,
}: {
  section: HomeSection;
  active: boolean;
  onClick: () => void;
}) => (
  <HStack
    as="button"
    onClick={onClick}
    spacing={3}
    px={4}
    py={3}
    borderRadius="xl"
    w="full"
    bg={active ? 'rgba(255,255,255,0.1)' : 'transparent'}
    color={active ? 'white' : '#B9A49A'}
    transition="all 0.15s ease"
    _hover={{ bg: 'rgba(255,255,255,0.08)', color: 'white' }}
    position="relative"
  >
    {active && (
      <Box position="absolute" left={0} top="20%" bottom="20%" w="3px" bg={rose} borderRadius="full" />
    )}
    <Icon as={section.icon} boxSize={4} />
    <Text fontSize="sm" fontWeight={active ? '700' : '500'}>
      {section.title}
    </Text>
  </HStack>
);

const HomeShell = ({ activeSection, onSectionChange, username, streakDays = 0, onLogout, children }: HomeShellProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const activeTitle = HOME_SECTIONS.find((s) => s.id === activeSection)?.title ?? 'Dashboard';

  const sidebar = (
    <Flex direction="column" h="full" bg={ink} p={5}>
      <Text fontFamily={serif} fontWeight="700" fontSize="xl" color="white" px={3} pt={2} pb={8}>
        Vibeon Learn
      </Text>
      <Stack spacing={1} flex={1}>
        {HOME_SECTIONS.map((section) => (
          <NavItem
            key={section.id}
            section={section}
            active={section.id === activeSection}
            onClick={() => {
              onSectionChange(section.id);
              onClose();
            }}
          />
        ))}
      </Stack>
      <HStack
        as="button"
        onClick={onLogout}
        spacing={3}
        px={4}
        py={3}
        borderRadius="xl"
        color="#B9A49A"
        _hover={{ bg: 'rgba(255,255,255,0.08)', color: 'white' }}
      >
        <Icon as={FiLogOut} boxSize={4} />
        <Text fontSize="sm" fontWeight="500">
          Sign out
        </Text>
      </HStack>
    </Flex>
  );

  return (
    <Flex minH="100vh" bg={cream} fontFamily='"Inter", system-ui, sans-serif'>
      {/* Desktop sidebar */}
      <Box w="240px" display={{ base: 'none', lg: 'block' }} position="fixed" top={0} bottom={0} left={0} zIndex={20}>
        {sidebar}
      </Box>

      {/* Mobile drawer */}
      <Drawer isOpen={isOpen} onClose={onClose} placement="left">
        <DrawerOverlay />
        <DrawerContent maxW="260px">
          <DrawerBody p={0}>{sidebar}</DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Main column */}
      <Flex direction="column" flex={1} ml={{ base: 0, lg: '240px' }} minW={0}>
        {/* Top bar */}
        <Flex
          as="header"
          align="center"
          justify="space-between"
          px={{ base: 4, md: 8 }}
          py={4}
          bg="rgba(251,243,233,0.92)"
          backdropFilter="blur(12px)"
          borderBottom="1px solid"
          borderColor={line}
          position="sticky"
          top={0}
          zIndex={10}
        >
          <HStack spacing={3}>
            <IconButton
              aria-label="Open menu"
              icon={<HamburgerIcon />}
              display={{ base: 'flex', lg: 'none' }}
              variant="ghost"
              color={ink}
              onClick={onOpen}
            />
            <Text fontFamily={serif} fontWeight="600" fontSize={{ base: 'lg', md: 'xl' }} color={ink}>
              {activeTitle}
            </Text>
          </HStack>
          <HStack spacing={{ base: 2, md: 4 }}>
            <HStack bg={sageTint} borderRadius="full" px={3} py={1.5} spacing={1.5}>
              <Text fontSize="sm">🔥</Text>
              <Text fontSize="sm" fontWeight="700" color={ink}>
                {streakDays}
              </Text>
              <Text fontSize="xs" color={inkSoft} display={{ base: 'none', sm: 'block' }}>
                day streak
              </Text>
            </HStack>
            <Menu>
              <MenuButton>
                <HStack spacing={2}>
                  <Circle size="34px" bg={roseTint} color={rose} fontWeight="700" fontSize="sm">
                    {(username || 'U').charAt(0).toUpperCase()}
                  </Circle>
                  <Text fontSize="sm" fontWeight="600" color={ink} display={{ base: 'none', md: 'block' }}>
                    {username || 'Learner'}
                  </Text>
                  <Icon as={FiChevronDown} boxSize={3.5} color={inkSoft} display={{ base: 'none', md: 'block' }} />
                </HStack>
              </MenuButton>
              <MenuList borderColor={line}>
                <MenuItem icon={<FiLogOut />} onClick={onLogout}>
                  Sign out
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>

        {/* Content */}
        <Box as="main" flex={1} px={{ base: 4, md: 8 }} py={{ base: 5, md: 8 }} maxW="1200px" w="full" mx="auto">
          {children}
        </Box>
      </Flex>
    </Flex>
  );
};

export default HomeShell;
