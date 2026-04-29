import { View, Text, useWindowDimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  children: React.ReactNode;
}

export default function OnboardingShell({ children }: Props) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  if (!isDesktop) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
        {children}
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a', alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 }}>
      <View style={{ marginBottom: 20, alignItems: 'center' }}>
        <Text style={{ color: '#f97316', fontSize: 26, fontWeight: '700', letterSpacing: -0.5 }}>
          FytNu
        </Text>
        <Text style={{ color: '#475569', fontSize: 12, marginTop: 2 }}>
          Fitness + Nutrition
        </Text>
      </View>

      <View style={{
        flex: 1,
        width: '100%',
        maxWidth: 480,
        backgroundColor: '#1e293b',
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
      }}>
        {children}
      </View>
    </View>
  );
}
