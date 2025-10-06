import { FC } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Dieta } from '@types/diet';
import { useThemeColors } from '@hooks/useTheme';

interface DietCardProps {
  diet: Dieta;
  onOpen: () => void;
  onSetActive: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const objetivoLabels: Record<Dieta['objetivo'], string> = {
  BULKING: 'Bulking',
  CUT: 'Cut',
  MANUTENCAO: 'Manutencao',
  CUSTOM: 'Custom',
};

export const DietCard: FC<DietCardProps> = ({ diet, onOpen, onSetActive, onDuplicate, onDelete }) => {
  const colors = useThemeColors();
  const borderColor = diet.ativa ? colors.primary : colors.border;

  const confirmDeletion = () => {
    Alert.alert('Excluir dieta', `Tem certeza que deseja remover ${diet.nome}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onOpen}
      style={[styles.container, { borderColor, backgroundColor: colors.card }]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>{diet.nome}</Text>
        {diet.ativa && <Text style={[styles.badge, { backgroundColor: colors.primary }]}>Ativa</Text>}
      </View>
      <Text style={[styles.subtitle, { color: colors.muted }]}>{objetivoLabels[diet.objetivo]}</Text>
      {diet.descricao ? (
        <Text style={[styles.description, { color: colors.muted }]} numberOfLines={2}>
          {diet.descricao}
        </Text>
      ) : null}

      <View style={styles.footerRow}>
        <Pressable accessibilityRole="button" onPress={onSetActive} style={styles.actionButton}>
          <Text style={[styles.actionText, { color: colors.primary }]}>
            {diet.ativa ? 'Ativa' : 'Ativar'}
          </Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onDuplicate} style={styles.actionButton}>
          <Text style={[styles.actionText, { color: colors.muted }]}>Duplicar</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={confirmDeletion} style={styles.actionButton}>
          <Text style={[styles.actionText, { color: colors.danger }]}>Excluir</Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  badge: {
    color: '#FFFFFF',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
  },
  description: {
    marginTop: 8,
    fontSize: 13,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
