import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { DietCard } from '@components/DietCard';
import { useThemeColors } from '@hooks/useTheme';
import { useDietStore } from '@store/dietStore';
import { RootStackParamList } from '@navigation/AppNavigator';

const DietListScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colors = useThemeColors();
  const diets = useDietStore((state) => state.dietas);
  const deleteDiet = useDietStore((state) => state.deleteDiet);
  const setActiveDiet = useDietStore((state) => state.setActiveDiet);
  const duplicateDiet = useDietStore((state) => state.duplicateDiet);

  const openDiet = useCallback(
    (dietId?: string) => {
      navigation.navigate('DietEdit', dietId ? { dietId } : undefined);
    },
    [navigation],
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={diets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <DietCard
            diet={item}
            onOpen={() => openDiet(item.id)}
            onSetActive={() => setActiveDiet(item.id)}
            onDuplicate={() => duplicateDiet(item.id)}
            onDelete={() => deleteDiet(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Cadastre uma dieta</Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>Comece criando sua primeira dieta.</Text>
          </View>
        }
      />

      <Pressable
        accessibilityRole="button"
        onPress={() => openDiet(undefined)}
        style={[styles.fab, { backgroundColor: colors.primary }]}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 120,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 34,
  },
});

export default DietListScreen;
