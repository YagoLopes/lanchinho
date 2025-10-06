import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DietEditScreen from '@screens/DietEditScreen';
import DietListScreen from '@screens/DietListScreen';
import ProgressScreen from '@screens/ProgressScreen';
import SettingsScreen from '@screens/SettingsScreen';
import TodayScreen from '@screens/TodayScreen';
import { useThemeColors } from '@hooks/useTheme';

export type RootStackParamList = {
  MainTabs: undefined;
  DietEdit: { dietId?: string } | undefined;
};

export type TabParamList = {
  Hoje: undefined;
  Dietas: undefined;
  Progresso: undefined;
  Configuracoes: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<keyof TabParamList, { active: string; inactive: string }> = {
  Hoje: { active: 'fast-food', inactive: 'fast-food-outline' },
  Dietas: { active: 'restaurant', inactive: 'restaurant-outline' },
  Progresso: { active: 'stats-chart', inactive: 'stats-chart-outline' },
  Configuracoes: { active: 'settings', inactive: 'settings-outline' },
};

const TAB_LABELS: Record<keyof TabParamList, string> = {
  Hoje: 'Hoje',
  Dietas: 'Dietas',
  Progresso: 'Progresso',
  Configuracoes: 'Config',
};

const TabsNavigator = () => {
  const colors = useThemeColors();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ focused, color, size }) => {
          const mapping = TAB_ICONS[route.name as keyof TabParamList];
          const iconName = focused ? mapping.active : mapping.inactive;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarLabel: ({ focused, color }) => (
          <Text style={{ color: focused ? colors.primary : colors.muted, fontWeight: focused ? '600' : '500' }}>
            {TAB_LABELS[route.name as keyof TabParamList]}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Hoje" component={TodayScreen} />
      <Tab.Screen name="Dietas" component={DietListScreen} />
      <Tab.Screen name="Progresso" component={ProgressScreen} />
      <Tab.Screen name="Configuracoes" component={SettingsScreen} />
    </Tab.Navigator>
  );
};
const AppNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="MainTabs" component={TabsNavigator} options={{ headerShown: false }} />
    <Stack.Screen
      name="DietEdit"
      component={DietEditScreen}
      options={({ route }) => ({
        title: route.params?.dietId ? 'Editar Dieta' : 'Nova Dieta',
      })}
    />
  </Stack.Navigator>
);

export default AppNavigator;
