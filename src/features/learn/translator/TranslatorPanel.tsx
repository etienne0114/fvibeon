import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Icon,
  IconButton,
  Select,
  Stack,
  Tag,
  Text,
  useColorModeValue,
  useToast,
  VStack,
  Wrap,
  WrapItem,
  Grid,
  GridItem,
  Heading,
  Spacer,
} from '@chakra-ui/react';
import { RepeatIcon, SearchIcon } from '@chakra-ui/icons';
import { MdSwapHoriz } from 'react-icons/md';
import { SectionCard, SectionHeading } from '../../../components';
import { useTranslator } from '../../../hooks/useTranslator';
import { useDictionary } from '../../../hooks/useDictionary';
import { useEffect, useMemo, useState, useCallback } from 'react';
import TranslatePane from './components/TranslatePane';
import ImageTranslationPane from './components/ImageTranslationPane';
import DocumentTranslationPane from './components/DocumentTranslationPane';
import RealtimeTranslationPane from './components/RealtimeTranslationPane';

// Website tab removed — not supported in this build
const translatorModes = ['Text', 'Images', 'Documents', 'Real-time'];

const TranslatorPanel = () => {
  const toast = useToast();
  const {
    inputValue,
    setInputValue,
    languages,
    sourceLanguage,
    targetLanguage,
    setSourceLanguage,
    setTargetLanguage,
    translation,
    isTranslating,
    translate,
    history,
    historyVisible,
    toggleHistory,
    error,
    swapLanguages,
    translateFile,
    translateDoc,
    translateRealtime,
    speakText,
    imageTranslation,
    isTranslatingImage,
    setImageTranslation,
    documentTranslation,
    isTranslatingDocument,
    setDocumentTranslation,
  } = useTranslator();

  const {
    query: dictionaryQuery,
    definition,
    isLoading: isLookingUp,
    error: dictError,
    lookup,
    setQuery: setDictionaryQuery,
    visible: dictionaryVisible,
    toggle: toggleDictionary,
  } = useDictionary();

  const [activeMode, setActiveMode] = useState(translatorModes[0]);

  const background = useColorModeValue('gray.50', '#090b15');
  const innerBg = useColorModeValue('white', '#0b0f1b');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const effectiveSource = useMemo(
    () => (sourceLanguage && sourceLanguage !== 'auto' ? sourceLanguage : 'en'),
    [sourceLanguage],
  );

  useEffect(() => {
    const trimmed = inputValue.trim();
    if (trimmed && trimmed.split(' ').length === 1) {
      setDictionaryQuery(trimmed);
      lookup(trimmed, effectiveSource);
    }
  }, [inputValue, effectiveSource, lookup, setDictionaryQuery]);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard', status: 'success', duration: 2000, isClosable: true });
  }, [toast]);

  // Uses backend TTS (vibeon_translator) with browser fallback
  const handleSpeak = useCallback((text: string, lang?: string) => {
    speakText(text, lang ?? effectiveSource);
  }, [speakText, effectiveSource]);

  // Web Speech API mic for Text mode — works in Chrome/Edge
  // Falls back to a toast on unsupported browsers
  const handleMicrophone = useCallback(() => {
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast({ title: 'Microphone not supported', description: 'Use Chrome or Edge for voice input.', status: 'warning', duration: 3000 });
      return;
    }
    const rec: any = new SR();
    rec.lang = effectiveSource + '-' + effectiveSource.toUpperCase();
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (event: any) => {
      const spoken: string = event.results[0]?.[0]?.transcript ?? '';
      if (spoken) setInputValue((prev: string) => (prev ? prev + ' ' + spoken : spoken).trimStart());
    };
    rec.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        toast({ title: 'Microphone denied', description: 'Allow microphone access in browser settings.', status: 'error', duration: 4000 });
      }
    };
    rec.start();
    toast({ title: 'Listening…', description: 'Speak now. Tap mic again when done.', status: 'info', duration: 3000 });
  }, [effectiveSource, setInputValue, toast]);

  const renderDictionary = () => {
    if (!dictionaryVisible || !definition) return null;
    return (
      <Box
        borderRadius="xl"
        borderWidth={1}
        borderColor={borderColor}
        bg={innerBg}
        boxShadow="md"
        p={6}
        mt={6}
        transition="all 0.2s"
      >
        <Stack spacing={4}>
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Text fontSize="lg" fontWeight="bold" color="learning.500">Dictionary Result</Text>
              <HStack spacing={3}>
                <Heading size="lg">{definition.word}</Heading>
                {!!definition.phonetic && (
                  <Text color="learning.400" fontStyle="italic" fontSize="lg">/{definition.phonetic}/</Text>
                )}
              </HStack>
            </VStack>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => lookup(dictionaryQuery, effectiveSource)}
              isLoading={isLookingUp}
              leftIcon={<RepeatIcon />}
            >
              Refresh
            </Button>
          </HStack>

          <Divider borderColor={borderColor} />

          <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
            {definition.meanings?.map((meaning) => (
              <GridItem key={`${meaning.partOfSpeech}-${meaning.definitions?.[0]?.definition}`}>
                <VStack align="start" spacing={2}>
                  <Badge colorScheme="purple" variant="outline" borderRadius="full" px={3}>
                    {meaning.partOfSpeech}
                  </Badge>
                  {meaning.definitions?.slice(0, 2).map((def, idx) => (
                    <Box key={idx} pl={2} borderLeftWidth="2px" borderColor="learning.100">
                      <Text fontWeight="medium" fontSize="md">{def.definition}</Text>
                      {!!def.example && (
                        <Text fontSize="sm" color="gray.500" mt={1}>"{def.example}"</Text>
                      )}
                    </Box>
                  ))}
                </VStack>
              </GridItem>
            ))}
          </Grid>

          {!!definition.synonyms?.length && (
            <VStack align="start" spacing={2}>
              <Text fontSize="sm" fontWeight="semibold" color="gray.400">Synonyms</Text>
              <Wrap spacing={2}>
                {definition.synonyms.slice(0, 10).map((synonym) => (
                  <WrapItem key={`syn-${synonym}`}>
                    <Tag size="sm" variant="subtle" colorScheme="blue" borderRadius="full">{synonym}</Tag>
                  </WrapItem>
                ))}
              </Wrap>
            </VStack>
          )}
        </Stack>
      </Box>
    );
  };

  // Whether to show language selector bar (not needed for Real-time which has its own)
  const showLanguageBar = activeMode !== 'Real-time';

  return (
    <SectionCard background={background} borderRadius="2xl">
      <Stack spacing={6} p={{ base: 4, md: 8 }}>
        <SectionHeading title="Translator" subtitle="Powered by vibeon_translator" />

        {/* Mode Selector Tabs */}
        <Flex gap={2} align="center" overflowX="auto" pb={2} css={{ '&::-webkit-scrollbar': { display: 'none' } }}>
          {translatorModes.map((mode) => (
            <Button
              key={mode}
              size="md"
              px={6}
              borderRadius="full"
              variant={activeMode === mode ? 'solid' : 'ghost'}
              colorScheme={activeMode === mode ? 'learning' : 'gray'}
              onClick={() => setActiveMode(mode)}
              flexShrink={0}
            >
              {mode}
            </Button>
          ))}
          <Spacer />
          <IconButton
            aria-label="Toggle dictionary"
            icon={<SearchIcon />}
            size="md"
            variant="ghost"
            borderRadius="full"
            isActive={dictionaryVisible}
            onClick={toggleDictionary}
          />
        </Flex>

        <Box bg={background} borderRadius="2xl">
          <VStack spacing={0} align="stretch">
            {/* Language Selector Bar — hidden for Real-time (it renders inline) */}
            {showLanguageBar && (
              <Flex
                direction={{ base: 'column', md: 'row' }}
                gap={0}
                align="center"
                bg={innerBg}
                borderTopRadius="xl"
                borderWidth="1px"
                borderColor={borderColor}
                borderBottom="none"
                p={1}
              >
                <VStack spacing={0} flex={1}>
                  <Select
                    variant="unstyled"
                    value={sourceLanguage}
                    onChange={(e) => setSourceLanguage(e.target.value)}
                    textAlign="center"
                    fontSize="sm"
                    fontWeight="bold"
                    h="48px"
                    cursor="pointer"
                  >
                    {languages.map((language) => (
                      <option key={language.code} value={language.code}>
                        {language.name.toUpperCase()}
                      </option>
                    ))}
                  </Select>
                  {sourceLanguage === 'auto' && translation?.detectedLanguage && (
                    <Text fontSize="xs" color="learning.500" fontWeight="medium" mb={1}>
                      Detected:{' '}
                      {languages.find((l) => l.code === translation.detectedLanguage?.language)?.name ||
                        translation.detectedLanguage.language.toUpperCase()}{' '}
                      ({Math.round(translation.detectedLanguage.confidence * 100)}%)
                    </Text>
                  )}
                </VStack>

                <IconButton
                  aria-label="Swap languages"
                  icon={<Icon as={MdSwapHoriz} w={6} h={6} />}
                  variant="ghost"
                  onClick={swapLanguages}
                  mx={2}
                  borderRadius="full"
                  _hover={{ bg: 'gray.100' }}
                />

                <Select
                  variant="unstyled"
                  value={targetLanguage}
                  flex={1}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  textAlign="center"
                  fontSize="sm"
                  fontWeight="bold"
                  h="48px"
                  cursor="pointer"
                >
                  {languages
                    .filter((l) => l.code !== 'auto')
                    .map((language) => (
                      <option key={language.code} value={language.code}>
                        {language.name.toUpperCase()}
                      </option>
                    ))}
                </Select>
              </Flex>
            )}

            {/* Main Translation Content */}
            <Box>
              {activeMode === 'Images' && (
                <ImageTranslationPane
                  onTranslate={translateFile}
                  isLoading={isTranslatingImage}
                  result={imageTranslation}
                  onClear={() => setImageTranslation(null)}
                />
              )}

              {activeMode === 'Documents' && (
                <DocumentTranslationPane
                  onTranslate={translateDoc}
                  isLoading={isTranslatingDocument}
                  result={documentTranslation}
                  onClear={() => setDocumentTranslation(null)}
                />
              )}

              {activeMode === 'Real-time' && (
                <Box
                  bg={innerBg}
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor={borderColor}
                  overflow="hidden"
                >
                  {/* Language selector embedded for real-time */}
                  <Flex
                    direction={{ base: 'column', md: 'row' }}
                    align="center"
                    borderBottomWidth="1px"
                    borderColor={borderColor}
                    p={1}
                  >
                    <Select
                      variant="unstyled"
                      value={sourceLanguage}
                      onChange={(e) => setSourceLanguage(e.target.value)}
                      textAlign="center"
                      fontSize="sm"
                      fontWeight="bold"
                      h="48px"
                      cursor="pointer"
                      flex={1}
                    >
                      {languages.map((language) => (
                        <option key={language.code} value={language.code}>
                          {language.name.toUpperCase()}
                        </option>
                      ))}
                    </Select>

                    <IconButton
                      aria-label="Swap languages"
                      icon={<Icon as={MdSwapHoriz} w={6} h={6} />}
                      variant="ghost"
                      onClick={swapLanguages}
                      mx={2}
                      borderRadius="full"
                      _hover={{ bg: 'gray.100' }}
                    />

                    <Select
                      variant="unstyled"
                      value={targetLanguage}
                      flex={1}
                      onChange={(e) => setTargetLanguage(e.target.value)}
                      textAlign="center"
                      fontSize="sm"
                      fontWeight="bold"
                      h="48px"
                      cursor="pointer"
                    >
                      {languages
                        .filter((l) => l.code !== 'auto')
                        .map((language) => (
                          <option key={language.code} value={language.code}>
                            {language.name.toUpperCase()}
                          </option>
                        ))}
                    </Select>
                  </Flex>

                  <Box p={2}>
                    <RealtimeTranslationPane
                      onTranslate={translateRealtime}
                      sourceLanguage={sourceLanguage}
                      targetLanguage={targetLanguage}
                      onSpeak={handleSpeak}
                    />
                  </Box>
                </Box>
              )}

              {activeMode === 'Text' && (
                <Grid
                  templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }}
                  gap={0}
                  bg={borderColor}
                >
                  <TranslatePane
                    value={inputValue}
                    onChange={(val) => {
                      setInputValue(val);
                      if (val.trim() === '') translate();
                    }}
                    placeholder="Start typing or paste text"
                    count={inputValue.length}
                    phonetics={
                      definition?.word === inputValue.trim() ? definition.phonetic : undefined
                    }
                    onClear={() => setInputValue('')}
                    onMic={handleMicrophone}
                    onSpeak={() => handleSpeak(inputValue, effectiveSource)}
                  />
                  <TranslatePane
                    value={translation?.translatedText || ''}
                    isReadOnly
                    placeholder="Translation will appear here"
                    onCopy={() => handleCopy(translation?.translatedText || '')}
                    onSpeak={() => handleSpeak(translation?.translatedText || '', targetLanguage)}
                  />
                </Grid>
              )}
            </Box>
          </VStack>
        </Box>

        {activeMode === 'Text' && (
          <Flex justify="center" mt={4}>
            <Button
              size="lg"
              colorScheme="learning"
              px={12}
              borderRadius="full"
              onClick={translate}
              isLoading={isTranslating}
              boxShadow="lg"
              _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
            >
              Translate
            </Button>
          </Flex>
        )}

        {error && (
          <Text color="red.500" textAlign="center" fontSize="sm" fontWeight="medium">
            {error}
          </Text>
        )}

        {renderDictionary()}
      </Stack>
    </SectionCard>
  );
};

export default TranslatorPanel;
