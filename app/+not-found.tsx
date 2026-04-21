import { View, Text } from 'react-native';
import { Link } from 'expo-router';

export default function NotFound() {
  return (
    <View className="flex-1 items-center justify-center bg-brand-navy">
      <Text className="text-white text-xl font-semibold">Screen not found</Text>
      <Link href="/" className="mt-4 text-brand-orange text-base">
        Go home
      </Link>
    </View>
  );
}
