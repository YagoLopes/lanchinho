import dayjs from 'dayjs';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@hooks/useTheme';
import { useDietStore } from '@store/dietStore';

const ProgressScreen = () => {
  const colors = useThemeColors();
  const historico = useDietStore((state) => state.historico);

  const groupedHistory = useMemo(() => {
    const map = new Map<string, { dateISO: string; total: number; done: number }>();
    historico.forEach((entry) => {
      const group = map.get(entry.dataISO) ?? { dateISO: entry.dataISO, total: 0, done: 0 };
      group.total += 1;
      if (entry.feita) group.done += 1;
      map.set(entry.dataISO, group);
    });
    return Array.from(map.values()).sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));
  }, [historico]);

  const calcAdherence = (days: number) => {
    const cutoff = dayjs().subtract(days - 1, 'day').startOf('day');
    let planned = 0;
    let done = 0;
    groupedHistory.forEach((entry) => {
      if (dayjs(entry.dateISO).isBefore(cutoff, 'day')) return;
      planned += entry.total;
      done += entry.done;
    });
    return planned === 0 ? 0 : Math.round((done / planned) * 100);
  };

  const adherence7 = calcAdherence(7);
  const adherence30 = calcAdherence(30);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Progresso</Text>
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Adesao 7 dias</Text>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>{adherence7}%</Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={{
                width: `${adherence7}%`,
                backgroundColor: colors.primary,
                height: '100%',
                borderRadius: 8,
              }}
            />
          </View>

          <View style={[styles.summaryRow, { marginTop: 16 }]}>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Adesao 30 dias</Text>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>{adherence30}%</Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={{
                width: `${adherence30}%`,
                backgroundColor: colors.primary,
                height: '100%',
                borderRadius: 8,
              }}
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Historico diario</Text>
        {groupedHistory.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={[styles.emptyText, { color: colors.muted }]}>Ainda sem registros. Marque refeicoes em "Hoje".</Text>
          </View>
        ) : (
          groupedHistory.map((entry) => {
            const percentage = entry.total === 0 ? 0 : Math.round((entry.done / entry.total) * 100);
            return (
              <View key={entry.dateISO} style={[styles.historyRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View>
                  <Text style={[styles.historyDate, { color: colors.text }]}>{dayjs(entry.dateISO).format('DD/MM/YYYY')}</Text>
                  <Text style={[styles.historyDetail, { color: colors.muted }]}>
                    {entry.done} de {entry.total} refeicoes
                  </Text>
                </View>
                <Text style={[styles.historyPercent, { color: colors.primary }]}>{percentage}%</Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  progressBar: {
    height: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyBox: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  historyRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyDetail: {
    fontSize: 13,
  },
  historyPercent: {
    fontSize: 18,
    fontWeight: '700',
  },
});

export default ProgressScreen;
