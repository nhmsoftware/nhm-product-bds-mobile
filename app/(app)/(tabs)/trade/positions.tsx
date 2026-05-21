import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { useLayoutMode } from "@/libs/layout-mode";
import { notifyInfo } from "@/libs/notify";

type Position = {
  entry: string;
  id: string;
  isolated: string;
  leverage: string;
  liquidation: string;
  mark: string;
  margin: string;
  pnl: string;
  roe: string;
  side: "buy" | "sell";
  symbol: string;
};

const positions: Position[] = [
  {
    entry: "62,450.00",
    id: "btc",
    isolated: "Cô lập",
    leverage: "20x",
    liquidation: "59,120.00",
    mark: "63,820.15",
    margin: "500.00",
    pnl: "+210.75",
    roe: "+42.15%",
    side: "buy",
    symbol: "BTC/USDT"
  },
  {
    entry: "3,450.20",
    id: "eth",
    isolated: "Cô lập",
    leverage: "10x",
    liquidation: "3,812.00",
    mark: "3,468.50",
    margin: "1,200.00",
    pnl: "-62.40",
    roe: "-5.20%",
    side: "sell",
    symbol: "ETH/USDT"
  },
  {
    entry: "142.00",
    id: "sol",
    isolated: "Chéo",
    leverage: "25x",
    liquidation: "136.20",
    mark: "148.40",
    margin: "250.00",
    pnl: "+281.25",
    roe: "+112.5%",
    side: "buy",
    symbol: "SOL/USDT"
  }
];

export default function OpenPositionsScreen() {
  const { mode, theme } = useLayoutMode();
  const isProfessionalLayout = mode === "default";
  const palette = isProfessionalLayout ? proPalette : defaultPalette;

  const handleAction = (label: string, symbol: string) => {
    notifyInfo({
      message: `${label} ${symbol}`,
      description: "Flow xử lý vị thế sẽ được nối backend trading khi API sẵn sàng."
    });
  };

  return (
    <Screen padded={false}>
      <View style={[styles.page, { backgroundColor: palette.bg }]}>
        <View style={[styles.header, { borderBottomColor: palette.line }]}>
          <Pressable hitSlop={10} onPress={() => router.back()}>
            <Ionicons color={palette.text} name="arrow-back" size={24} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: palette.text }]}>Vị thế đang mở</Text>
          <View style={styles.headerActions}>
            <Ionicons color={palette.muted} name="time-outline" size={22} />
            <Ionicons color={palette.muted} name="notifications-outline" size={21} />
          </View>
        </View>

        <View style={styles.content}>
          <View style={[styles.summaryCard, { backgroundColor: palette.summary, borderColor: palette.line }]}>
            <Text style={[styles.summaryLabel, { color: palette.muted }]}>TỔNG PNL CHƯA THỰC HIỆN (USDT)</Text>
            <View style={styles.summaryPnlRow}>
              <Text style={[styles.summaryPnl, { color: theme.colors.success }]}>+1,245.82</Text>
              <Text style={[styles.summaryPercent, { color: theme.colors.success }]}>(+12.45%)</Text>
            </View>

            <View style={[styles.summaryDivider, { backgroundColor: palette.line }]} />

            <View style={styles.summaryBottom}>
              <View>
                <Text style={[styles.summaryMiniLabel, { color: palette.muted }]}>Số dư ký quỹ</Text>
                <Text style={[styles.summaryMiniValue, { color: palette.text }]}>15,420.00 USDT</Text>
              </View>
              <View style={styles.alignEnd}>
                <Text style={[styles.summaryMiniLabel, { color: palette.muted }]}>Vị thế đang mở</Text>
                <Text style={[styles.summaryMiniValue, { color: palette.text }]}>3 lệnh</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Danh sách vị thế</Text>
            <Pressable style={styles.filterButton}>
              <Ionicons color={palette.muted} name="filter-outline" size={19} />
              <Text style={[styles.filterText, { color: palette.muted }]}>Bộ lọc</Text>
            </Pressable>
          </View>

          <View style={styles.positionsList}>
            {positions.map((position) => (
              <PositionCard
                key={position.id}
                onClose={() => handleAction("Đóng vị thế", position.symbol)}
                onTpSl={() => handleAction("Điều chỉnh TP/SL", position.symbol)}
                palette={palette}
                position={position}
              />
            ))}
          </View>
        </View>
      </View>
    </Screen>
  );
}

function PositionCard({
  onClose,
  onTpSl,
  palette,
  position
}: {
  onClose: () => void;
  onTpSl: () => void;
  palette: PositionsPalette;
  position: Position;
}) {
  const { theme } = useLayoutMode();
  const isProfit = position.roe.startsWith("+");
  const sideColor = position.side === "buy" ? theme.colors.success : theme.colors.danger;

  return (
    <View style={[styles.positionCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
      <View style={styles.positionTop}>
        <View style={styles.symbolBlock}>
          <View style={styles.symbolLine}>
            <Text style={[styles.symbolText, { color: palette.text }]}>{position.symbol}</Text>
            <Text style={[styles.perpetualChip, { backgroundColor: palette.chip, color: palette.muted }]}>VĨNH CỬU</Text>
          </View>
          <View style={styles.sideLine}>
            <Text style={[styles.sideBadge, { backgroundColor: sideColor, color: palette.badgeText }]}>
              {position.side === "buy" ? "MUA" : "BÁN"}
            </Text>
            <Text style={[styles.leverageText, { color: palette.muted }]}>
              {position.isolated} {position.leverage}
            </Text>
          </View>
        </View>

        <View style={styles.roeBlock}>
          <Text style={[styles.roeLabel, { color: palette.muted }]}>ROE %</Text>
          <Text style={[styles.roeValue, { color: isProfit ? theme.colors.success : theme.colors.danger }]}>
            {position.roe}
          </Text>
        </View>
      </View>

      <View style={[styles.cardDivider, { backgroundColor: palette.line }]} />

      <View style={styles.positionStats}>
        <PositionStat label="KÝ QUỸ (USDT)" palette={palette} value={position.margin} />
        <PositionStat
          alignRight
          label="PNL (USDT)"
          palette={palette}
          tone={isProfit ? theme.colors.success : theme.colors.danger}
          value={position.pnl}
        />
        <PositionStat label="GIÁ VÀO LỆNH" palette={palette} value={position.entry} />
        <PositionStat alignRight label="GIÁ ĐÁNH DẤU" palette={palette} value={position.mark} />
        <PositionStat label="GIÁ THANH LÝ" palette={palette} tone={theme.colors.danger} value={position.liquidation} />
      </View>

      <View style={styles.positionActions}>
        <Pressable onPress={onTpSl} style={[styles.secondaryButton, { backgroundColor: palette.button }]}>
          <Text style={[styles.secondaryButtonText, { color: palette.text }]}>Điều chỉnh TP/SL</Text>
        </Pressable>
        <Pressable onPress={onClose} style={[styles.primaryButton, { backgroundColor: palette.closeButton }]}>
          <Text style={[styles.primaryButtonText, { color: palette.closeText }]}>Đóng vị thế</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PositionStat({
  alignRight,
  label,
  palette,
  tone,
  value
}: {
  alignRight?: boolean;
  label: string;
  palette: PositionsPalette;
  tone?: string;
  value: string;
}) {
  return (
    <View style={[styles.statCell, alignRight && styles.alignEnd]}>
      <Text style={[styles.statLabel, { color: palette.muted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: tone || palette.text }]}>{value}</Text>
    </View>
  );
}

type PositionsPalette = {
  badgeText: string;
  bg: string;
  button: string;
  card: string;
  chip: string;
  closeButton: string;
  closeText: string;
  line: string;
  muted: string;
  summary: string;
  text: string;
};

const proPalette: PositionsPalette = {
  badgeText: "#071011",
  bg: "#0b0e14",
  button: "#242933",
  card: "#15191e",
  chip: "#26303a",
  closeButton: "#fcd535",
  closeText: "#05070a",
  line: "#262b34",
  muted: "#a59d88",
  summary: "#1b2028",
  text: "#f5f5f5"
};

const defaultPalette: PositionsPalette = {
  badgeText: "#071011",
  bg: "#101827",
  button: "#334356",
  card: "#1b2638",
  chip: "#2b3a50",
  closeButton: "#ffffff",
  closeText: "#101827",
  line: "#2c3a52",
  muted: "#9badc2",
  summary: "#202c40",
  text: "#eef4ff"
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    minHeight: "100%"
  },
  header: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 14,
    height: 62,
    paddingHorizontal: 16
  },
  headerTitle: {
    flex: 1,
    fontSize: 21,
    fontWeight: "900"
  },
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 18
  },
  content: {
    gap: 24,
    padding: 16,
    paddingBottom: 46
  },
  summaryCard: {
    borderRadius: 10,
    borderWidth: 1,
    gap: 18,
    padding: 24
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8
  },
  summaryPnlRow: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 8
  },
  summaryPnl: {
    fontSize: 34,
    fontWeight: "900"
  },
  summaryPercent: {
    fontSize: 14,
    fontWeight: "900"
  },
  summaryDivider: {
    height: 1
  },
  summaryBottom: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  summaryMiniLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8
  },
  summaryMiniValue: {
    fontSize: 15,
    fontWeight: "900"
  },
  alignEnd: {
    alignItems: "flex-end"
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900"
  },
  filterButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  filterText: {
    fontSize: 15,
    fontWeight: "800"
  },
  positionsList: {
    gap: 16
  },
  positionCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 16
  },
  positionTop: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  symbolBlock: {
    flex: 1,
    gap: 10
  },
  symbolLine: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  symbolText: {
    fontSize: 21,
    fontWeight: "900"
  },
  perpetualChip: {
    borderRadius: 5,
    fontSize: 10,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 3
  },
  sideLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  sideBadge: {
    borderRadius: 2,
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 4
  },
  leverageText: {
    fontSize: 13,
    fontWeight: "800"
  },
  roeBlock: {
    alignItems: "flex-end"
  },
  roeLabel: {
    fontSize: 11,
    fontWeight: "900"
  },
  roeValue: {
    fontSize: 29,
    fontWeight: "900",
    marginTop: 4
  },
  cardDivider: {
    height: 1,
    marginVertical: 18
  },
  positionStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 16
  },
  statCell: {
    width: "50%"
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 7
  },
  statValue: {
    fontSize: 16,
    fontWeight: "900"
  },
  positionActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 26
  },
  secondaryButton: {
    alignItems: "center",
    borderRadius: 10,
    flex: 1,
    justifyContent: "center",
    minHeight: 50
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "900"
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 10,
    flex: 1,
    justifyContent: "center",
    minHeight: 50
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: "900"
  }
});
