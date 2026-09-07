import type { Preview } from '@storybook/react-native';
import { BarlowCondensed_600SemiBold } from '@expo-google-fonts/barlow-condensed/600SemiBold';
import { BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed/700Bold';
import { BarlowCondensed_800ExtraBold } from '@expo-google-fonts/barlow-condensed/800ExtraBold';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { useFonts } from 'expo-font';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '@/lib/bootstrap/ThemeProvider';
import { DialogProvider } from '@/lib/components/ui/Dialog';
import '@/lib/i18n/i18n';

function Canvas({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return <View style={[styles.canvas, { backgroundColor: colors.background }]}>{children}</View>;
}

function Providers({ children }: { children: ReactNode }) {
  const [loaded] = useFonts({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    BarlowCondensed_800ExtraBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <DialogProvider>
          <Canvas>{children}</Canvas>
        </DialogProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const preview: Preview = {
  decorators: [(Story) => <Providers><Story /></Providers>],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;

const styles = StyleSheet.create({
  root: { flex: 1 },
  canvas: { flex: 1, justifyContent: 'center', padding: 24 },
});
