import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider
      value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
    >
      <Stack>
        <Stack.Screen
          name="index"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="explore"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="journey"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="active-journey"
          options={{ headerShown: false }}
        />
      </Stack>
    </ThemeProvider>
  );
}