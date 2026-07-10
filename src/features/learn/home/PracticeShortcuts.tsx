import { Button, Box, Flex, SimpleGrid, Stack, Text, useColorModeValue } from '@chakra-ui/react';
import { SectionCard, SectionHeading } from '../../../components';
import { motion } from 'framer-motion';

export type PracticeShortcut = {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: string;
};

interface PracticeShortcutsProps {
  shortcuts: PracticeShortcut[];
  onAction: (section: string) => void;
}

const PracticeShortcuts = ({ shortcuts, onAction }: PracticeShortcutsProps) => (
  <SectionCard>
    <SectionHeading title="Practice shortcuts" subtitle="Jump right into a focused session" />
    <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={4}>
      {shortcuts.map((shortcut) => (
        <motion.div key={shortcut.id} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
          <Box
            bg={useColorModeValue('white', 'gray.800')}
            borderWidth={1}
            borderColor="gray.100"
            borderRadius="2xl"
            p={6}
            boxShadow="premium"
            transition="all 0.3s ease"
            _hover={{ boxShadow: 'premium-hover' }}
          >
            <Stack spacing={3}>
              <Flex
                w={12}
                h={12}
                bg="learning.50"
                borderRadius="xl"
                align="center"
                justify="center"
              >
                <Text fontSize="2xl">{shortcut.icon}</Text>
              </Flex>
              <Text fontWeight="800" fontSize="md" color="gray.800" letterSpacing="tight">
                {shortcut.title}
              </Text>
              <Text fontSize="sm" color="gray.500" fontWeight="medium">
                {shortcut.description}
              </Text>
              <Button
                size="sm"
                colorScheme="learning"
                variant="outline"
                alignSelf="flex-start"
                onClick={() => onAction(shortcut.id)}
                borderRadius="lg"
                _hover={{ bg: 'learning.50' }}
              >
                {shortcut.action}
              </Button>
            </Stack>
          </Box>
        </motion.div>
      ))}
    </SimpleGrid>
  </SectionCard>
);

export default PracticeShortcuts;
