import { View, Text, TouchableOpacity } from 'react-native';
import { usePathname, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const NAV_ITEMS: { name: string; label: string; active: IconName; inactive: IconName }[] = [
  { name: 'today',     label: 'Today',     active: 'sunny',      inactive: 'sunny-outline' },
  { name: 'library',   label: 'Workouts',  active: 'barbell',    inactive: 'barbell-outline' },
  { name: 'nutrition', label: 'Nutrition', active: 'nutrition',  inactive: 'nutrition-outline' },
  { name: 'progress',  label: 'Progress',  active: 'bar-chart',  inactive: 'bar-chart-outline' },
];

export default function Sidebar() {
  const pathname = usePathname();

  function isActive(name: string) {
    return pathname === `/${name}` || pathname.endsWith(`/${name}`);
  }

  return (
    <View style={{
      width: 240,
      backgroundColor: '#1e293b',
      borderRightWidth: 1,
      borderRightColor: '#334155',
      paddingTop: 40,
    }}>
      <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
        <Text style={{ color: '#f97316', fontSize: 24, fontWeight: '700', letterSpacing: -0.5 }}>
          FitLife
        </Text>
        <Text style={{ color: '#475569', fontSize: 12, marginTop: 2 }}>
          Your fitness companion
        </Text>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 8 }}>
        {NAV_ITEMS.map(item => {
          const active = isActive(item.name);
          return (
            <TouchableOpacity
              key={item.name}
              onPress={() => router.push(`/(tabs)/${item.name}` as any)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 10,
                marginBottom: 2,
                backgroundColor: active ? 'rgba(249, 115, 22, 0.12)' : 'transparent',
              }}
            >
              <Ionicons
                name={active ? item.active : item.inactive}
                size={22}
                color={active ? '#f97316' : '#475569'}
              />
              <Text style={{
                marginLeft: 14,
                fontSize: 15,
                fontWeight: active ? '600' : '400',
                color: active ? '#f97316' : '#94a3b8',
              }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
