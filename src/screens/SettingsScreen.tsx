import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@hooks/useTheme';
import { useDietStore } from '@store/dietStore';

const snoozeOptions = [5, 10, 15];
const themeOptions = [
  { label: 'Sistema', value: 'system' as const },
  { label: 'Claro', value: 'light' as const },
  { label: 'Escuro', value: 'dark' as const },
];

const SettingsScreen = () => {
  const colors = useThemeColors();
  const config = useDietStore((state) => state.config);
  const setConfig = useDietStore((state) => state.setConfig);
  const exportData = useDietStore((state) => state.exportData);
  const importData = useDietStore((state) => state.importData);
  const [working, setWorking] = useState(false);

  const toggleNotifications = async (value: boolean) => {
    setWorking(true);
    await setConfig({ notificationsEnabled: value });
    setWorking(false);
    const updated = useDietStore.getState().config.notificationsEnabled;
    if (updated === value) {
      Toast.show({ type: 'info', text1: value ? 'Notificacoes ativadas.' : 'Notificacoes desativadas.' });
    } else if (value) {
      Toast.show({ type: 'error', text1: 'Permissao de notificacao nao concedida.' });
    } else {
      Toast.show({ type: 'info', text1: 'Notificacoes desativadas.' });
    }
  };

  const selectTheme = (value: typeof config.theme) => {
    setConfig({ theme: value });
  };

  const selectSnooze = (minutes: number) => {
    setConfig({ defaultSnoozeMinutes: minutes });
    Toast.show({ type: 'info', text1: `Soneca padrao: ${minutes} minutos.` });
  };

  const handleExport = async () => {
    setWorking(true);
    try {
      const uri = await exportData();
      Toast.show({ type: 'success', text1: 'Backup gerado.', text2: uri });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Falha ao exportar dados.' });
    } finally {
      setWorking(false);
    }
  };

  const handleImport = async () => {
    setWorking(true);
    try {
      await importData();
      Toast.show({ type: 'success', text1: 'Dados importados.' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Falha ao importar arquivo.' });
    } finally {
      setWorking(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Notificacoes</Text>
        <View style={[styles.itemRow, { borderColor: colors.border }]}>
          <View>
            <Text style={[styles.itemTitle, { color: colors.text }]}>Alarmes de refeicao</Text>
            <Text style={[styles.itemSubtitle, { color: colors.muted }]}>Ativa lembretes nos horarios configurados.</Text>
          </View>
          <Switch
            value={config.notificationsEnabled}
            disabled={working}
            onValueChange={toggleNotifications}
          />
        </View>
        <Pressable
          accessibilityRole="link"
          onPress={() => Linking.openSettings()}
          style={styles.linkButton}
        >
          <Text style={{ color: colors.primary }}>Abrir configuracoes do sistema</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Tema</Text>
        <View style={styles.row}>
          {themeOptions.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.chip,
                {
                  backgroundColor: config.theme === option.value ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => selectTheme(option.value)}
            >
              <Text style={{ color: config.theme === option.value ? '#FFFFFF' : colors.text, fontWeight: '600' }}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Soneca padrao</Text>
        <View style={styles.row}>
          {snoozeOptions.map((minutes) => (
            <Pressable
              key={minutes}
              onPress={() => selectSnooze(minutes)}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    config.defaultSnoozeMinutes === minutes ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: config.defaultSnoozeMinutes === minutes ? '#FFFFFF' : colors.text,
                  fontWeight: '600',
                }}
              >
                {minutes} min
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Backup</Text>
        <Pressable
          accessibilityRole="button"
          onPress={handleExport}
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.primaryButtonText}>Exportar JSON</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={handleImport} style={[styles.secondaryButton, { borderColor: colors.primary }]}>
          <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Importar JSON</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  itemRow: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemSubtitle: {
    fontSize: 13,
  },
  linkButton: {
    alignSelf: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  primaryButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default SettingsScreen;
