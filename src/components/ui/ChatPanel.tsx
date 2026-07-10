import { 
  Box, Button, FormControl, Input, Stack, 
  InputGroup, InputRightElement, IconButton, Text,
  VStack, Icon
} from '@chakra-ui/react';
import { IoSend } from 'react-icons/io5';
import { motion } from 'framer-motion';

interface ChatPanelProps {
  message: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isSending?: boolean;
  helperText?: string;
}

const ChatPanel = ({ message, onChange, onSend, isSending = false, helperText }: ChatPanelProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <Box 
      bg="white" 
      borderRadius="2xl" 
      p={8} 
      boxShadow="premium"
      border="1px solid"
      borderColor="gray.100"
      position="relative"
      overflow="hidden"
    >
      <Box 
        position="absolute" 
        top={0} 
        left={0} 
        w="full" 
        h="3px" 
        bg="learning.500" 
      />
      
      <VStack spacing={6} align="stretch">
        <Stack spacing={2}>
          <Text fontWeight="800" fontSize="lg" color="gray.800" letterSpacing="tight">
            Chat with your AI tutor
          </Text>
          <Text fontSize="sm" color="gray.500">
            Ask for pronunciation tips, grammar fixes, or just practice your conversation skills.
          </Text>
        </Stack>

        <FormControl>
          <InputGroup size="lg">
            <Input
              value={message}
              onChange={(event) => onChange(event.target.value)}
              placeholder="Type your message here..."
              bg="gray.50"
              border="none"
              _focus={{ 
                bg: 'white', 
                boxShadow: '0 0 0 2px var(--chakra-colors-learning-200)',
                transform: 'translateY(-1px)'
              }}
              borderRadius="xl"
              pr="4.5rem"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  onSend();
                }
              }}
            />
            <InputRightElement width="4rem" h="full" pr={1}>
              <IconButton
                aria-label="Send message"
                icon={<Icon as={IoSend} />}
                colorScheme="learning"
                size="sm"
                borderRadius="lg"
                onClick={onSend}
                isLoading={isSending}
                isDisabled={!message.trim()}
                _hover={{ transform: 'scale(1.1)' }}
                transition="all 0.2s"
              />
            </InputRightElement>
          </InputGroup>
        </FormControl>

        <Stack direction="row" spacing={2} align="center">
           <Button 
            variant="ghost" 
            size="sm" 
            fontSize="xs" 
            color="gray.400"
            _hover={{ bg: 'learning.50', color: 'learning.600' }}
            onClick={() => onChange("Give me a pronunciation tip for 'literally'")}
          >
            "How to pronounce..."
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            fontSize="xs" 
            color="gray.400"
            _hover={{ bg: 'brand.50', color: 'brand.600' }}
            onClick={() => onChange("Explain the past perfect continuous")}
          >
            "Explain grammar..."
          </Button>
        </Stack>

        {helperText && (
          <Box 
            fontSize="xs" 
            color="learning.600" 
            bg="learning.50" 
            p={3} 
            borderRadius="lg" 
            fontWeight="medium"
            borderLeft="4px solid"
            borderColor="learning.400"
          >
            {helperText}
          </Box>
        )}
      </VStack>
    </Box>
  </motion.div>
);

export default ChatPanel;
