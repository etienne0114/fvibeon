import { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  Radio,
  RadioGroup,
  Stack,
  Text,
  VStack,
  useColorModeValue,
  Skeleton,
  SkeletonText,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  HStack,
  Divider,
  Center,
} from '@chakra-ui/react';
import { MdRefresh, MdCheckCircle, MdError, MdHistory, MdPlayArrow } from 'react-icons/md';
import { useQuizDrill } from '../../../hooks';

const QuizDrillPanel = () => {
  const {
    currentQuiz,
    answers,
    result,
    history,
    isGenerating,
    isSubmitting,
    error,
    createQuiz,
    updateAnswer,
    submit,
    reset,
  } = useQuizDrill();
  const [topic, setTopic] = useState('Tourism & Language');

  const bg = useColorModeValue('white', 'gray.900');
  const cardBg = useColorModeValue('learning.50', 'gray.800');
  const borderColor = useColorModeValue('learning.100', 'gray.700');
  const accentColor = 'learning.400';

  return (
    <Box p={2}>
      <VStack spacing={8} align="stretch">
        {/* Header & Topic Selection */}
        <Flex justify="space-between" align={{ base: 'column', md: 'row' }} gap={4}>
          <VStack align="left" spacing={0}>
            <Text fontSize="2xl" fontWeight="extrabold" color="gray.800">
              Quiz Drill
            </Text>
            <Text fontSize="sm" color="gray.500">
              AI-generated questions to test your knowledge
            </Text>
          </VStack>
          
          <HStack spacing={2} w={{ base: 'full', md: 'auto' }}>
            <InputGroup size="lg" maxW={{ base: 'full', md: '400px' }}>
              <Input
                placeholder="Enter a topic (e.g. Science, Travel...)"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                bg="white"
                borderRadius="2xl"
                borderColor={borderColor}
                fontSize="sm"
                _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
              />
              <InputRightElement w="auto" pr={2}>
                <Button
                  size="sm"
                  borderRadius="xl"
                  colorScheme="learning"
                  isLoading={isGenerating}
                  onClick={() => createQuiz(topic)}
                  leftIcon={<MdPlayArrow />}
                >
                  Start
                </Button>
              </InputRightElement>
            </InputGroup>
            <IconButton
              aria-label="Reset"
              icon={<MdRefresh />}
              variant="ghost"
              onClick={reset}
              borderRadius="full"
              color="gray.400"
            />
          </HStack>
        </Flex>

        <Divider borderColor={borderColor} />

        <Flex gap={8} direction={{ base: 'column', lg: 'row' }}>
          {/* Main Quiz Area */}
          <Box flex={2}>
            {isGenerating ? (
              <Stack spacing={6}>
                {[1, 2, 3].map((i) => (
                  <Box key={i} p={6} bg="white" borderRadius="3xl" borderWidth={1} borderColor={borderColor}>
                    <SkeletonText noOfLines={2} spacing="4" skeletonHeight="4" />
                    <Stack mt={6} spacing={3}>
                      <Skeleton h="20px" w="60%" />
                      <Skeleton h="20px" w="40%" />
                    </Stack>
                  </Box>
                ))}
              </Stack>
            ) : currentQuiz ? (
              <Stack spacing={6}>
                {currentQuiz.questions.map((question, qIdx) => (
                  <Box 
                    key={question.id} 
                    p={6} 
                    bg="white" 
                    borderRadius="3xl" 
                    borderWidth={1} 
                    borderColor={borderColor}
                    boxShadow="sm"
                  >
                    <Flex justify="space-between" mb={4}>
                      <Badge colorScheme="learning" variant="subtle" borderRadius="full" px={3}>
                        Question {qIdx + 1}
                      </Badge>
                      <Text fontSize="xs" color="gray.400">{question.points} pts</Text>
                    </Flex>
                    <Text fontWeight="bold" fontSize="lg" mb={6} color="gray.700">
                      {question.text}
                    </Text>
                    <RadioGroup
                      value={answers[question.id] || ''}
                      onChange={(value) => updateAnswer(question.id, value)}
                    >
                      <Stack spacing={3}>
                        {question.options.map((option) => (
                          <Box 
                            key={option} 
                            p={3} 
                            borderRadius="xl" 
                            borderWidth={1} 
                            borderColor={answers[question.id] === option ? accentColor : 'gray.100'}
                            bg={answers[question.id] === option ? 'learning.50' : 'transparent'}
                            transition="all 0.2s"
                            _hover={{ bg: 'gray.50' }}
                          >
                            <Radio value={option} colorScheme="learning" w="full">
                              <Text fontSize="sm" ml={2} color="gray.600">{option}</Text>
                            </Radio>
                          </Box>
                        ))}
                      </Stack>
                    </RadioGroup>
                  </Box>
                ))}
                <Button
                  size="lg"
                  colorScheme="learning"
                  borderRadius="2xl"
                  isLoading={isSubmitting}
                  onClick={() => submit(currentQuiz.quizId)}
                  h="60px"
                  fontSize="md"
                  boxShadow="lg"
                >
                  Submit Quiz
                </Button>
              </Stack>
            ) : (
              <Center p={20} bg={cardBg} borderRadius="3xl" borderStyle="dashed" borderWidth="2px" borderColor={borderColor}>
                <VStack spacing={4}>
                  <Box fontSize="4xl">📝</Box>
                  <Text color="gray.500" fontWeight="medium" textAlign="center">Select a topic and click "Start" to generate an AI quiz.</Text>
                </VStack>
              </Center>
            )}
          </Box>

          {/* Results & History Sidebar */}
          <VStack flex={1} spacing={6} align="stretch">
            {result && (
              <Box p={6} bg="white" borderRadius="3xl" borderWidth={2} borderColor={result.passed ? 'green.100' : 'learning.100'} boxShadow="xl">
                <Flex justify="space-between" align="center" mb={4}>
                  <Text fontWeight="black" fontSize="xl">Results</Text>
                  <Badge colorScheme={result.passed ? 'green' : 'red'} borderRadius="full" px={3}>
                    {result.passed ? 'PASSED' : 'FAILED'}
                  </Badge>
                </Flex>
                <VStack spacing={1} align="stretch">
                  <Text fontSize="3xl" fontWeight="black" color={result.passed ? 'green.500' : 'learning.500'}>
                    {result.percentage}%
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    You scored {result.score} out of {result.maxScore} points.
                  </Text>
                </VStack>
                <Divider my={4} />
                <Stack spacing={3} maxH="300px" overflowY="auto" pr={2}>
                  {result.results.map((row) => (
                    <Box key={row.questionId} p={3} bg="gray.50" borderRadius="xl">
                      <Flex gap={2}>
                        {row.correct ? <MdCheckCircle color="#48BB78" /> : <MdError color="#F687B3" />}
                        <Text fontSize="xs" fontWeight="bold" noOfLines={2}>
                          {row.question}
                        </Text>
                      </Flex>
                      {!row.correct && (
                        <Text fontSize="2xs" color="gray.500" mt={1} ml={6}>
                          Correct: {row.correctAnswer}
                        </Text>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            <Box p={6} bg={cardBg} borderRadius="3xl" borderWidth={1} borderColor={borderColor}>
              <HStack mb={4}>
                <MdHistory color="#ed64a6" />
                <Text fontWeight="bold" fontSize="sm">RECENT HISTORY</Text>
              </HStack>
              {history.length > 0 ? (
                <Stack spacing={3}>
                  {history.map((item) => (
                    <Flex key={item.id} justify="space-between" align="center" p={3} bg="white" borderRadius="xl" boxShadow="sm">
                      <VStack align="left" spacing={0}>
                        <Text fontSize="xs" fontWeight="bold" color="gray.700" noOfLines={1}>{item.quizTitle}</Text>
                        <Text fontSize="2xs" color="gray.400">{new Date(item.completedAt).toLocaleDateString()}</Text>
                      </VStack>
                      <Badge colorScheme={item.passed ? 'green' : 'learning'} variant="subtle" borderRadius="full">
                        {item.score}%
                      </Badge>
                    </Flex>
                  ))}
                </Stack>
              ) : (
                <Text fontSize="xs" color="gray.500" textAlign="center" py={4}>No quiz history yet.</Text>
              )}
            </Box>
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

export default QuizDrillPanel;
