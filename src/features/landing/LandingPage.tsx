import {
  Box,
  Button,
  Circle,
  Container,
  Flex,
  Grid,
  HStack,
  Icon,
  IconButton,
  Link,
  SimpleGrid,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { CheckIcon, HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import {
  FiMessageCircle,
  FiGlobe,
  FiTarget,
  FiBarChart2,
  FiAward,
  FiVolume2,
  FiShield,
  FiPlay,
  FiZap,
} from 'react-icons/fi';

// Warm editorial palette (landing only — independent from the app theme)
const ink = '#2E1F26';
const inkSoft = '#5C4A52';
const rose = '#D9536F';
const roseDeep = '#C24560';
const cream = '#FBF3E9';
const creamDeep = '#F4E7D3';
const card = '#F8EDDE';
const line = '#E9D9C5';
const sage = '#7FA99B';
const amber = '#E9B36B';

const serif = '"Fraunces", Georgia, serif';

interface LandingPageProps {
  onOpenApp: () => void;
}

const NavLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
  <Link
    href={href}
    color={inkSoft}
    fontSize="sm"
    fontWeight="500"
    _hover={{ color: ink, textDecoration: 'none' }}
  >
    {children}
  </Link>
);

const PillButton = ({
  children,
  variant = 'dark',
  onClick,
  size = 'md',
}: {
  children: React.ReactNode;
  variant?: 'dark' | 'ghost';
  onClick?: () => void;
  size?: 'md' | 'lg';
}) => (
  <Button
    onClick={onClick}
    borderRadius="full"
    px={size === 'lg' ? 7 : 5}
    h={size === 'lg' ? '52px' : '40px'}
    fontSize={size === 'lg' ? 'md' : 'sm'}
    fontWeight="600"
    bg={variant === 'dark' ? ink : 'transparent'}
    color={variant === 'dark' ? cream : ink}
    border="1px solid"
    borderColor={variant === 'dark' ? ink : line}
    _hover={{
      bg: variant === 'dark' ? '#463039' : 'rgba(46,31,38,0.05)',
      transform: 'translateY(-1px)',
    }}
  >
    {children}
  </Button>
);

const SectionEyebrow = ({ children }: { children: React.ReactNode }) => (
  <Text
    color={rose}
    fontSize="xs"
    fontWeight="700"
    letterSpacing="0.2em"
    textTransform="uppercase"
    textAlign="center"
  >
    {children}
  </Text>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Text
    as="h2"
    fontFamily={serif}
    fontWeight="600"
    fontSize={{ base: '3xl', md: '5xl' }}
    color={ink}
    textAlign="center"
    lineHeight="1.1"
  >
    {children}
  </Text>
);

const FeatureCard = ({
  icon,
  tile,
  title,
  body,
}: {
  icon: React.ElementType;
  tile: string;
  title: string;
  body: string;
}) => (
  <Box
    bg={card}
    border="1px solid"
    borderColor={line}
    borderRadius="2xl"
    p={{ base: 6, md: 8 }}
    transition="transform 0.2s ease, box-shadow 0.2s ease"
    _hover={{ transform: 'translateY(-4px)', boxShadow: '0 16px 32px rgba(46,31,38,0.08)' }}
  >
    <Flex
      w="52px"
      h="52px"
      align="center"
      justify="center"
      borderRadius="xl"
      bg={tile}
      color="white"
      mb={6}
      boxShadow={`0 6px 0 ${creamDeep}`}
    >
      <Icon as={icon} boxSize={5} />
    </Flex>
    <Text fontFamily={serif} fontWeight="600" fontSize="xl" color={ink} mb={2}>
      {title}
    </Text>
    <Text color={inkSoft} fontSize="sm" lineHeight="1.7">
      {body}
    </Text>
  </Box>
);

const FloatingCard = ({
  icon,
  tile,
  title,
  sub,
  ...pos
}: {
  icon: React.ElementType;
  tile: string;
  title: string;
  sub: string;
  [key: string]: unknown;
}) => (
  <HStack
    position="absolute"
    bg="white"
    borderRadius="xl"
    boxShadow="0 12px 32px rgba(46,31,38,0.14)"
    px={4}
    py={3}
    spacing={3}
    display={{ base: 'none', lg: 'flex' }}
    {...pos}
  >
    <Flex w="38px" h="38px" align="center" justify="center" borderRadius="lg" bg={tile} color="white">
      <Icon as={icon} boxSize={4} />
    </Flex>
    <Box>
      <Text fontSize="sm" fontWeight="700" color={ink} lineHeight="1.2">
        {title}
      </Text>
      <Text fontSize="xs" color={inkSoft}>
        {sub}
      </Text>
    </Box>
  </HStack>
);

const PhoneMockup = () => (
  <Box
    w={{ base: '280px', md: '320px' }}
    mx="auto"
    bg="white"
    border="10px solid"
    borderColor={ink}
    borderRadius="42px"
    boxShadow="0 32px 64px rgba(46,31,38,0.18)"
    overflow="hidden"
  >
    <Box p={4} bg="#FFFDFa">
      <HStack spacing={3} mb={4}>
        <Circle size="36px" bg={rose} color="white" fontWeight="700" fontSize="sm">
          E
        </Circle>
        <Box>
          <Text fontSize="sm" fontWeight="700" color={ink}>
            Muraho, Etienne 👋
          </Text>
          <Text fontSize="xs" color={inkSoft}>
            Ready to learn?
          </Text>
        </Box>
      </HStack>

      <Box bg={roseDeep} borderRadius="2xl" p={4} mb={3} color="white">
        <Text fontSize="10px" fontWeight="700" letterSpacing="0.12em" opacity={0.85}>
          CONTINUE LEARNING
        </Text>
        <Text fontWeight="700" fontSize="md" mt={1}>
          Kinyarwanda basics 101
        </Text>
        <Box mt={3} h="6px" bg="rgba(255,255,255,0.3)" borderRadius="full">
          <Box w="68%" h="full" bg="white" borderRadius="full" />
        </Box>
      </Box>

      <Grid templateColumns="1fr 1fr" gap={3} mb={3}>
        <Box bg="#EAF2EE" borderRadius="xl" p={3} textAlign="center">
          <Text fontSize="lg">🔥</Text>
          <Text fontWeight="700" color={ink} fontSize="sm">
            4-day streak
          </Text>
        </Box>
        <Box bg="white" border="1px solid" borderColor={line} borderRadius="xl" p={3} textAlign="center">
          <Text fontSize="lg">🎯</Text>
          <Text fontWeight="700" color={ink} fontSize="sm">
            Daily drill
          </Text>
        </Box>
      </Grid>

      <HStack bg="#FBE3E9" borderRadius="xl" p={3} mb={3} spacing={3}>
        <Circle size="34px" bg={rose} color="white">
          <Icon as={FiMessageCircle} boxSize={4} />
        </Circle>
        <Box>
          <Text fontSize="9px" fontWeight="700" color={roseDeep} letterSpacing="0.1em">
            AI TUTOR · ONLINE
          </Text>
          <Text fontSize="sm" fontWeight="600" color={ink}>
            Ask me anything
          </Text>
        </Box>
      </HStack>

      <HStack bg={card} borderRadius="xl" p={3} spacing={3}>
        <Circle size="34px" bg={amber} color="white">
          <Icon as={FiGlobe} boxSize={4} />
        </Circle>
        <Box>
          <Text fontSize="9px" fontWeight="700" color="#B4823D" letterSpacing="0.1em">
            TRANSLATOR · RW EN FR
          </Text>
          <Text fontSize="sm" fontWeight="600" color={ink}>
            "Amahoro" → "Peace"
          </Text>
        </Box>
      </HStack>
    </Box>
  </Box>
);

const LandingPage = ({ onOpenApp }: LandingPageProps) => {
  const { isOpen, onToggle } = useDisclosure();

  const navLinks = (
    <>
      <NavLink href="#features">Features</NavLink>
      <NavLink href="#practice">Practice</NavLink>
      <NavLink href="#tutor">AI Tutor</NavLink>
      <NavLink href="#community">Community</NavLink>
    </>
  );

  return (
    <Box bg={cream} minH="100vh" fontFamily='"Inter", system-ui, sans-serif' overflowX="hidden">
      {/* ============ NAV ============ */}
      <Container maxW="7xl" py={5}>
        <Flex align="center" justify="space-between">
          <Text fontFamily={serif} fontWeight="700" fontSize="2xl" color={ink}>
            Vibeon Learn
          </Text>
          <HStack spacing={8} display={{ base: 'none', md: 'flex' }}>
            {navLinks}
            <PillButton onClick={onOpenApp}>Open the app</PillButton>
          </HStack>
          <IconButton
            aria-label="Toggle menu"
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            display={{ base: 'flex', md: 'none' }}
            variant="ghost"
            color={ink}
            onClick={onToggle}
          />
        </Flex>
        {isOpen && (
          <Stack
            display={{ base: 'flex', md: 'none' }}
            mt={4}
            spacing={4}
            bg="white"
            borderRadius="2xl"
            border="1px solid"
            borderColor={line}
            p={6}
          >
            {navLinks}
            <PillButton onClick={onOpenApp}>Open the app</PillButton>
          </Stack>
        )}
      </Container>

      {/* ============ HERO ============ */}
      <Container maxW="7xl" pt={{ base: 8, md: 14 }} pb={{ base: 14, md: 24 }}>
        <Grid templateColumns={{ base: '1fr', lg: '1.1fr 1fr' }} gap={{ base: 14, lg: 8 }} alignItems="center">
          <Stack spacing={7} maxW="640px">
            <HStack
              bg="white"
              border="1px solid"
              borderColor={line}
              borderRadius="full"
              px={4}
              py={2}
              w="fit-content"
              spacing={2}
            >
              <Circle size="8px" bg="#3BA55D" />
              <Text fontSize="sm" fontWeight="500" color={ink}>
                Now live for learners in Rwanda
              </Text>
            </HStack>

            <Text
              as="h1"
              fontFamily={serif}
              fontWeight="600"
              fontSize={{ base: '4xl', sm: '5xl', md: '6xl' }}
              lineHeight="1.05"
              color={ink}
            >
              Learn a language,{' '}
              <Box as="span" display="block">
                with{' '}
                <Box as="span" fontStyle="italic" color={rose}>
                  your AI tutor
                </Box>
                .
              </Box>
            </Text>

            <Text color={inkSoft} fontSize={{ base: 'md', md: 'lg' }} lineHeight="1.8" maxW="480px">
              Vibeon Learn makes language learning clear, personal, and fun — through an AI tutor,
              instant translation, hands-on practice drills, and progress you can actually see.
            </Text>

            <Stack direction={{ base: 'column', sm: 'row' }} spacing={4}>
              <PillButton size="lg" onClick={onOpenApp}>
                Start learning — it's free
              </PillButton>
              <PillButton size="lg" variant="ghost" onClick={onOpenApp}>
                <Icon as={FiPlay} mr={2} /> Try the translator
              </PillButton>
            </Stack>

            <Stack
              direction={{ base: 'column', sm: 'row' }}
              spacing={{ base: 2, sm: 6 }}
              color={inkSoft}
              fontSize="sm"
              pt={2}
            >
              <HStack spacing={2}>
                <Icon as={FiShield} />
                <Text>Private by default</Text>
              </HStack>
              <HStack spacing={2}>
                <CheckIcon boxSize={3} color={sage} />
                <Text>Learn at your own pace</Text>
              </HStack>
              <HStack spacing={2}>
                <Icon as={FiGlobe} color={sage} />
                <Text>RW · EN · FR</Text>
              </HStack>
            </Stack>
          </Stack>

          <Box position="relative" py={{ base: 0, lg: 10 }}>
            <PhoneMockup />
            <FloatingCard
              icon={FiVolume2}
              tile={sage}
              title="Voice narration"
              sub="Listen & repeat"
              top="6%"
              left="-4%"
            />
            <FloatingCard
              icon={FiGlobe}
              tile={rose}
              title="Instant translator"
              sub="Kinyarwanda · English · French"
              bottom="22%"
              right="-6%"
            />
            <FloatingCard
              icon={FiZap}
              tile={amber}
              title="86% accuracy"
              sub="Quiz streak"
              bottom="2%"
              left="0%"
            />
          </Box>
        </Grid>
      </Container>

      {/* ============ STATS BAND ============ */}
      <Box bg={creamDeep} borderY="1px solid" borderColor={line}>
        <Container maxW="7xl" py={{ base: 10, md: 14 }}>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 8, md: 4 }}>
            {[
              { big: '6', label: 'Practice modes' },
              { big: '3', label: 'Languages supported' },
              { big: '24/7', label: 'AI tutor, always on' },
              { big: '100%', label: 'Free to learn' },
            ].map((s) => (
              <Box key={s.label} textAlign="center">
                <Text fontFamily={serif} fontWeight="600" fontSize={{ base: '4xl', md: '5xl' }} color={rose}>
                  {s.big}
                </Text>
                <Text color={inkSoft} fontSize="sm" mt={1}>
                  {s.label}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* ============ FEATURES ============ */}
      <Container maxW="7xl" py={{ base: 16, md: 24 }} id="features">
        <Stack spacing={4} mb={{ base: 10, md: 16 }}>
          <SectionEyebrow>Why Vibeon Learn</SectionEyebrow>
          <SectionTitle>Learning that actually sticks.</SectionTitle>
          <Text color={inkSoft} textAlign="center" maxW="560px" mx="auto" lineHeight="1.8">
            Most language apps are flashcards no one finishes. Vibeon turns learning into something
            you can speak, hear, practice, and measure.
          </Text>
        </Stack>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={{ base: 5, md: 7 }} id="practice">
          <FeatureCard
            icon={FiMessageCircle}
            tile={rose}
            title="AI tutor chat"
            body="Ask anything, anytime. Your personal tutor explains grammar, corrects mistakes, and adapts to how you learn best."
          />
          <FeatureCard
            icon={FiGlobe}
            tile={sage}
            title="Instant translator"
            body="Translate text, documents, images, and even live speech between Kinyarwanda, English, and French — powered by vibeon_translator."
          />
          <FeatureCard
            icon={FiTarget}
            tile={amber}
            title="Practice drills"
            body="Vocabulary sprints, quizzes, roleplay conversations, and grammar correction — six modes that keep practice fresh."
          />
          <FeatureCard
            icon={FiBarChart2}
            tile={ink}
            title="Progress dashboard"
            body="See your learning analytics at a glance: streaks, accuracy, time studied, and the skills that need attention."
          />
          <FeatureCard
            icon={FiAward}
            tile={roseDeep}
            title="Achievements & streaks"
            body="Milestones worth celebrating. Keep your daily streak alive and unlock badges as your skills grow."
          />
          <FeatureCard
            icon={FiVolume2}
            tile="#C99A5B"
            title="Voice & listening"
            body="Hear native-style pronunciation with built-in text-to-speech, then practice speaking and listening in real time."
          />
        </SimpleGrid>
      </Container>

      {/* ============ TUTOR / COMMUNITY ============ */}
      <Box bg={creamDeep} borderY="1px solid" borderColor={line} id="tutor">
        <Container maxW="7xl" py={{ base: 16, md: 24 }}>
          <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={{ base: 12, lg: 16 }} alignItems="center">
            {/* Chat mockup */}
            <Box
              bg="white"
              borderRadius="2xl"
              boxShadow="0 24px 48px rgba(46,31,38,0.12)"
              p={{ base: 5, md: 7 }}
              maxW="560px"
              w="full"
              mx="auto"
            >
              <Flex justify="space-between" align="center" mb={5} pb={4} borderBottom="1px solid" borderColor={line}>
                <HStack spacing={3}>
                  <Circle size="40px" bg="#FBE3E9" fontSize="lg">
                    🌸
                  </Circle>
                  <Box>
                    <Text fontFamily={serif} fontWeight="600" color={ink}>
                      Tutor chat
                    </Text>
                    <Text fontSize="xs" color={inkSoft}>
                      Kinyarwanda practice · AI tutor
                    </Text>
                  </Box>
                </HStack>
                <HStack bg={creamDeep} borderRadius="full" px={3} py={1} spacing={2}>
                  <Circle size="6px" bg="#3BA55D" />
                  <Text fontSize="xs" color={inkSoft}>
                    online
                  </Text>
                </HStack>
              </Flex>

              <Stack spacing={3}>
                <Box bg="#FBE3E9" borderRadius="xl" p={4} maxW="85%">
                  <Text fontSize="xs" fontWeight="700" color={roseDeep} mb={1}>
                    You
                  </Text>
                  <Text fontSize="sm" color={ink}>
                    How do I say "I am learning slowly but every day" in Kinyarwanda?
                  </Text>
                </Box>
                <Box bg="#EAF2EE" borderRadius="xl" p={4} maxW="85%">
                  <Text fontSize="xs" fontWeight="700" color="#4E7A6A" mb={1}>
                    Vibeon Tutor ✓
                  </Text>
                  <Text fontSize="sm" color={ink}>
                    "Niga buhoro buhoro ariko buri munsi." — buhoro buhoro means "slowly", and it's a
                    lovely proverb-like phrase. Want to practice pronouncing it?
                  </Text>
                </Box>
                <Box bg={ink} color="white" borderRadius="xl" p={4} maxW="75%" alignSelf="flex-end">
                  <Text fontSize="sm">Murakoze! Yes — play the audio for me 🔊</Text>
                </Box>
              </Stack>
            </Box>

            {/* Copy */}
            <Stack spacing={6} id="community">
              <Text
                color={rose}
                fontSize="xs"
                fontWeight="700"
                letterSpacing="0.2em"
                textTransform="uppercase"
              >
                Your personal tutor
              </Text>
              <Text
                as="h2"
                fontFamily={serif}
                fontWeight="600"
                fontSize={{ base: '3xl', md: '5xl' }}
                color={ink}
                lineHeight="1.1"
              >
                You're never learning alone.
              </Text>
              <Text color={inkSoft} lineHeight="1.8" maxW="480px">
                Ask anything without embarrassment, roleplay real conversations, and get corrections
                that explain the why — your AI tutor is patient, private, and available around the
                clock.
              </Text>
              <Stack spacing={4} pt={2}>
                {[
                  { icon: FiMessageCircle, tile: rose, label: 'Ask the tutor anything, anytime' },
                  { icon: FiTarget, tile: amber, label: 'Roleplay real-life conversations' },
                  { icon: FiBarChart2, tile: sage, label: 'Watch your streaks and skills grow' },
                ].map((item) => (
                  <HStack key={item.label} spacing={4}>
                    <Flex w="40px" h="40px" align="center" justify="center" borderRadius="lg" bg={item.tile} color="white">
                      <Icon as={item.icon} boxSize={4} />
                    </Flex>
                    <Text fontWeight="600" color={ink}>
                      {item.label}
                    </Text>
                  </HStack>
                ))}
              </Stack>
            </Stack>
          </Grid>
        </Container>
      </Box>

      {/* ============ CTA ============ */}
      <Box bgGradient="linear(to-b, #F9DEE5, #FBF3E9)">
        <Container maxW="4xl" py={{ base: 20, md: 28 }} textAlign="center">
          <Text
            as="h2"
            fontFamily={serif}
            fontWeight="600"
            fontSize={{ base: '4xl', md: '6xl' }}
            color={ink}
            lineHeight="1.1"
            mb={6}
          >
            Your words. Your pace.
            <Box as="span" display="block">
              Your language.
            </Box>
          </Text>
          <Text color={inkSoft} fontSize={{ base: 'md', md: 'lg' }} maxW="520px" mx="auto" mb={10} lineHeight="1.8">
            Join learners across Rwanda building real language skills — privately, confidently, and
            for free.
          </Text>
          <Stack direction={{ base: 'column', sm: 'row' }} spacing={4} justify="center">
            <PillButton size="lg" onClick={onOpenApp}>
              Open Vibeon Learn
            </PillButton>
            <PillButton size="lg" variant="ghost" onClick={onOpenApp}>
              Explore the courses
            </PillButton>
          </Stack>
        </Container>
      </Box>

      {/* ============ FOOTER ============ */}
      <Box bg={ink} color="#D8C7BC">
        <Container maxW="7xl" py={{ base: 12, md: 16 }}>
          <Grid templateColumns={{ base: '1fr', md: '1.4fr 1fr 1fr 1fr' }} gap={{ base: 10, md: 8 }}>
            <Stack spacing={4} maxW="280px">
              <Text fontFamily={serif} fontWeight="700" fontSize="xl" color="white">
                Vibeon Learn
              </Text>
              <Text fontSize="sm" lineHeight="1.7">
                Interactive, AI-powered language learning for Kinyarwanda, English, and French —
                built for learners in Rwanda.
              </Text>
            </Stack>
            {[
              {
                title: 'Product',
                links: ['Features', 'Courses', 'Translator', 'Web app'],
              },
              {
                title: 'Practice',
                links: ['Vocabulary drills', 'Quizzes', 'Roleplay', 'AI tutor chat'],
              },
              {
                title: 'Support',
                links: ['Getting started', 'Privacy', 'Contact'],
              },
            ].map((col) => (
              <Stack key={col.title} spacing={3}>
                <Text
                  fontSize="xs"
                  fontWeight="700"
                  letterSpacing="0.15em"
                  textTransform="uppercase"
                  color={amber}
                >
                  {col.title}
                </Text>
                {col.links.map((l) => (
                  <Link key={l} fontSize="sm" _hover={{ color: 'white', textDecoration: 'none' }}>
                    {l}
                  </Link>
                ))}
              </Stack>
            ))}
          </Grid>
          <Flex
            mt={12}
            pt={6}
            borderTop="1px solid rgba(255,255,255,0.12)"
            direction={{ base: 'column', sm: 'row' }}
            justify="space-between"
            gap={3}
            fontSize="sm"
          >
            <Text>© 2026 Vibeon Learn · Built for learners in Rwanda</Text>
            <Text>Kinyarwanda · English · Français</Text>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
