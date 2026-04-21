import {
  TouchableOpacity,
  View,
  StyleSheet,
  type TouchableOpacityProps,
  type ViewProps,
} from 'react-native';

interface SelectableCardProps extends TouchableOpacityProps {
  selected?: boolean;
  children: React.ReactNode;
}

export function SelectableCard({
  selected = false,
  children,
  style,
  ...rest
}: SelectableCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      style={[styles.base, selected && styles.selected, style]}
      {...rest}
    >
      {children}
    </TouchableOpacity>
  );
}

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, style, ...rest }: CardProps) {
  return (
    <View style={[styles.base, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  selected: {
    borderColor: '#F97316',
    backgroundColor: '#FFF7ED',
  },
});
