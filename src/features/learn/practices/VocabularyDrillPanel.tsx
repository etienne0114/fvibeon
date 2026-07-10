import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Center,
  Divider,
  Flex,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Skeleton,
  SkeletonText,
  Stack,
  Tag,
  Text,
  Tooltip,
  useColorModeValue,
  VStack,
  Wrap,
  WrapItem,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Image,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
} from '@chakra-ui/react';
import {
  MdArrowBackIos,
  MdArrowForwardIos,
  MdContentCopy,
  MdGTranslate,
  MdMenuBook,
  MdMic,
  MdRefresh,
  MdSearch,
  MdVolumeUp,
  MdCheckCircle,
  MdError,
  MdDelete,
} from 'react-icons/md';
import { useDictionary, useVocabularyDrill } from '../../../hooks';
import { VocabularyEntry } from '../../../api/practice';
import VocabularyEntryDetail from './components/VocabularyEntryDetail';
import { DictionaryDefinition } from '../../../api/dictionary';

const translationLanguages = [
  { code: 'en', label: 'English', flag: 'https://flagcdn.com/w40/us.png' },
  { code: 'rw', label: 'Kinyarwanda', flag: 'https://flagcdn.com/w40/rw.png' },
  { code: 'fr', label: 'French', flag: 'https://flagcdn.com/w40/fr.png' },
  { code: 'es', label: 'Spanish', flag: 'https://flagcdn.com/w40/es.png' },
];

const VocabularyDrillPanel = () => {
  const {
    dailyEntry,
    queue,
    stats,
    isLoading,
    isSubmitting,
    error,
    submitResult,
    refresh,
    language: drillLanguage,
  } = useVocabularyDrill();
  
  const { lookup, setQuery, definition, translateEntry, isLoading: isDictLoading } = useDictionary();
  const [translatedDefinition, setTranslatedDefinition] = useState<DictionaryDefinition | null>(null);

  const { isOpen: isTransOpen, onOpen: onTransOpen, onClose: onTransClose } = useDisclosure();
  const { isOpen: isDictOpen, onOpen: onDictOpen, onClose: onDictClose } = useDisclosure();
  const [flipped, setFlipped] = useState(false);
  const [selectedWord, setSelectedWord] = useState<VocabularyEntry | null>(null);
  const [search, setSearch] = useState('');
  const [recentSearches, setRecentSearches] = useState<VocabularyEntry[]>(() => {
    const saved = localStorage.getItem('vibeon_recent_searches');
    return saved ? JSON.parse(saved) : [];
  });
  const [autoSelectEnabled, setAutoSelectEnabled] = useState(true);
  const [translationLanguage, setTranslationLanguage] = useState('rw');

  useEffect(() => {
    localStorage.setItem('vibeon_recent_searches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  const panelBg = useColorModeValue('white', 'gray.900');
  const sidebarBg = useColorModeValue('learning.50', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('learning.100', 'gray.700');
  const iconColor = useColorModeValue('gray.400', 'gray.500');
  const activeIconColor = 'learning.400';
  const accentColor = 'learning.400';

  useEffect(() => {
    if (dailyEntry && autoSelectEnabled) {
      setSelectedWord(dailyEntry);
      return;
    }
    if (autoSelectEnabled && queue.length && !selectedWord) {
      setSelectedWord(queue[0]);
    }
  }, [autoSelectEnabled, dailyEntry, queue, selectedWord]);

  useEffect(() => {
    if (selectedWord) {
      setQuery(selectedWord.word);
      lookup(selectedWord.word, selectedWord.language || 'en');
      setTranslatedDefinition(null);
    }
  }, [selectedWord, lookup, setQuery]);

  const filteredQueue = useMemo(() => {
    if (!search) return queue;
    return queue.filter((item) => item.word.toLowerCase().includes(search.toLowerCase()));
  }, [queue, search]);

  const handleSearch = async (queryOverride?: string) => {
    const queryToUse = queryOverride || search;
    if (!queryToUse.trim()) return;
    
    try {
      await lookup(queryToUse, drillLanguage);
    } catch (e) {
      console.error(e);
    }
  };

  // Update selected word when definition changes from search
  useEffect(() => {
    if (definition && search && definition.word.toLowerCase() === search.toLowerCase()) {
      const newEntry: VocabularyEntry = {
        vocabularyItemId: `search-${definition.word}`,
        word: definition.word,
        definition: definition.meanings?.[0]?.definitions?.[0]?.definition || '',
        partOfSpeech: definition.meanings?.[0]?.partOfSpeech || 'noun',
        language: drillLanguage,
        isNew: true,
        difficulty: 1,
        examples: definition.meanings?.[0]?.definitions?.[0]?.example ? [definition.meanings[0].definitions[0].example] : [],
        masteryLevel: 0,
        streak: 0,
        nextReviewAt: new Date().toISOString(),
      };
      
      setSelectedWord(newEntry);
      
      setRecentSearches(prev => {
        const filtered = prev.filter(item => item.word.toLowerCase() !== newEntry.word.toLowerCase());
        return [newEntry, ...filtered].slice(0, 10);
      });
      
      setSearch(''); 
    }
  }, [definition, drillLanguage]);

  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  const selectCard = (item: VocabularyEntry) => {
    setAutoSelectEnabled(false);
    setSelectedWord(item);
    setFlipped(false);
  };

  const navigateCard = (direction: -1 | 1) => {
    if (!selectedWord || !queue.length) return;
    const currentIndex = queue.findIndex((item) => item.vocabularyItemId === selectedWord.vocabularyItemId);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + direction + queue.length) % queue.length;
    selectCard(queue[nextIndex]);
  };

  const handleSubmit = (correct: boolean) => {
    if (!selectedWord) return;
    submitResult(selectedWord.vocabularyItemId, correct);
    if (correct) {
      setTimeout(() => navigateCard(1), 500);
    }
  };

  const handleTranslateAll = async () => {
    if (!definition) return;
    const trans = await translateEntry(definition, translationLanguage);
    if (trans) {
      setTranslatedDefinition(trans);
    }
  };

  const handleSpeech = () => {
    if (!selectedWord) return;
    const utterance = new SpeechSynthesisUtterance(selectedWord.word);
    utterance.lang = selectedWord.language === 'rw' ? 'sw-TZ' : 'en-US'; 
    window.speechSynthesis.speak(utterance);
  };

  const statsText = stats 
    ? `Accuracy ${stats.accuracy}% · Mastered ${stats.mastered}/${stats.totalWords}`
    : 'Loading stats...';

  return (
    <Box background={panelBg} borderRadius="3xl" p={0} overflow="hidden" boxShadow="none">
      <Flex h="auto" minH="700px" direction={{ base: 'column', lg: 'row' }}>
        {/* Left Sidebar - Queue & Navigation */}
        <VStack
          w={{ base: 'full', lg: '320px' }}
          bg={sidebarBg}
          p={6}
          spacing={6}
          align="stretch"
          borderRightWidth={1}
          borderColor={borderColor}
        >
          <Flex justify="space-between" align="center">
            <VStack align="left" spacing={0}>
              <Text fontSize="xl" fontWeight="bold" color="gray.800">
                Vocabulary
              </Text>
            </VStack>
          </Flex>

          <InputGroup size="md">
            <InputLeftElement pointerEvents="none">
              <MdSearch color="gray.400" size="20px" />
            </InputLeftElement>
            <Input
              placeholder="Search dictionary..."
              bg="white"
              borderRadius="xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              _focus={{ borderColor: 'learning.400', boxShadow: '0 0 0 1px #ed64a6' }}
            />
          </InputGroup>

          <VStack align="stretch" spacing={2} overflowY="auto" flex={1} pr={1} sx={{
            '&::-webkit-scrollbar': { width: '4px' },
            '&::-webkit-scrollbar-thumb': { bg: 'learning.100', borderRadius: 'full' }
          }}>
            <Text fontSize="xs" fontWeight="bold" color="gray.400" mt={2} mb={1}>
              DAILY DRILL
            </Text>
            {(isLoading || isDictLoading) && (!queue.length && !recentSearches.length) ? (
              [1, 2, 3].map((i) => <Skeleton key={i} h="50px" borderRadius="lg" />)
            ) : filteredQueue.length > 0 ? (
              filteredQueue.map((item) => (
                <DrillItem 
                  key={item.vocabularyItemId} 
                  item={item} 
                  isSelected={selectedWord?.vocabularyItemId === item.vocabularyItemId}
                  onClick={() => selectCard(item)}
                />
              ))
            ) : (
              <Text fontSize="2xs" color="gray.400" textAlign="center" py={2}>No drill items</Text>
            )}

            <Flex justify="space-between" align="center" mt={4} mb={1}>
              <Text fontSize="xs" fontWeight="bold" color="gray.400">
                RECENT SEARCHES
              </Text>
              {recentSearches.length > 0 && (
                <IconButton
                  aria-label="Clear history"
                  icon={<MdDelete />}
                  size="xs"
                  variant="ghost"
                  colorScheme="gray"
                  onClick={clearRecentSearches}
                />
              )}
            </Flex>
            {recentSearches.length > 0 ? (
              recentSearches.map((item) => (
                <DrillItem 
                  key={`recent-${item.word}`} 
                  item={item} 
                  isSelected={selectedWord?.word === item.word}
                  onClick={() => selectCard(item)}
                />
              ))
            ) : (
              <Text fontSize="2xs" color="gray.400" textAlign="center" py={2}>No recent searches</Text>
            )}
          </VStack>

          <Box pt={2}>
            <Text fontSize="2xs" color="learning.400" fontWeight="bold" mb={1}>
              OVERALL PROGRESS
            </Text>
            <Skeleton isLoaded={!!stats}>
              <Text fontSize="xs" color="gray.600">
                {statsText}
              </Text>
            </Skeleton>
          </Box>
        </VStack>

        {/* Main Content Area */}
        <Flex flex={1} direction="column" bg="white" p={6} overflowY="auto">
          <Flex justify="space-between" align="center" mb={10}>
            <HStack spacing={4}>
              <IconButton
                aria-label="Back"
                icon={<MdArrowBackIos />}
                variant="ghost"
                onClick={() => navigateCard(-1)}
                isDisabled={!selectedWord}
              />
              <VStack align="left" spacing={0}>
                <Skeleton isLoaded={!isDictLoading && (!!definition || !!selectedWord)}>
                  <Text fontSize="2xl" fontWeight="extrabold" color="gray.800">
                    {selectedWord?.word || definition?.word || 'Select a word'}
                  </Text>
                  <Text fontSize="sm" color="gray.400">
                    {definition?.phonetic || (selectedWord?.partOfSpeech || '—')}
                  </Text>
                </Skeleton>
              </VStack>
            </HStack>

            <HStack spacing={1}>
              <Tooltip label="Translate All Details">
                <IconButton 
                  aria-label="Translate All" 
                  icon={<MdGTranslate />} 
                  variant="ghost" 
                  color={translatedDefinition ? activeIconColor : iconColor} 
                  _hover={{ color: activeIconColor }} 
                  onClick={handleTranslateAll} 
                  isLoading={isDictLoading}
                />
              </Tooltip>
              <Tooltip label="Translation Target">
                <IconButton aria-label="Settings" icon={<MdRefresh />} variant="ghost" color={iconColor} _hover={{ color: activeIconColor }} onClick={onTransOpen} />
              </Tooltip>
              <Tooltip label="Sound">
                <IconButton aria-label="Sound" icon={<MdVolumeUp />} variant="ghost" color={iconColor} _hover={{ color: activeIconColor }} onClick={handleSpeech} />
              </Tooltip>
              <Tooltip label="Mic">
                <IconButton aria-label="Mic" icon={<MdMic />} variant="ghost" color={iconColor} _hover={{ color: activeIconColor }} />
              </Tooltip>
              <Tooltip label="Copy">
                <IconButton aria-label="Copy" icon={<MdContentCopy />} variant="ghost" color={iconColor} _hover={{ color: activeIconColor }} />
              </Tooltip>
              <Tooltip label="Quick Dictionary">
                <IconButton 
                  aria-label="Quick Dictionary" 
                  icon={<MdMenuBook />} 
                  variant="ghost" 
                  color={isDictOpen ? activeIconColor : iconColor} 
                  _hover={{ color: activeIconColor }} 
                  onClick={onDictOpen}
                  isDisabled={!definition}
                />
              </Tooltip>
              <IconButton
                aria-label="Forward"
                icon={<MdArrowForwardIos />}
                variant="ghost"
                onClick={() => navigateCard(1)}
                isDisabled={!selectedWord}
              />
            </HStack>
          </Flex>

          <Flex flex={1} gap={8} pos="relative" direction="column">
            {/* Flashcard Area */}
            <VStack spacing={4} justify="center" p={4}>
              <Box
                w="full"
                maxW="500px"
                h="300px"
                bg={cardBg}
                borderRadius="3xl"
                boxShadow={useColorModeValue('2xl', 'dark-lg')}
                p={10}
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                textAlign="center"
                cursor="pointer"
                onClick={() => setFlipped(!flipped)}
                transition="all 0.3s ease"
                position="relative"
                borderWidth={1}
                borderColor={borderColor}
                _hover={{ transform: 'scale(1.02)' }}
              >
                {isLoading ? (
                  <SkeletonText noOfLines={4} spacing="4" w="full" />
                ) : selectedWord ? (
                  <>
                    <Text fontSize={flipped ? "lg" : "4xl"} fontWeight={flipped ? "normal" : "black"} color="gray.800" mb={4} px={6} lineHeight="tall">
                      {flipped ? (selectedWord.definition.split(';')[0] || selectedWord.definition) : selectedWord.word}
                    </Text>
                    <Text fontSize="sm" color="learning.400" fontWeight="bold">
                      {flipped ? 'INTERPRETATION' : 'WORD'}
                    </Text>
                    <Text fontSize="xs" color="gray.400" mt={6}>
                      Click to flip card
                    </Text>
                  </>
                ) : (
                  <Text color="gray.400">No card selected</Text>
                )}
              </Box>

              <HStack spacing={6}>
                <Button
                  leftIcon={<MdCheckCircle />}
                  colorScheme="green"
                  size="lg"
                  px={10}
                  borderRadius="full"
                  boxShadow="lg"
                  onClick={() => handleSubmit(true)}
                  isLoading={isSubmitting}
                  isDisabled={!selectedWord}
                >
                  Got it
                </Button>
                <Button
                  leftIcon={<MdError />}
                  variant="outline"
                  colorScheme="learning"
                  size="lg"
                  px={10}
                  borderRadius="full"
                  onClick={() => handleSubmit(false)}
                  isLoading={isSubmitting}
                  isDisabled={!selectedWord}
                >
                  Need Review
                </Button>
              </HStack>
            </VStack>
          </Flex>
        </Flex>
      </Flex>

      {/* Quick Dictionary Drawer */}
      <Drawer isOpen={isDictOpen} onClose={onDictClose} size="md" placement="right">
        <DrawerOverlay backdropFilter="blur(4px)" />
        <DrawerContent borderRadius="0">
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth={1} borderColor="gray.100" py={4}>
            <HStack>
              <Icon as={MdMenuBook} color="learning.400" />
              <Text fontSize="md">Dictionary: {definition?.word}</Text>
            </HStack>
          </DrawerHeader>
          <DrawerBody p={0} bg="gray.50">
            {definition && (
              <Box p={6}>
                <VocabularyEntryDetail 
                  definition={definition} 
                  onWordClick={(w) => {
                    setSearch(w);
                    handleSearch(w);
                  }}
                />
              </Box>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Translation Language Modal */}
      <Modal isOpen={isTransOpen} onClose={onTransClose} isCentered size="xs">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent borderRadius="3xl">
          <ModalHeader fontSize="md" textAlign="center" borderBottomWidth={1} borderColor="gray.100">
            Translation Language
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody p={4}>
            <VStack spacing={2} align="stretch">
              {translationLanguages.map((lang) => (
                <Flex
                  key={lang.code}
                  align="center"
                  p={3}
                  borderRadius="xl"
                  cursor="pointer"
                  transition="all 0.2s"
                  bg={translationLanguage === lang.code ? 'learning.50' : 'transparent'}
                  _hover={{ bg: 'learning.50' }}
                  onClick={() => {
                    setTranslationLanguage(lang.code);
                    onTransClose();
                  }}
                >
                  <Image src={lang.flag} w="24px" h="16px" mr={4} borderRadius="sm" />
                  <Text flex={1} fontSize="sm" fontWeight={translationLanguage === lang.code ? 'bold' : 'normal'}>
                    {lang.label}
                  </Text>
                  {translationLanguage === lang.code && <MdCheckCircle color="#ed64a6" />}
                </Flex>
              ))}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

const DrillItem = ({ item, isSelected, onClick }: { item: VocabularyEntry, isSelected: boolean, onClick: () => void }) => (
  <Flex
    p={3}
    bg={isSelected ? 'white' : 'transparent'}
    borderRadius="xl"
    cursor="pointer"
    transition="all 0.2s"
    boxShadow={isSelected ? 'sm' : 'none'}
    onClick={onClick}
    align="center"
    justify="space-between"
    _hover={{ bg: 'whiteAlpha.600' }}
  >
    <Box>
      <Text fontWeight="semibold" fontSize="sm" color="gray.700">
        {item.word}
      </Text>
      <Text fontSize="2xs" color="gray.500">
        {item.partOfSpeech}
      </Text>
    </Box>
    {item.isNew && (
      <Badge colorScheme="learning" variant="subtle" fontSize="2xs">
        NEW
      </Badge>
    )}
  </Flex>
);

export default VocabularyDrillPanel;
