import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Divider,
  Tag,
  TagLabel,
  Wrap,
  WrapItem,
  Icon,
  useColorModeValue,
  UnorderedList,
  ListItem,
} from '@chakra-ui/react';
import { MdBook, MdCompareArrows, MdLabelOutline } from 'react-icons/md';
import { DictionaryDefinition } from '../../../../api/dictionary';

interface VocabularyEntryDetailProps {
  definition: DictionaryDefinition;
  onWordClick?: (word: string) => void;
  isTranslated?: boolean;
}

const VocabularyEntryDetail = ({ definition, onWordClick, isTranslated }: VocabularyEntryDetailProps) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const accentColor = isTranslated ? 'learning.500' : 'blue.500';
  const tagScheme = isTranslated ? 'learning' : 'blue';

  if (!definition) return null;

  return (
    <Box 
      w="full" 
      bg={bgColor} 
      p={6} 
      borderRadius="2xl" 
      boxShadow="xl" 
      border="1px solid" 
      borderColor={useColorModeValue('gray.100', 'gray.700')}
    >
      <VStack align="stretch" spacing={6}>
        {/* Header */}
        <HStack justify="space-between">
          <VStack align="start" spacing={0}>
            <Heading size="xl" fontWeight="black" letterSpacing="tight" color={useColorModeValue('gray.800', 'white')}>
              {definition.word}
            </Heading>
            {definition.phonetic && (
              <Text fontSize="md" color="gray.500" fontWeight="medium">
                {definition.phonetic}
              </Text>
            )}
          </VStack>
          {isTranslated && (
            <Badge colorScheme="learning" variant="subtle" px={2} borderRadius="md" textTransform="uppercase">
              Translated
            </Badge>
          )}
        </HStack>

        <Divider />

        {/* Meanings */}
        {definition.meanings?.map((meaning, mIdx) => (
          <Box key={mIdx}>
            <HStack mb={4}>
              <Icon as={MdLabelOutline} color={accentColor} />
              <Heading size="sm" textTransform="uppercase" letterSpacing="widest" color={accentColor}>
                {meaning.partOfSpeech}
              </Heading>
            </HStack>
            
            <VStack align="stretch" spacing={4} pl={2}>
              {meaning.definitions?.map((def, dIdx) => (
                <Box key={dIdx} p={4} bg={useColorModeValue(isTranslated ? 'learning.50' : 'blue.50', 'gray.700')} borderRadius="xl">
                  <Text fontSize="lg" fontWeight="semibold" mb={2}>
                    {def.definition}
                  </Text>
                  
                  {def.example && (
                    <Box mt={3} p={3} borderLeft="4px solid" borderColor={accentColor} bg={useColorModeValue('white', 'gray.800')} borderRadius="md">
                      <Text fontSize="sm" fontStyle="italic" color="gray.600">
                        "{def.example}"
                      </Text>
                    </Box>
                  )}

                  {(def.synonyms?.length || 0) > 0 && (
                    <Box mt={4}>
                      <Text fontSize="xs" fontWeight="bold" color="gray.400" mb={2} textTransform="uppercase">
                        Synonyms
                      </Text>
                      <Wrap spacing={2}>
                        {def.synonyms?.map((syn) => (
                          <WrapItem key={syn}>
                            <Tag 
                              size="sm" 
                              variant="subtle" 
                              colorScheme={tagScheme} 
                              cursor="pointer" 
                              onClick={() => onWordClick?.(syn)}
                              _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
                              transition="all 0.2s"
                            >
                              <TagLabel>{syn}</TagLabel>
                            </Tag>
                          </WrapItem>
                        ))}
                      </Wrap>
                    </Box>
                  )}
                </Box>
              ))}
            </VStack>
          </Box>
        ))}

        {/* Unified Synonyms/Antonyms if any */}
        {((definition.synonyms?.length || 0) > 0 || (definition.antonyms?.length || 0) > 0) && (
          <Box mt={4} p={6} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="2xl">
            <HStack mb={4}>
              <Icon as={MdCompareArrows} boxSize={5} color="purple.400" />
              <Heading size="xs" textTransform="uppercase" color="gray.500">
                Related Words
              </Heading>
            </HStack>
            
            <VStack align="stretch" spacing={4}>
              {definition.synonyms && definition.synonyms.length > 0 && (
                <Box>
                  <Text fontSize="xs" fontWeight="bold" color="purple.400" mb={2} textTransform="uppercase">
                    Global Synonyms
                  </Text>
                  <Wrap spacing={2}>
                    {definition.synonyms.map(syn => (
                      <WrapItem key={syn}>
                        <Tag 
                          variant="outline" 
                          colorScheme="purple" 
                          cursor="pointer" 
                          onClick={() => onWordClick?.(syn)}
                          _hover={{ bg: 'purple.50' }}
                        >
                          <TagLabel>{syn}</TagLabel>
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                </Box>
              )}
              
              {definition.antonyms && definition.antonyms.length > 0 && (
                <Box>
                  <Text fontSize="xs" fontWeight="bold" color="orange.400" mb={2} textTransform="uppercase">
                    Opposite Words
                  </Text>
                  <Wrap spacing={2}>
                    {definition.antonyms.map(ant => (
                      <WrapItem key={ant}>
                        <Tag 
                          variant="outline" 
                          colorScheme="orange" 
                          cursor="pointer" 
                          onClick={() => onWordClick?.(ant)}
                          _hover={{ bg: 'orange.50' }}
                        >
                          <TagLabel>{ant}</TagLabel>
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                </Box>
              )}
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default VocabularyEntryDetail;
