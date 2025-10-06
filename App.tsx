import { useEffect } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import Toast from 'react-native-toast-message';
import AppNavigator from '@navigation/AppNavigator';
import { useNavigationTheme } from '@hooks/useTheme';
import { useDietStore } from '@store/dietStore';
import { getDateISO } from '@utils/time';
import { scheduleSnoozeNotification } from '@services/notifications';

const App = () => {
  const navigationTheme = useNavigationTheme();
  const hydrate = useDietStore((state) => state.hydrate);
  const hydrated = useDietStore((state) => state.hydrated);
  const markMeal = useDietStore((state) => state.markMeal);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const { mealId, dietId } = response.notification.request.content.data as {
        mealId?: string;
        dietId?: string;
      };
      if (!mealId) return;

      const storeState = useDietStore.getState();
      const diet = dietId
        ? storeState.dietas.find((item) => item.id === dietId)
        : storeState.dietas.find((item) => item.dias.some((dia) => dia.refeicoes.some((meal) => meal.id === mealId)));
      const meal = diet?.dias.flatMap((dia) => dia.refeicoes).find((item) => item.id === mealId);

      if (response.actionIdentifier === 'MARK_DONE') {
        await markMeal(mealId, getDateISO(), true);
        Toast.show({ type: 'success', text1: 'Refeicao registrada.' });
      } else if (response.actionIdentifier === 'SNOOZE_10' && meal) {
        await scheduleSnoozeNotification(meal, 10);
        Toast.show({ type: 'info', text1: 'Soneca de 10 minutos ativada.' });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [markMeal]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const statusBarStyle = navigationTheme.dark ? 'light-content' : 'dark-content';

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar barStyle={statusBarStyle} />
      <AppNavigator />
      {/* Toast host already configured */}
      <Toast position="bottom" />
    </NavigationContainer>
  );
};

export default App;
