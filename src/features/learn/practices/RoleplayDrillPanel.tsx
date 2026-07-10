import { useState, useRef, useEffect } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  Input,
  Select,
  Stack,
  Text,
  Textarea,
  useColorModeValue,
  Skeleton,
  SkeletonText,
  VStack,
  HStack,
  Divider,
  IconButton,
  Avatar,
  Center,
  Switch,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { MdRefresh, MdSend, MdHistory, MdKeyboardArrowDown, MdChatBubble, MdQuestionAnswer, MdMic, MdStop, MdDelete, MdVolumeUp, MdPlayArrow, MdSettings } from 'react-icons/md';
import { useRoleplay, useAudioRecorder, useTTS } from '../../../hooks';
import GrammarCorrection from './components/GrammarCorrection';
import GrammarFeedbackPanel from './components/GrammarFeedbackPanel';

const RoleplayDrillPanel = () => {
  const {
    scenarios,
    isLoadingScenarios,
    isStarting,
    sessionId,
    scenario,
    conversation,
    grammarHint,
    feedback,
    isSending,
    error,
    startSession,
    sendMessage,
    finishSession,
  } = useRoleplay();
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState('');
  const [autoPlay, setAutoPlay] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastTurnRef = useRef<number>(0);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation]);

  // Handle Auto-play TTS
  const { speak, isPlaying: isTTSSpeaking } = useTTS();

  useEffect(() => {
    if (!autoPlay || conversation.length === 0) return;

    const lastTurn = conversation[conversation.length - 1];
    if (lastTurn.role === 'assistant' && conversation.length > lastTurnRef.current) {
      speak(lastTurn.content, 'en');
      lastTurnRef.current = conversation.length;
    } else if (lastTurn.role === 'user') {
      lastTurnRef.current = conversation.length;
    }
  }, [conversation, autoPlay, speak]);

  const bg = useColorModeValue('white', 'gray.900');
  const chatBg = useColorModeValue('learning.50', 'gray.800');
  const userBubbleBg = 'learning.400';
  const tutorBubbleBg = 'white';
  const borderColor = useColorModeValue('learning.100', 'gray.700');
  const accentColor = 'learning.400';

  const {
    isRecording,
    startRecording,
    stopRecording,
    audioBlob,
    audioUrl,
    formattedTime,
    clearRecording
  } = useAudioRecorder();

  const handleStart = () => {
    if (!selected) return;
    startSession(selected);
  };

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
  const lastUserTurn = [...conversation].reverse().find(t => t.role === 'user');

  return (
    <Box p={2}>
      <VStack spacing={8} align="stretch">
        {/* Header & Scenario Selection */}
        <Flex justify="space-between" align={{ base: 'column', md: 'row' }} gap={4}>
          <VStack align="left" spacing={0}>
            <Text fontSize="2xl" fontWeight="extrabold" color="gray.800">
              Roleplay Drill
            </Text>
            <Text fontSize="sm" color="gray.500">
              Simulate real-world conversations with an AI tutor
            </Text>
          </VStack>
          
          <HStack spacing={4} w={{ base: 'full', md: 'auto' }}>
            <FormControl display="flex" alignItems="center" w="auto">
               <FormLabel htmlFor="auto-play" mb="0" fontSize="xs" color="gray.500" fontWeight="bold">
                 AUTO-PLAY AUDIO
               </FormLabel>
               <Switch id="auto-play" colorScheme="learning" size="sm" isChecked={autoPlay} onChange={(e) => setAutoPlay(e.target.checked)} />
            </FormControl>

            <Select
              size="lg"
              placeholder={isLoadingScenarios ? 'Loading scenarios...' : 'Select a scenario'}
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              isDisabled={isStarting || isLoadingScenarios}
              bg="white"
              borderRadius="2xl"
              borderColor={borderColor}
              fontSize="sm"
              maxW={{ base: 'full', md: '250px' }}
              _focus={{ borderColor: accentColor }}
            >
              {[...new Set(scenarios.map(s => s.category))].map(cat => (
                <optgroup key={cat} label={cat}>
                  {scenarios.filter(s => s.category === cat).map(s => (
                    <option key={s.id} value={s.id}>{s.title}</option>
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
              isDisabled={!selected || !!sessionId}
              px={8}
            >
              Start Drill
            </Button>
          </HStack>
        </Flex>

        <Divider borderColor={borderColor} />

        <Flex gap={8} direction={{ base: 'column', lg: 'row' }} h="550px">
          {/* Main Chat Area */}
          <Flex flex={2} direction="column" bg={chatBg} borderRadius="3xl" p={6} border={1} borderColor={borderColor} position="relative">
            {sessionId ? (
              <>
                <Flex justify="space-between" align="center" mb={4}>
                   <HStack>
                     <Avatar size="sm" name="Tutor" bg="learning.500" />
                     <VStack align="left" spacing={0}>
                       <Text fontSize="sm" fontWeight="bold">{scenario?.title}</Text>
                       <Text fontSize="2xs" color="gray.500">{scenario?.category}</Text>
                     </VStack>
                   </HStack>
                   <Button size="xs" variant="ghost" colorScheme="learning" onClick={finishSession}>Finish Session</Button>
                </Flex>
                
                <Box flex={1} overflowY="auto" mb={4} pr={2} ref={scrollRef} sx={{
                  '&::-webkit-scrollbar': { width: '4px' },
                  '&::-webkit-scrollbar-thumb': { bg: 'learning.100', borderRadius: 'full' }
                }}>
                  <VStack spacing={4} align="stretch" py={2}>
                    {conversation.map((turn, index) => (
                      <Flex 
                        key={index} 
                        justify={turn.role === 'assistant' ? 'flex-start' : 'flex-end'}
                        direction="column"
                        align={turn.role === 'assistant' ? 'flex-start' : 'flex-end'}
                      >
                        <Box
                          maxW="85%"
                          p={4}
                          borderRadius="2xl"
                          borderTopLeftRadius={turn.role === 'assistant' ? '0' : '2xl'}
                          borderBottomRightRadius={turn.role === 'assistant' ? '2xl' : '0'}
                          bg={turn.role === 'assistant' ? tutorBubbleBg : userBubbleBg}
                          color={turn.role === 'assistant' ? 'gray.700' : 'white'}
                          boxShadow="sm"
                          position="relative"
                        >
                          <VStack align="left" spacing={2}>
                            <Box fontSize="sm">
                              {turn.role === 'user' ? (
                                <GrammarCorrection text={turn.content} errors={turn.grammarErrors || []} />
                              ) : (
                                <Text>{turn.content}</Text>
                              )}
                            </Box>
                            
                            <HStack>
                              {turn.role === 'user' && turn.pronunciationScore !== undefined && turn.pronunciationScore !== null && (
                                <Badge colorScheme={turn.pronunciationScore! > 80 ? 'green' : 'orange'} alignSelf="flex-start" fontSize="10px" borderRadius="full">
                                  Pronunciation: {turn.pronunciationScore}%
                                </Badge>
                              )}
                              
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
                              <Box mt={2} pt={2} borderTopWidth="1px" borderColor="gray.100">
                                <Text fontSize="xs" fontWeight="bold" color="learning.500" mb={1}>Native Way:</Text>
                                <Text fontSize="xs" fontStyle="italic" color="gray.600">"{turn.nativeSpeakerVersion}"</Text>
                              </Box>
                            )}
                          </VStack>
                        </Box>
                      </Flex>
                    ))}
                    {isSending && (
                      <Flex justify="flex-start">
                        <Box p={4} borderRadius="2xl" bg="white" color="gray.400">
                          <Skeleton h="10px" w="100px" />
                        </Box>
                      </Flex>
                    )}
                  </VStack>
                </Box>

                {grammarHint && (
                  <Box mb={4} p={3} bg="orange.50" borderRadius="xl" borderLeftWidth={4} borderLeftColor="orange.300">
                    <HStack>
                      <MdChatBubble color="orange" />
                      <Text fontSize="xs" color="orange.700"><strong>Hint:</strong> {grammarHint}</Text>
                    </HStack>
                  </Box>
                )}

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
                      <Text fontSize="xs" color="gray.400">Recording your voice...</Text>
                      
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
                       <Text fontSize="xs" fontWeight="bold" color="learning.600">Voice Note Ready</Text>
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
                      placeholder="Type or use the mic to speak..."
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
              <Center h="full">
                <VStack spacing={4}>
                  <Box color="learning.200" fontSize="6xl">🎭</Box>
                  <Text color="gray.400" textAlign="center">Choose a scenario to begin your immersive roleplay experience.</Text>
                </VStack>
              </Center>
            )}
          </Flex>

          {/* Sidebar Area */}
          <VStack flex={0.8} spacing={6} align="stretch">
            {lastUserTurn && lastUserTurn.grammarErrors && (
               <GrammarFeedbackPanel 
                errors={lastUserTurn.grammarErrors} 
                pronunciationScore={lastUserTurn.pronunciationScore} 
               />
            )}

            {feedback && (
              <Box p={6} bg="green.50" borderRadius="3xl" borderLeftWidth={4} borderLeftColor="green.400" boxShadow="sm">
                <Text fontWeight="bold" fontSize="sm" color="green.700" mb={2}>REPORT FEEDBACK</Text>
                <Text fontSize="xs" color="green.600" lineHeight="tall">{feedback}</Text>
              </Box>
            )}

            <Box p={6} bg="white" borderRadius="3xl" borderWidth={1} borderColor={borderColor} boxShadow="sm">
              <HStack mb={4}>
                <MdQuestionAnswer color="#ed64a6" />
                <Text fontWeight="bold" fontSize="xs">HOW IT WORKS</Text>
              </HStack>
              <VStack align="left" spacing={3}>
                <Box>
                  <Text fontWeight="bold" fontSize="2xs" color="gray.500">1. PICK A CONTEXT</Text>
                  <Text fontSize="2xs" color="gray.600">Select real-world situations like checking into a hotel or ordering coffee.</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" fontSize="2xs" color="gray.500">2. INTERACT</Text>
                  <Text fontSize="2xs" color="gray.600">Text naturally. The AI will respond as the counter-part.</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" fontSize="2xs" color="gray.500">3. GET HINTS</Text>
                  <Text fontSize="2xs" color="gray.600">The AI provides grammar corrections or "better ways to say" during the session.</Text>
                </Box>
              </VStack>
            </Box>

            {!sessionId && (
              <Box p={6} bg={chatBg} borderRadius="3xl" borderStyle="dashed" borderWidth="1px" borderColor="learning.200">
                 <Text fontSize="2xs" color="learning.400" fontWeight="bold">SCENARIO DETAILS</Text>
                 {scenario ? (
                   <VStack align="left" spacing={2} mt={2}>
                      <Text fontWeight="bold" fontSize="sm">{scenario.title}</Text>
                      <Text fontSize="xs" color="gray.500">{scenario.description}</Text>
                      <Badge colorScheme="learning" alignSelf="start" borderRadius="full">Difficulty {scenario.difficulty}</Badge>
                   </VStack>
                 ) : (
                   <Text fontSize="xs" color="gray.400" mt={2}>Select a scenario above to see details.</Text>
                 )}
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

export default RoleplayDrillPanel;
