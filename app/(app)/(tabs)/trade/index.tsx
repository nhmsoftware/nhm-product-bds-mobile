import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { useLayoutMode } from "@/libs/layout-mode";

const asks = [
  ["64,291.5", "0.045"],
  ["64,290.1", "1.282"],
  ["64,289.4", "0.890"],
  ["64,288.0", "2.110"],
  ["64,287.2", "0.155"]
];

const bids = [
  ["64,284.1", "0.992"],
  ["64,283.5", "3.401"],
  ["64,282.8", "0.220"],
  ["64,281.0", "0.550"],
  ["64,280.4", "1.102"]
];

export default function TradeTab() {
  const { mode, theme } = useLayoutMode();
  const isProfessionalLayout = mode === "default";
  const palette = isProfessionalLayout ? proPalette : defaultPalette;

  return (
    <Screen padded={false}>
      <View style={[styles.page, { backgroundColor: palette.bg }]}>
        <View style={[styles.header, { borderBottomColor: palette.line }]}>
          <Pressable hitSlop={10} onPress={() => router.back()}>
            <Ionicons color={palette.text} name="arrow-back" size={23} />
          </Pressable>
          <View style={styles.headerSymbol}>
            <View style={styles.symbolRow}>
              <Text style={[styles.symbolTitle, { color: palette.text }]}>BTCUSDT</Text>
              <Ionicons color={palette.muted} name="chevron-down" size={15} />
            </View>
            <Text style={[styles.symbolChange, { color: theme.colors.success }]}>+2.45%</Text>
          </View>
          <View style={styles.headerActions}>
            <Ionicons color={palette.accent} name="bar-chart" size={22} />
            <Ionicons color={palette.text} name="notifications-outline" size={21} />
          </View>
        </View>

        <View style={styles.tradeCanvas}>
          <View style={[styles.priceCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
            <View>
              <Text style={[styles.metricLabel, { color: palette.muted }]}>Giá đánh dấu</Text>
              <Text style={[styles.markPrice, { color: palette.text }]}>64,285.40</Text>
            </View>
            <View style={styles.fundingBox}>
              <Text style={[styles.fundingLabel, { color: palette.muted }]}>Funding / Đếm ngược</Text>
              <Text style={[styles.fundingValue, { color: theme.colors.success }]}>0.0100% / 04:22:15</Text>
            </View>
            <View style={[styles.curveLine, { borderColor: palette.accent }]} />
          </View>

          <View style={styles.terminalGrid}>
            <View style={styles.orderPanel}>
              <View style={styles.leverageRow}>
                <Pill label="Cross" palette={palette} />
                <Pill label="125x" palette={palette} />
              </View>

              <View style={styles.orderTabs}>
                <Text style={[styles.orderTabActive, { borderBottomColor: palette.accent, color: palette.text }]}>
                  Giới hạn
                </Text>
                <Text style={[styles.orderTab, { color: palette.muted }]}>Thị trường</Text>
              </View>

              <InputPreview label="Giá" palette={palette} suffix="USDT" value="64,285.4" />
              <InputPreview label="Số lượng" palette={palette} suffix="BTC" value="Tối thiểu 0.001" />

              <View style={styles.percentRow}>
                {[25, 50, 75, 100].map((value) => (
                  <View key={value} style={styles.percentItem}>
                    <View style={[styles.percentDot, { backgroundColor: value === 25 ? palette.accent : palette.line }]} />
                    <Text style={[styles.percentText, { color: palette.muted }]}>{value}%</Text>
                  </View>
                ))}
              </View>

              <View style={styles.availableRow}>
                <Text style={[styles.smallMuted, { color: palette.muted }]}>Khả dụng</Text>
                <Text style={[styles.availableValue, { color: palette.text }]}>1,245.82 USDT</Text>
              </View>

              <View style={styles.tpRow}>
                <Text style={[styles.smallMuted, { color: palette.muted }]}>TP/SL</Text>
                <View style={[styles.switchMock, { backgroundColor: palette.line }]}>
                  <View style={[styles.switchDot, { backgroundColor: palette.muted }]} />
                </View>
              </View>

              <Pressable style={[styles.buyButton, { backgroundColor: theme.colors.success }]}>
                <Text style={styles.tradeButtonText}>MUA / LONG</Text>
              </Pressable>
              <Pressable style={[styles.sellButton, { backgroundColor: theme.colors.danger }]}>
                <Text style={[styles.tradeButtonText, styles.sellButtonText]}>BÁN / SHORT</Text>
              </Pressable>
            </View>

            <View style={[styles.bookPanel, { borderLeftColor: palette.line }]}>
              <View style={styles.bookHeader}>
                <Text style={[styles.bookHeadText, { color: palette.muted }]}>Giá</Text>
                <Text style={[styles.bookHeadText, { color: palette.muted }]}>S.Lượng</Text>
              </View>
              {asks.map(([price, size]) => (
                <BookRow key={price} color={theme.colors.danger} price={price} size={size} />
              ))}
              <View style={[styles.currentPriceBlock, { backgroundColor: palette.currentBg }]}>
                <Text style={[styles.currentPrice, { color: theme.colors.success }]}>64,285.4</Text>
                <Text style={[styles.currentSub, { color: palette.muted }]}>≈ $64,285.4</Text>
              </View>
              {bids.map(([price, size]) => (
                <BookRow key={price} color={theme.colors.success} price={price} size={size} />
              ))}
            </View>
          </View>

          <View style={styles.positionTabs}>
            <Pressable onPress={() => router.push("/(app)/(tabs)/trade/positions")}>
              <Text style={[styles.positionTabActive, { borderBottomColor: palette.accent, color: palette.text }]}>
                Vị thế (1)
              </Text>
            </Pressable>
            <Text style={[styles.positionTab, { color: palette.muted }]}>Lệnh mở (0)</Text>
            <View style={styles.positionTools}>
              <Ionicons color={palette.muted} name="bar-chart-outline" size={20} />
              <Ionicons color={palette.muted} name="refresh-outline" size={20} />
            </View>
          </View>

          <View style={[styles.previewCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
            <View style={styles.previewHeader}>
              <View style={styles.previewSymbolRow}>
                <Text style={[styles.longBadge, { color: theme.colors.success, borderColor: theme.colors.success }]}>
                  LONG
                </Text>
                <Text style={[styles.previewSymbol, { color: palette.text }]}>BTC/USDT</Text>
                <Text style={[styles.previewChip, { backgroundColor: palette.chip, color: palette.muted }]}>Vĩnh cửu</Text>
                <Text style={[styles.previewChip, { backgroundColor: palette.chip, color: palette.muted }]}>125x</Text>
              </View>
              <View style={styles.previewPnl}>
                <Text style={[styles.smallMuted, { color: palette.muted }]}>PNL chưa thực hiện (USDT)</Text>
                <Text style={[styles.pnlValue, { color: theme.colors.success }]}>+45.28</Text>
                <Text style={[styles.pnlPercent, { color: theme.colors.success }]}>(+12.45%)</Text>
              </View>
            </View>

            <View style={styles.previewStats}>
              <PreviewStat label="Kích thước (BTC)" palette={palette} value="0.150" />
              <PreviewStat label="Giá vào lệnh" palette={palette} value="63,950.0" />
              <PreviewStat label="Giá đánh dấu" palette={palette} value="64,285.4" />
              <PreviewStat danger label="Giá thanh lý" palette={palette} value="58,241.2" />
              <PreviewStat label="Ký quỹ" palette={palette} value="124.50 USDT" />
              <PreviewStat success label="Rủi ro" palette={palette} value="2.4%" />
            </View>

            <View style={styles.previewActions}>
              <Pressable style={[styles.previewAction, { backgroundColor: palette.button }]}>
                <Text style={[styles.previewActionText, { color: palette.text }]}>Đóng nhanh</Text>
              </Pressable>
              <Pressable style={[styles.previewAction, { backgroundColor: palette.button }]}>
                <Text style={[styles.previewActionText, { color: palette.text }]}>TP/SL</Text>
              </Pressable>
              <Pressable style={[styles.previewAction, { backgroundColor: palette.button }]}>
                <Text style={[styles.previewActionText, { color: palette.text }]}>Đóng vị thế</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Screen>
  );
}

function Pill({ label, palette }: { label: string; palette: TradePalette }) {
  return (
    <View style={[styles.pill, { backgroundColor: palette.button, borderColor: palette.line }]}>
      <Text style={[styles.pillText, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

function InputPreview({
  label,
  palette,
  suffix,
  value
}: {
  label: string;
  palette: TradePalette;
  suffix: string;
  value: string;
}) {
  return (
    <View style={[styles.inputPreview, { backgroundColor: palette.input, borderColor: palette.line }]}>
      <Text style={[styles.inputLabel, { color: palette.muted }]}>{label}</Text>
      <Text style={[styles.inputValue, { color: palette.text }]}>{value}</Text>
      <Text style={[styles.inputSuffix, { color: palette.muted }]}>{suffix}</Text>
    </View>
  );
}

function BookRow({ color, price, size }: { color: string; price: string; size: string }) {
  return (
    <View style={styles.bookRow}>
      <Text style={[styles.bookPrice, { color }]}>{price}</Text>
      <Text style={styles.bookSize}>{size}</Text>
    </View>
  );
}

function PreviewStat({
  danger,
  label,
  palette,
  success,
  value
}: {
  danger?: boolean;
  label: string;
  palette: TradePalette;
  success?: boolean;
  value: string;
}) {
  const { theme } = useLayoutMode();
  const color = danger ? theme.colors.danger : success ? theme.colors.success : palette.text;

  return (
    <View style={styles.previewStat}>
      <Text style={[styles.previewStatLabel, { color: palette.muted }]}>{label}</Text>
      <Text style={[styles.previewStatValue, { color }]}>{value}</Text>
    </View>
  );
}

type TradePalette = {
  accent: string;
  bg: string;
  bookBg: string;
  button: string;
  card: string;
  chip: string;
  currentBg: string;
  input: string;
  line: string;
  muted: string;
  text: string;
};

const proPalette: TradePalette = {
  accent: "#fcd535",
  bg: "#0b0e14",
  bookBg: "#0d1320",
  button: "#232832",
  card: "#161a1e",
  chip: "#252b34",
  currentBg: "rgba(14, 203, 129, 0.1)",
  input: "#171d28",
  line: "#252a33",
  muted: "#a59d88",
  text: "#f5f5f5"
};

const defaultPalette: TradePalette = {
  accent: "#38bdf8",
  bg: "#101827",
  bookBg: "#101827",
  button: "#233348",
  card: "#1b2638",
  chip: "#2b3a50",
  currentBg: "rgba(56, 189, 248, 0.1)",
  input: "#172235",
  line: "#2c3a52",
  muted: "#9badc2",
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
    gap: 12,
    height: 62,
    paddingHorizontal: 16
  },
  headerSymbol: {
    flex: 1
  },
  symbolRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  symbolTitle: {
    fontSize: 20,
    fontWeight: "900"
  },
  symbolChange: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 1
  },
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16
  },
  tradeCanvas: {
    gap: 14,
    paddingBottom: 42
  },
  priceCard: {
    borderBottomWidth: 1,
    borderRadius: 0,
    flexDirection: "row",
    height: 116,
    justifyContent: "space-between",
    overflow: "hidden",
    padding: 16
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 8
  },
  markPrice: {
    fontSize: 25,
    fontWeight: "900"
  },
  fundingBox: {
    alignItems: "flex-end"
  },
  fundingLabel: {
    fontSize: 11,
    fontWeight: "800"
  },
  fundingValue: {
    fontSize: 12,
    fontWeight: "900",
    marginTop: 5
  },
  curveLine: {
    borderRadius: 90,
    borderTopWidth: 2,
    height: 130,
    opacity: 0.45,
    position: "absolute",
    right: 26,
    top: 26,
    transform: [{ rotate: "19deg" }],
    width: 150
  },
  terminalGrid: {
    flexDirection: "row",
    minHeight: 506
  },
  orderPanel: {
    flex: 0.62,
    gap: 10,
    paddingHorizontal: 16
  },
  bookPanel: {
    borderLeftWidth: 1,
    flex: 0.38,
    gap: 4,
    paddingHorizontal: 12
  },
  leverageRow: {
    flexDirection: "row",
    gap: 8
  },
  pill: {
    alignItems: "center",
    borderRadius: 5,
    borderWidth: 1,
    flex: 1,
    minHeight: 38,
    justifyContent: "center"
  },
  pillText: {
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  orderTabs: {
    alignItems: "center",
    flexDirection: "row",
    gap: 24,
    minHeight: 34
  },
  orderTabActive: {
    borderBottomWidth: 2,
    fontSize: 14,
    fontWeight: "900",
    paddingBottom: 8
  },
  orderTab: {
    fontSize: 14,
    fontWeight: "800",
    paddingBottom: 8
  },
  inputPreview: {
    borderRadius: 7,
    borderWidth: 1,
    minHeight: 58,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  inputValue: {
    fontSize: 17,
    fontWeight: "900",
    marginTop: 6
  },
  inputSuffix: {
    fontSize: 11,
    fontWeight: "900",
    position: "absolute",
    right: 12,
    top: 34
  },
  percentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4
  },
  percentItem: {
    alignItems: "center",
    gap: 5
  },
  percentDot: {
    borderRadius: 6,
    height: 12,
    width: 12
  },
  percentText: {
    fontSize: 10,
    fontWeight: "800"
  },
  availableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2
  },
  smallMuted: {
    fontSize: 12,
    fontWeight: "800"
  },
  availableValue: {
    fontSize: 12,
    fontWeight: "900"
  },
  tpRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2
  },
  switchMock: {
    borderRadius: 10,
    height: 18,
    justifyContent: "center",
    paddingHorizontal: 3,
    width: 34
  },
  switchDot: {
    borderRadius: 6,
    height: 12,
    width: 12
  },
  buyButton: {
    alignItems: "center",
    borderRadius: 6,
    minHeight: 55,
    justifyContent: "center",
    marginTop: 4
  },
  sellButton: {
    alignItems: "center",
    borderRadius: 6,
    minHeight: 55,
    justifyContent: "center"
  },
  tradeButtonText: {
    color: "#071011",
    fontSize: 17,
    fontWeight: "900"
  },
  sellButtonText: {
    color: "#ffffff"
  },
  bookHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4
  },
  bookHeadText: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  bookRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 23
  },
  bookPrice: {
    fontSize: 12,
    fontWeight: "900"
  },
  bookSize: {
    color: "#aeb6c5",
    fontSize: 12,
    fontWeight: "800"
  },
  currentPriceBlock: {
    gap: 2,
    marginHorizontal: -12,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 14
  },
  currentPrice: {
    fontSize: 22,
    fontWeight: "900"
  },
  currentSub: {
    fontSize: 11,
    fontWeight: "800"
  },
  positionTabs: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 16
  },
  positionTabActive: {
    borderBottomWidth: 2,
    fontSize: 20,
    fontWeight: "900",
    paddingBottom: 8
  },
  positionTab: {
    fontSize: 17,
    fontWeight: "900",
    paddingBottom: 8
  },
  positionTools: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 14,
    justifyContent: "flex-end"
  },
  previewCard: {
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 16,
    padding: 16
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  previewSymbolRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    maxWidth: 210
  },
  longBadge: {
    borderRadius: 3,
    borderWidth: 1,
    fontSize: 10,
    fontWeight: "900",
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  previewSymbol: {
    fontSize: 20,
    fontWeight: "900"
  },
  previewChip: {
    borderRadius: 4,
    fontSize: 10,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 6,
    paddingVertical: 3
  },
  previewPnl: {
    alignItems: "flex-end",
    maxWidth: 120
  },
  pnlValue: {
    fontSize: 22,
    fontWeight: "900",
    marginTop: 6
  },
  pnlPercent: {
    fontSize: 12,
    fontWeight: "900",
    marginTop: 6
  },
  previewStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 18,
    marginTop: 24
  },
  previewStat: {
    width: "33.33%"
  },
  previewStatLabel: {
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 8
  },
  previewStatValue: {
    fontSize: 15,
    fontWeight: "900"
  },
  previewActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 24
  },
  previewAction: {
    alignItems: "center",
    borderRadius: 6,
    flex: 1,
    justifyContent: "center",
    minHeight: 48
  },
  previewActionText: {
    fontSize: 12,
    fontWeight: "900"
  }
});
