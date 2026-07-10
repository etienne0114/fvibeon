import { SimpleGrid, Stack, Text } from '@chakra-ui/react';
import { SectionCard, SectionHeading, StatCard } from '../../../components';
import { useAnalytics } from '../../../hooks/useAnalytics';

const AnalyticsPanel = () => {
  const { data, isLoading, error } = useAnalytics();

  if (error) {
    return (
      <SectionCard>
        <SectionHeading title="Analytics" subtitle="Real-time stats" />
        <Text color="red.500">{error}</Text>
      </SectionCard>
    );
  }

  return (
    <SectionCard>
      <SectionHeading title="Analytics" subtitle="Real-time stats" />
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mt={2}>
        <StatCard label="Courses completed" value={data?.completedCourses ?? 0} helper="Lifetime" />
        <StatCard label="Average progress" value={`${(data?.averageProgress ?? 0).toFixed(1)}%`} helper="Across active enrollments" />
        <StatCard label="Most recent" value={data?.mostRecentCourse?.title ?? 'None'} helper="Latest course" />
      </SimpleGrid>
      {isLoading && <Text fontSize="sm" color="gray.500">Loading analytics...</Text>}
    </SectionCard>
  );
};

export default AnalyticsPanel;
