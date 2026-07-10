import { Stack } from '@chakra-ui/react';
import { ChatPanel, SectionHeading } from '../../../components';

interface TutorChatProps {
  message: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isSending: boolean;
  helperText?: string;
}

const TutorChat = ({ message, onChange, onSend, isSending, helperText }: TutorChatProps) => (
  <Stack spacing={4}>
    <SectionHeading title="AI tutor" subtitle="Practice anytime" />
    <ChatPanel message={message} onChange={onChange} onSend={onSend} isSending={isSending} helperText={helperText} />
  </Stack>
);

export default TutorChat;
