import { SimpleGrid, Skeleton, Stack, Text } from '@chakra-ui/react';
import { CourseCard, EmptyState, SectionHeading } from '../../../components';
import { useCourses } from '../../../hooks/useCourses';

interface CourseExplorerProps {
  enabled?: boolean;
  limit?: number;
}

const CourseExplorer = ({ enabled = true, limit = 6 }: CourseExplorerProps) => {
  const { courses, isLoading, error, onEnroll } = useCourses({ enabled, limit });

  if (isLoading) {
    return (
      <Stack spacing={6}>
        <SectionHeading title="Courses" subtitle="Pick a language path" />
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={4}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height="220px" borderRadius="2xl" />
          ))}
        </SimpleGrid>
      </Stack>
    );
  }

  if (courses.length === 0) {
    return (
      <EmptyState title="No courses yet" description="We are curating new language paths for you." icon="📚" />
    );
  }

  return (
    <Stack spacing={6}>
      <SectionHeading title="Courses" subtitle="Pick a language path" />
      {error && (
        <Text color="red.500" fontSize="sm" fontWeight="medium">{error}</Text>
      )}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={4}>
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            title={course.title}
            description={course.description}
            level={course.level}
            learners={course._count?.enrollments || 0}
            duration={course.estimatedDuration}
            onEnroll={() => onEnroll(course.id)}
          />
        ))}
      </SimpleGrid>
    </Stack>
  );
};

export default CourseExplorer;
