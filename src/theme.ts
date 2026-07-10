import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const colors = {
  learning: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899', // Vibrant pink
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
  },
  brand: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6', // Indigo-ish violet
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  },
  accent: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  }
};

const theme = extendTheme({
  config,
  colors,
  fonts: {
    heading: '"Outfit", "Inter", system-ui, sans-serif',
    body: '"Inter", system-ui, sans-serif',
  },
  shadows: {
    premium: '0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
    'premium-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.07), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    glass: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
  },
  radii: {
    '4xl': '2rem',
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: 'xl',
        transition: 'all 0.2s cubic-bezier(.08,.52,.52,1)',
      },
      variants: {
        solid: (props: any) => ({
          bg: props.colorScheme === 'learning' ? 'learning.500' : undefined,
          _hover: {
            bg: props.colorScheme === 'learning' ? 'learning.600' : undefined,
            transform: 'translateY(-1px)',
            boxShadow: 'md',
          },
          _active: {
            transform: 'translateY(0)',
          },
        }),
      },
    },
    Input: {
      variants: {
        filled: {
          field: {
            borderRadius: 'xl',
            bg: 'gray.50',
            _focus: {
              bg: 'white',
              borderColor: 'learning.300',
              boxShadow: '0 0 0 1px var(--chakra-colors-learning-300)',
            },
          },
        },
      },
      defaultProps: {
        variant: 'filled',
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: '2xl',
          boxShadow: 'premium',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          _hover: {
            boxShadow: 'premium-hover',
          },
        },
      },
    },
  },
});

export default theme;

