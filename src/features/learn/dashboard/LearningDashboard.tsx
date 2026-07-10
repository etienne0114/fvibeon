import { SimpleGrid, Stack, Text } from '@chakra-ui/react';
import { SectionHeading, StatCard } from '../../../components';

export interface DashboardSummary {
  enrolledCourses: number;
  completedCourses: number;
  activeCourses: number;
}

interface LearningDashboardProps {
  summary?: DashboardSummary | null;
  generatedAt?: string;
  loading?: boolean;
  error?: string | null;
}

const LearningDashboard = ({ summary, generatedAt, loading, error }: LearningDashboardProps) => (
  <Stack spacing={4}>
    <SectionHeading title="Learning dashboard" subtitle="Track your progress" />
    {error && <Text color="red.500">{error}</Text>}
    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
      <StatCard label="Enrolled courses" value={summary?.enrolledCourses ?? 0} helper="Total this term" />
      <StatCard label="Completed" value={summary?.completedCourses ?? 0} helper="Milestones reached" />
      <StatCard label="In progress" value={summary?.activeCourses ?? 0} helper="Courses you are learning" />
    </SimpleGrid>
    {generatedAt && (
      <Text color="gray.400" fontSize="xs">
        Updated {new Date(generatedAt).toLocaleString()}
      </Text>
    )}
  </Stack>
);

export default LearningDashboard;
