import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Select,
  Stack,
  Text,
  Textarea,
  useColorModeValue,
  VStack,
  HStack,
  Divider,
  IconButton,
  Tag,
  Wrap,
  WrapItem,
  Center,
  Skeleton,
  SkeletonText,
  Switch,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { MdSend, MdRefresh, MdLightbulb, MdTopic, MdPlayArrow, MdMic, MdStop, MdDelete, MdVolumeUp } from 'react-icons/md';
import { SectionCard } from '../../../components';
import { useTechnologyLearner, useAudioRecorder, useTTS } from '../../../hooks';
import GrammarCorrection from './components/GrammarCorrection';
import GrammarFeedbackPanel from './components/GrammarFeedbackPanel';

const TechnologyPanel = () => {
  const {
    topics,
    isLoadingTopics,
    session,
    chat,
    isStarting,
    isSending,
    feedback,
    error,
    beginSession,
    sendMessage,
    finishSession,
    resetSession,
  } = useTechnologyLearner();
  const [message, setMessage] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [autoPlay, setAutoPlay] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastTurnRef = useRef<number>(0);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat]);

  // Handle Auto-play TTS
  const { speak, isPlaying: isTTSSpeaking } = useTTS();

  useEffect(() => {
    if (!autoPlay || chat.length === 0) return;

    const lastTurn = chat[chat.length - 1];
    if (lastTurn.role === 'assistant' && chat.length > lastTurnRef.current) {
      speak(lastTurn.content, 'en');
      lastTurnRef.current = chat.length;
    } else if (lastTurn.role === 'user') {
      lastTurnRef.current = chat.length;
    }
  }, [chat, autoPlay, speak]);

  const bg = useColorModeValue('white', 'gray.900');
  const chatBg = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('learning.100', 'gray.700');
  const accentColor = 'learning.400';

  const handleStart = () => {
    if (!selectedTopic) return;
    beginSession(selectedTopic);
  };

  const {
    isRecording,
    startRecording,
    stopRecording,
    audioBlob,
    audioUrl,
    formattedTime,
    clearRecording
  } = useAudioRecorder();

  const handleSend = async (textOverride?: string, blobOverride?: Blob) => {
    const finalMessage = textOverride ?? message;
    const finalBlob = blobOverride ?? audioBlob;

    if (!finalMessage.trim() && !finalBlob) return;

    let base64Audio = undefined;
    if (finalBlob) {
      const reader = new FileReader();
      base64Audio = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
        reader.readAsDataURL(finalBlob);
      });
    }

    sendMessage(finalMessage, 'en', base64Audio, audioUrl || undefined);
    setMessage('');
    clearRecording();
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Get current user feedback data
  const lastUserTurn = [...chat].reverse().find(t => t.role === 'user');

  return (
    <Box p={2}>
      <VStack spacing={8} align="stretch">
        {/* Header & Topic Interaction */}
        <Flex justify="space-between" align={{ base: 'column', md: 'row' }} gap={4}>
          <VStack align="left" spacing={0}>
            <Text fontSize="2xl" fontWeight="extrabold" color="gray.800">
              Technology Tutor
            </Text>
            <Text fontSize="sm" color="gray.500">
              Master complex technology topics with AI assistance
            </Text>
          </VStack>
          
          <HStack spacing={4} w={{ base: 'full', md: 'auto' }}>
            <FormControl display="flex" alignItems="center" w="auto">
               <FormLabel htmlFor="auto-play-tech" mb="0" fontSize="xs" color="gray.500" fontWeight="bold">
                 AUTO-PLAY AUDIO
               </FormLabel>
               <Switch id="auto-play-tech" colorScheme="learning" size="sm" isChecked={autoPlay} onChange={(e) => setAutoPlay(e.target.checked)} />
            </FormControl>

            <Select
              size="lg"
              flex={1}
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              placeholder={isLoadingTopics ? 'Loading topics…' : 'Select a tech topic'}
              isDisabled={isLoadingTopics || !!session}
              bg="white"
              borderRadius="2xl"
              borderColor={borderColor}
              fontSize="sm"
              maxW={{ base: 'full', md: '250px' }}
              _focus={{ borderColor: accentColor }}
            >
              {[...new Set(topics.map(t => t.category))].map(cat => (
                <optgroup key={cat} label={cat}>
                  {topics.filter(t => t.category === cat).map(topic => (
                    <option key={topic.id} value={topic.id}>{topic.title}</option>
                  ))}
                </optgroup>
              ))}
            </Select>
            <Button
              size="lg"
              colorScheme="learning"
              borderRadius="2xl"
              onClick={handleStart}
              isLoading={isStarting}
              isDisabled={!selectedTopic || !!session}
              leftIcon={<MdPlayArrow />}
              px={8}
            >
              Begin Session
            </Button>
            {session && (
              <IconButton
                aria-label="Reset"
                icon={<MdRefresh />}
                variant="ghost"
                onClick={resetSession}
                borderRadius="full"
                color="gray.400"
              />
            )}
          </HStack>
        </Flex>

        <Divider borderColor={borderColor} />

        <Flex gap={8} direction={{ base: 'column', lg: 'row' }} h="550px">
          {/* Main Interaction Area */}
          <Flex flex={2} direction="column" bg={chatBg} borderRadius="3xl" p={6} position="relative" borderWidth={1} borderColor={borderColor}>
            {session ? (
              <>
                <Flex justify="space-between" align="center" mb={4}>
                  <HStack>
                    <Tag size="sm" colorScheme="learning" variant="solid" borderRadius="full">Live Session</Tag>
                    <Text fontSize="xs" color="gray.500" fontWeight="bold">{session.topic.title}</Text>
                  </HStack>
                  <Button size="xs" variant="ghost" colorScheme="learning" onClick={finishSession}>Finish & Summarize</Button>
                </Flex>
                
                <Box flex={1} overflowY="auto" mb={4} pr={2} ref={scrollRef} sx={{
                  '&::-webkit-scrollbar': { width: '4px' },
                  '&::-webkit-scrollbar-thumb': { bg: 'learning.100', borderRadius: 'full' }
                }}>
                  <VStack spacing={6} align="stretch" py={2}>
                    <Box p={6} bg="white" borderRadius="2xl" borderLeftWidth={4} borderLeftColor="learning.400" boxShadow="sm">
                       <Text fontWeight="bold" fontSize="lg" mb={2}>{session.topic.title}</Text>
                       <Text fontSize="sm" color="gray.600">{session.intro}</Text>
                    </Box>

                    {chat.map((turn, index) => (
                      <Box key={index} mb={2}>
                        <HStack mb={1}>
                          <Text fontSize="2xs" fontWeight="black" color="learning.400" letterSpacing="widest">
                            {turn.role === 'assistant' ? 'AI MENTOR' : 'YOU'}
                          </Text>
                          {turn.role === 'user' && turn.pronunciationScore !== undefined && turn.pronunciationScore !== null && (
                            <Tag size="sm" colorScheme={turn.pronunciationScore! > 80 ? 'green' : 'orange'} borderRadius="full" fontSize="9px">
                              Pronunciation: {turn.pronunciationScore}%
                            </Tag>
                          )}
                        </HStack>
                        <Box
                          p={4}
                          bg={turn.role === 'assistant' ? 'transparent' : 'white'}
                          borderRadius="2xl"
                          borderWidth={turn.role === 'assistant' ? 0 : 1}
                          borderColor="gray.100"
                          boxShadow={turn.role === 'assistant' ? 'none' : 'sm'}
                        >
                          <VStack align="left" spacing={2}>
                            <Box fontSize="sm" color="gray.700" lineHeight="tall">
                              {turn.role === 'user' ? (
                                <GrammarCorrection text={turn.content} errors={turn.grammarErrors || []} />
                              ) : (
                                <Text>{turn.content}</Text>
                              )}
                            </Box>
                            
                            <HStack>
                              {turn.audioUrl && (
                                <IconButton
                                  aria-label="Play recording"
                                  icon={<MdVolumeUp />}
                                  size="xs"
                                  variant="ghost"
                                  colorScheme="learning"
                                  onClick={() => {
                                    const audio = new Audio(turn.audioUrl);
                                    audio.play();
                                  }}
                                />
                              )}

                              {turn.role === 'assistant' && (
                                <IconButton
                                  aria-label="Speak response"
                                  icon={<MdVolumeUp />}
                                  size="xs"
                                  variant="ghost"
                                  colorScheme="learning"
                                  onClick={() => speak(turn.content, 'en')}
                                  isLoading={isTTSSpeaking}
                                />
                              )}
                            </HStack>

                            {turn.role === 'assistant' && turn.nativeSpeakerVersion && (
                              <Box mt={1} pt={2} borderTopWidth="1px" borderColor="gray.50">
                                <Text fontSize="xs" fontWeight="bold" color="learning.400">Better expression:</Text>
                                <Text fontSize="xs" fontStyle="italic" color="gray.500">"{turn.nativeSpeakerVersion}"</Text>
                              </Box>
                            )}
                          </VStack>
                        </Box>
                      </Box>
                    ))}
                    {isSending && (
                      <VStack align="left" spacing={2}>
                        <Skeleton h="10px" w="100px" />
                        <SkeletonText noOfLines={3} spacing="2" skeletonHeight="2" />
                      </VStack>
                    )}
                  </VStack>
                </Box>

                <HStack spacing={3} bg="white" p={2} borderRadius="3xl" boxShadow="sm" border="1px" borderColor={borderColor}>
                  <IconButton
                    aria-label="Toggle Recording"
                    icon={isRecording ? <MdStop /> : <MdMic />}
                    colorScheme={isRecording ? 'red' : 'gray'}
                    variant={isRecording ? 'solid' : 'ghost'}
                    borderRadius="full"
                    size="lg"
                    onClick={toggleRecording}
                    _hover={{ transform: 'scale(1.1)' }}
                    transition="all 0.2s"
                  />

                  {isRecording ? (
                    <HStack flex={1} justify="center" position="relative">
                      <Box 
                        w={3} h={3} bg="red.500" borderRadius="full" 
                        position="absolute" left="10%"
                        style={{ animation: 'pulse 1s infinite' }}
                      />
                      <Text fontWeight="bold" fontSize="sm" color="red.500" ml={4}>{formattedTime}</Text>
                      <Text fontSize="xs" color="gray.400">Recording speech...</Text>

                      <style>{`
                        @keyframes pulse {
                          0% { transform: scale(1); opacity: 1; }
                          50% { transform: scale(1.5); opacity: 0.5; }
                          100% { transform: scale(1); opacity: 1; }
                        }
                      `}</style>
                    </HStack>
                  ) : audioBlob ? (
                    <HStack flex={1} spacing={3} bg="learning.50" p={2} borderRadius="2xl">
                       <IconButton 
                        aria-label="Play preview" 
                        icon={<MdPlayArrow />} 
                        size="sm" 
                        colorScheme="learning" 
                        variant="ghost"
                        onClick={() => {
                          if (audioUrl) {
                            const audio = new Audio(audioUrl);
                            audio.play();
                          }
                        }} 
                       />
                       <Text fontSize="xs" fontWeight="bold" color="learning.600">Voice Ready</Text>
                       <IconButton 
                        aria-label="Delete recording" 
                        icon={<MdDelete />} 
                        size="xs" 
                        variant="ghost" 
                        colorScheme="red" 
                        onClick={clearRecording} 
                       />
                       <Flex flex={1} />
                       <Button size="sm" colorScheme="learning" borderRadius="full" leftIcon={<MdSend />} onClick={() => handleSend()}>Send Voice</Button>
                    </HStack>
                  ) : (
                    <Textarea
                      placeholder="Explain a concept or ask AI Tutor..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      bg="transparent"
                      border="none"
                      rows={1}
                      resize="none"
                      py={3}
                      flex={1}
                      _focus={{ ring: 0 }}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    />
                  )}

                  {!isRecording && !audioBlob && (
                    <IconButton
                      aria-label="Send"
                      icon={<MdSend />}
                      colorScheme="learning"
                      borderRadius="full"
                      onClick={() => handleSend()}
                      isLoading={isSending}
                      isDisabled={!message.trim()}
                      size="lg"
                    />
                  )}
                </HStack>
              </>
            ) : (
              <Center h="full" borderStyle="dashed" borderWidth="1px" borderColor="learning.200" borderRadius="3xl">
                <VStack spacing={4}>
                  <Box color="learning.200" fontSize="6xl">🚀</Box>
                  <Text color="gray.400" textAlign="center">Select a tech topic to start an interactive learning session with your AI Mentor.</Text>
                  {topics.length > 0 && (
                     <Wrap justify="center" px={10} spacing={2} mt={4}>
                        {topics.slice(0, 5).map(t => (
                          <WrapItem key={t.id}>
                            <Tag 
                              size="sm" 
                              variant="subtle" 
                              colorScheme="learning" 
                              cursor="pointer" 
                              onClick={() => setSelectedTopic(t.id)}
                              _hover={{ bg: 'learning.100' }}
                            >
                              {t.title}
                            </Tag>
                          </WrapItem>
                        ))}
                     </Wrap>
                  )}
                </VStack>
              </Center>
            )}
          </Flex>

          {/* Side Info Area */}
          <VStack flex={0.8} spacing={6} align="stretch">
            {lastUserTurn && lastUserTurn.grammarErrors && (
               <GrammarFeedbackPanel 
                errors={lastUserTurn.grammarErrors} 
                pronunciationScore={lastUserTurn.pronunciationScore} 
               />
            )}

            {feedback && (
              <Box p={6} bg="learning.50" borderRadius="3xl" borderLeftWidth={4} borderLeftColor="learning.400" boxShadow="sm">
                <Text fontWeight="bold" fontSize="sm" color="learning.700" mb={2}>SESSION SUMMARY</Text>
                <Text fontSize="xs" color="learning.600" lineHeight="tall">{feedback}</Text>
              </Box>
            )}

            <Box p={6} bg="white" borderRadius="3xl" borderWidth={1} borderColor={borderColor} boxShadow="sm">
               <HStack mb={4}>
                 <MdLightbulb color="#ed64a6" />
                 <Text fontWeight="bold" fontSize="xs">LEARNING TIPS</Text>
               </HStack>
               <VStack align="left" spacing={4}>
                  <Box>
                    <Text fontSize="2xs" fontWeight="bold" color="gray.400">ASK WHY</Text>
                    <Text fontSize="2xs" color="gray.600">Don't just learn "what", ask AI Mentor "why" things work the way they do.</Text>
                  </Box>
                  <Box>
                    <Text fontSize="2xs" fontWeight="bold" color="gray.400">REAL-WORLD</Text>
                    <Text fontSize="2xs" color="gray.600">Request analogies or real-world examples to visualize abstract concepts.</Text>
                  </Box>
                  <Box>
                    <Text fontSize="2xs" fontWeight="bold" color="gray.400">FOLLOW-UP</Text>
                    <Text fontSize="2xs" color="gray.600">Ask the mentor to quiz you on what you just learned at any time.</Text>
                  </Box>
               </VStack>
            </Box>

            {!session && topics.length > 0 && (
               <Box p={6} bg="learning.50" borderRadius="3xl" borderStyle="dashed" borderWidth="1px" borderColor="learning.200">
                  <HStack mb={3}>
                    <MdTopic color="#ed64a6" />
                    <Text fontSize="2xs" color="learning.400" fontWeight="bold">QUICK START</Text>
                  </HStack>
                  <Stack spacing={2}>
                    {topics.filter(t => t.id !== selectedTopic).slice(0, 3).map(t => (
                      <Button 
                        key={t.id} 
                        size="xs" 
                        variant="link" 
                        colorScheme="learning" 
                        justifyContent="start"
                        onClick={() => setSelectedTopic(t.id)}
                      >
                        Learn {t.title} →
                      </Button>
                    ))}
                  </Stack>
               </Box>
            )}
          </VStack>
        </Flex>

        {error && (
          <Box p={4} bg="red.50" borderRadius="xl" borderLeftWidth={4} borderLeftColor="red.400">
            <Text fontSize="sm" color="red.700">{error}</Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default TechnologyPanel;
