import { View, Text, TouchableOpacity } from 'react-native';
import { usePathname, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Block } from '@/store/useProgressionStore';
import { BLOCK_REQUIREMENTS } from '@/store/useProgressionStore';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface NavItem {
  name: string;
  label: string;
  active: IconName;
  inactive: IconName;
  unlocksAtBlock: Block;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'today',      label: 'Today',      active: 'sunny',      inactive: 'sunny-outline',      unlocksAtBlock: 1 },
  { name: 'library',    label: 'Workouts',   active: 'barbell',    inactive: 'barbell-outline',    unlocksAtBlock: 1 },
  { name: 'nutrition',  label: 'Nutrition',  active: 'nutrition',  inactive: 'nutrition-outline',  unlocksAtBlock: 2 },
  { name: 'progress',   label: 'Progress',   active: 'bar-chart',  inactive: 'bar-chart-outline',  unlocksAtBlock: 3 },
];

interface Props {
  block: Block;
}

export default function Sidebar({ block }: Props) {
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
          const locked = block < item.unlocksAtBlock;

          if (locked) {
            return (
              <View
                key={item.name}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 10,
                  marginBottom: 2,
                  opacity: 0.4,
                }}
              >
                <Ionicons name={item.inactive} size={22} color="#475569" />
                <View style={{ marginLeft: 14, flex: 1 }}>
                  <Text style={{ fontSize: 15, color: '#475569' }}>{item.label}</Text>
                  <Text style={{ fontSize: 11, color: '#334155', marginTop: 1 }}>
                    🔒 {BLOCK_REQUIREMENTS[item.unlocksAtBlock]}
                  </Text>
                </View>
              </View>
            );
          }

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
