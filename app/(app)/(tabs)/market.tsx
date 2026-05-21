import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { Screen } from "@/components/Screen";
import { formatMoney } from "@/libs/format";
import { useLayoutMode } from "@/libs/layout-mode";
import { marketApi } from "@/services/market/api";
import type { Coin } from "@/services/market/types";

type Candle = {
  close: number;
  high: number;
  low: number;
  open: number;
};

type MarketOption = {
  apiSymbol: string;
  category: "crypto" | "favorite" | "xau";
  change: number;
  decimals: number;
  favorite?: boolean;
  name: string;
  price: number;
  symbol: string;
};

type MarketSelectorTab = "favorite" | "all" | "crypto" | "xau";

type OrderBookRow = {
  price: string;
  size: string;
  weight: number;
};

type DetailPalette = {
  accent: string;
  bg: string;
  bottom: string;
  buy: string;
  card: string;
  chartBg: string;
  chip: string;
  danger: string;
  grid: string;
  line: string;
  muted: string;
  sell: string;
  success: string;
  text: string;
};

const regularPalette: DetailPalette = {
  accent: "#fcd535",
  bg: "#0b0e14",
  bottom: "#171b20",
  buy: "#43d88d",
  card: "#171b20",
  chartBg: "#0f1318",
  chip: "#2a2d33",
  danger: "#f6465d",
  grid: "#22272f",
  line: "#242930",
  muted: "#a59d88",
  sell: "#f6465d",
  success: "#0ecb81",
  text: "#f5f5f5"
};

const proPalette: DetailPalette = {
  accent: "#fcd535",
  bg: "#101827",
  bottom: "#1f2a3a",
  buy: "#22c55e",
  card: "#1b2638",
  chartBg: "#0f172a",
  chip: "#263349",
  danger: "#ef4444",
  grid: "#26344f",
  line: "#2b3a52",
  muted: "#9badc2",
  sell: "#ef4444",
  success: "#22c55e",
  text: "#eef4ff"
};

const marketOptions: MarketOption[] = [
  {
    apiSymbol: "BTCUSDT",
    category: "crypto",
    change: 2.45,
    decimals: 2,
    favorite: true,
    name: "Bitcoin",
    price: 67432.12,
    symbol: "BTC/USDT"
  },
  {
    apiSymbol: "ETHUSDT",
    category: "crypto",
    change: 1.82,
    decimals: 2,
    favorite: true,
    name: "Ethereum",
    price: 3521.45,
    symbol: "ETH/USDT"
  },
  {
    apiSymbol: "SOLUSDT",
    category: "crypto",
    change: -0.54,
    decimals: 2,
    favorite: true,
    name: "Solana",
    price: 145.67,
    symbol: "SOL/USDT"
  },
  {
    apiSymbol: "XAUUSD",
    category: "xau",
    change: 0.12,
    decimals: 2,
    favorite: true,
    name: "Vàng Thế Giới",
    price: 2315.4,
    symbol: "XAU/USD"
  },
  {
    apiSymbol: "XAGUSD",
    category: "xau",
    change: -0.28,
    decimals: 3,
    name: "Bạc Thế Giới",
    price: 31.42,
    symbol: "XAG/USD"
  }
];

const candles: Candle[] = [
  { open: 67120, close: 66910, high: 67300, low: 66640 },
  { open: 67180, close: 67520, high: 67680, low: 66620 },
  { open: 67480, close: 67920, high: 68240, low: 66580 },
  { open: 67910, close: 68240, high: 68680, low: 66630 },
  { open: 68120, close: 67560, high: 68340, low: 66620 },
  { open: 67540, close: 67260, high: 67720, low: 66590 },
  { open: 67240, close: 68420, high: 68980, low: 66610 },
  { open: 68410, close: 67840, high: 68520, low: 66640 },
  { open: 66780, close: 66810, high: 66825, low: 66765 }
];

const sellOrders: OrderBookRow[] = [
  { price: "67,450.00", size: "0.452", weight: 0.52 },
  { price: "67,445.10", size: "1.231", weight: 0.86 },
  { price: "67,440.00", size: "0.054", weight: 0.3 },
  { price: "67,438.50", size: "0.892", weight: 0.72 }
];

const buyOrders: OrderBookRow[] = [
  { price: "67,430.00", size: "0.122", weight: 0.42 },
  { price: "67,425.50", size: "2.441", weight: 0.94 },
  { price: "67,420.00", size: "0.667", weight: 0.64 },
  { price: "67,415.10", size: "1.002", weight: 0.78 }
];

const intervals = ["1m", "5m", "15m", "1h", "4h"];

export default function MarketTab() {
  const { mode } = useLayoutMode();
  const [coin, setCoin] = useState<Coin | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<MarketOption>(marketOptions[0]);
  const [selectorVisible, setSelectorVisible] = useState(false);

  const isProfessionalLayout = mode === "default";
  const palette = isProfessionalLayout ? proPalette : regularPalette;

  useEffect(() => {
    let mounted = true;

    marketApi
      .coin(selectedMarket.apiSymbol)
      .then((response) => {
        if (mounted) setCoin(response.data);
      })
      .catch(() => {
        if (mounted) setCoin(null);
      });

    return () => {
      mounted = false;
    };
  }, [selectedMarket.apiSymbol]);

  return (
    <Screen padded={false} scroll={false}>
      <View style={[styles.page, { backgroundColor: palette.bg }]}>
        <MarketHeader
          market={selectedMarket}
          onOpenSelector={() => setSelectorVisible(true)}
          palette={palette}
          pro={isProfessionalLayout}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <QuoteSummary coin={coin} market={selectedMarket} palette={palette} pro={isProfessionalLayout} />

          {isProfessionalLayout ? (
            <ProChartSection palette={palette} />
          ) : (
            <RegularChartSection palette={palette} />
          )}

          <OrderBookSection palette={palette} pro={isProfessionalLayout} />
          <AboutSection market={selectedMarket} palette={palette} pro={isProfessionalLayout} />
        </ScrollView>

        <TradeActions palette={palette} pro={isProfessionalLayout} />

        <MarketSelectorSheet
          currentMarket={selectedMarket}
          onClose={() => setSelectorVisible(false)}
          onSelect={(market) => {
            setSelectedMarket(market);
            setSelectorVisible(false);
          }}
          palette={palette}
          visible={selectorVisible}
        />
      </View>
    </Screen>
  );
}

function MarketHeader({
  market,
  onOpenSelector,
  palette,
  pro
}: {
  market: MarketOption;
  onOpenSelector: () => void;
  palette: DetailPalette;
  pro: boolean;
}) {
  return (
    <View style={[styles.header, { borderBottomColor: palette.line }]}>
      <Pressable hitSlop={10} onPress={() => router.back()}>
        <Ionicons color={palette.text} name="arrow-back" size={24} />
      </Pressable>

      <Pressable onPress={onOpenSelector} style={styles.headerTitleWrap}>
        <View style={styles.headerSymbolRow}>
          <Text style={[styles.headerSymbol, { color: palette.text }]}>{market.symbol}</Text>
          <Ionicons color={palette.muted} name="chevron-down" size={14} />
        </View>
        <Text style={[styles.headerChange, { color: palette.success }]}>+{market.change.toFixed(2)}%</Text>
      </Pressable>

      <View style={styles.headerActions}>
        {pro ? (
          <Pressable hitSlop={10} onPress={onOpenSelector}>
            <Ionicons color={palette.text} name="search-outline" size={23} />
          </Pressable>
        ) : null}
        <Ionicons color={palette.text} name="star-outline" size={23} />
        {!pro ? <Ionicons color={palette.text} name="share-social-outline" size={23} /> : null}
      </View>
    </View>
  );
}

function QuoteSummary({
  coin,
  market,
  palette,
  pro
}: {
  coin: Coin | null;
  market: MarketOption;
  palette: DetailPalette;
  pro: boolean;
}) {
  const decimals = coin?.decimals ?? market.decimals;

  return (
    <View style={[styles.quoteBlock, pro && styles.quoteBlockPro]}>
      <View style={styles.priceBlock}>
        <Text style={[styles.bigPrice, { color: palette.success }]}>{formatMoney(market.price.toFixed(decimals))}</Text>
        <Text style={[styles.vndPrice, { color: palette.muted }]}>≈ 1,712,575,848 VND</Text>
      </View>

      <View style={styles.marketStats}>
        <MarketStat label="Cao 24h" palette={palette} value="68,210.00" />
        <MarketStat label="Thấp 24h" palette={palette} value="66,120.45" />
        <MarketStat label={pro ? "KL (BTC)" : "Khối lượng (BTC)"} palette={palette} value="45.2K" />
        <MarketStat label={pro ? "KL (USDT)" : "Khối lượng (USDT)"} palette={palette} value="3.1B" />
      </View>
    </View>
  );
}

function MarketStat({
  label,
  palette,
  value
}: {
  label: string;
  palette: DetailPalette;
  value: string;
}) {
  return (
    <View style={styles.marketStat}>
      <Text style={[styles.marketStatLabel, { color: palette.muted }]}>{label}</Text>
      <Text style={[styles.marketStatValue, { color: palette.text }]}>{value}</Text>
    </View>
  );
}

function RegularChartSection({ palette }: { palette: DetailPalette }) {
  return (
    <View>
      <View style={[styles.intervalRow, { borderBottomColor: palette.line, borderTopColor: palette.line }]}>
        {intervals.map((item) => (
          <TimeTab active={item === "15m"} key={item} label={item} palette={palette} />
        ))}
        <IndicatorChip label="MA" palette={palette} />
        <IndicatorChip label="EMA" palette={palette} />
        <IndicatorChip label="BOLL" palette={palette} />
      </View>
      <ChartCanvas palette={palette} pro={false} />
    </View>
  );
}

function ProChartSection({ palette }: { palette: DetailPalette }) {
  return (
    <View>
      <View style={[styles.proIntervalRow, { borderBottomColor: palette.line, borderTopColor: palette.line }]}>
        <View style={styles.intervalGroup}>
          {[...intervals, "1d"].map((item) => (
            <TimeTab active={item === "15m"} compact key={item} label={item} palette={palette} />
          ))}
        </View>
        <View style={styles.proChartTools}>
          <Ionicons color={palette.muted} name="analytics-outline" size={15} />
          <Text style={[styles.toolLabel, { color: palette.text }]}>Chỉ báo</Text>
          <Ionicons color={palette.muted} name="scan-outline" size={17} />
          <Ionicons color={palette.muted} name="settings-outline" size={17} />
        </View>
      </View>

      <ChartCanvas palette={palette} pro />

      <View style={[styles.indicatorToolbar, { borderBottomColor: palette.line, borderTopColor: palette.line }]}>
        {["MA", "EMA", "BOLL", "VOL", "THÊM"].map((item, index) => (
          <View key={item} style={styles.indicatorTool}>
            <View style={[styles.indicatorIconBox, { backgroundColor: palette.chip, borderColor: palette.line }]}>
              <Ionicons
                color={index === 4 ? palette.muted : palette.text}
                name={index === 4 ? "add-outline" : "analytics-outline"}
                size={18}
              />
            </View>
            <Text style={[styles.indicatorToolText, { color: index === 4 ? palette.muted : palette.text }]}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function TimeTab({
  active,
  compact,
  label,
  palette
}: {
  active?: boolean;
  compact?: boolean;
  label: string;
  palette: DetailPalette;
}) {
  return (
    <Text
      style={[
        compact ? styles.timeTabCompact : styles.timeTab,
        {
          borderBottomColor: active ? palette.accent : "transparent",
          color: active ? palette.accent : palette.text
        }
      ]}
    >
      {label}
    </Text>
  );
}

function IndicatorChip({ label, palette }: { label: string; palette: DetailPalette }) {
  return (
    <Text style={[styles.indicatorChip, { backgroundColor: palette.chip, color: palette.text }]}>{label}</Text>
  );
}

function ChartCanvas({ palette, pro }: { palette: DetailPalette; pro: boolean }) {
  return (
    <View style={[styles.chartCanvas, pro && styles.chartCanvasPro, { backgroundColor: palette.chartBg }]}>
      <View style={styles.gridOverlay}>
        {[0, 1, 2, 3].map((line) => (
          <View key={`h-${line}`} style={[styles.gridLineHorizontal, { backgroundColor: palette.grid, top: `${18 + line * 21}%` }]} />
        ))}
        {[0, 1, 2, 3].map((line) => (
          <View key={`v-${line}`} style={[styles.gridLineVertical, { backgroundColor: palette.grid, left: `${16 + line * 20}%` }]} />
        ))}
      </View>

      <View style={styles.candleLayer}>
        {candles.map((candle, index) => {
          const up = candle.close >= candle.open;
          const height = Math.max(22, Math.abs(candle.close - candle.open) / 12);
          const wickHeight = Math.max(height + 34, (candle.high - candle.low) / 10);
          const bottom = 30 + ((candle.low - 66500) / 2000) * 120;

          return (
            <View key={`${candle.open}-${index}`} style={[styles.candleSlot, { bottom }]}>
              <View
                style={[
                  styles.candleWick,
                  {
                    backgroundColor: up ? palette.success : palette.danger,
                    height: wickHeight
                  }
                ]}
              />
              <View
                style={[
                  styles.candleBody,
                  {
                    backgroundColor: up ? palette.success : palette.danger,
                    height
                  }
                ]}
              />
            </View>
          );
        })}
      </View>

      {pro ? (
        <>
          <ChartGuide label="TP: 68,000.00" palette={palette} top={86} type="success" />
          <ChartGuide label="67,432.12" palette={palette} top={155} type="success" subtle />
          <ChartGuide label="SL: 66,240.00" palette={palette} top={238} type="danger" />
        </>
      ) : null}

      <View style={styles.axisLabels}>
        {["68,500", "68,000", "67,500", "67,000", "66,500"].map((label) => (
          <Text key={label} style={[styles.axisText, { color: palette.text }]}>{label}</Text>
        ))}
      </View>
    </View>
  );
}

function ChartGuide({
  label,
  palette,
  subtle,
  top,
  type
}: {
  label: string;
  palette: DetailPalette;
  subtle?: boolean;
  top: number;
  type: "danger" | "success";
}) {
  const color = type === "success" ? palette.success : palette.danger;

  return (
    <View style={[styles.chartGuide, { top }]}>
      <View style={[styles.guideDash, { borderColor: color, opacity: subtle ? 0.45 : 0.85 }]} />
      <Text style={[styles.guideLabel, { backgroundColor: color, color: type === "success" ? "#04120b" : "#ffffff" }]}>
        {label}
      </Text>
    </View>
  );
}

function OrderBookSection({ palette, pro }: { palette: DetailPalette; pro: boolean }) {
  return (
    <View style={styles.orderBookSection}>
      <View style={styles.orderBookTitleRow}>
        <Text style={[styles.orderTitle, { color: palette.text }]}>Sổ lệnh</Text>
        <View style={styles.orderHeaders}>
          <Text style={[styles.orderHeader, { color: palette.muted }]}>GIÁ</Text>
          <Text style={[styles.orderHeader, { color: palette.muted }]}>{pro ? "SỐ LƯỢNG" : "Số lượng (BTC)"}</Text>
        </View>
      </View>

      <View style={styles.orderColumns}>
        <View style={styles.orderColumn}>
          {sellOrders.map((item) => (
            <DepthRow item={item} key={item.price} palette={palette} side="sell" />
          ))}
        </View>
        <View style={styles.orderColumn}>
          {buyOrders.map((item) => (
            <DepthRow item={item} key={item.price} palette={palette} side="buy" />
          ))}
        </View>
      </View>
    </View>
  );
}

function DepthRow({
  item,
  palette,
  side
}: {
  item: OrderBookRow;
  palette: DetailPalette;
  side: "buy" | "sell";
}) {
  const color = side === "buy" ? palette.success : palette.danger;

  return (
    <View style={styles.depthRow}>
      <View
        style={[
          styles.depthBar,
          {
            backgroundColor: color,
            opacity: 0.18,
            width: `${Math.round(item.weight * 100)}%`
          }
        ]}
      />
      <Text style={[styles.depthPrice, { color }]}>{item.price}</Text>
      <Text style={[styles.depthSize, { color: palette.text }]}>{item.size}</Text>
    </View>
  );
}

function AboutSection({
  market,
  palette,
  pro
}: {
  market: MarketOption;
  palette: DetailPalette;
  pro: boolean;
}) {
  const assetName = market.symbol.includes("BTC") ? "Bitcoin" : market.name;

  return (
    <View style={[styles.aboutCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
      <View style={styles.aboutHeader}>
        <Text style={[styles.aboutTitle, { color: palette.text }]}>Về {assetName}</Text>
        {pro ? <Text style={[styles.rankBadge, { backgroundColor: "rgba(252, 213, 53, 0.14)", color: palette.accent }]}>#1 TRÊN THỊ TRƯỜNG</Text> : null}
      </View>
      <Text style={[styles.aboutBody, { color: palette.muted }]}>
        {market.symbol.includes("BTC")
          ? "Bitcoin (BTC) là tiền mã hoá đầu tiên trên thế giới, hoạt động trên một mạng lưới phi tập trung sử dụng công nghệ blockchain."
          : `${assetName} là tài sản giao dịch được niêm yết với dữ liệu giá realtime, sổ lệnh và trạng thái biến động trong ngày.`}
      </Text>
      <View style={styles.aboutStats}>
        <AboutStat label="VỐN HOÁ" palette={palette} value={market.symbol.includes("BTC") ? "$1.32T" : "$128.4B"} />
        <AboutStat label="LƯU THÔNG" palette={palette} value={market.symbol.includes("BTC") ? "19.7M BTC" : "Realtime"} />
      </View>
    </View>
  );
}

function AboutStat({
  label,
  palette,
  value
}: {
  label: string;
  palette: DetailPalette;
  value: string;
}) {
  return (
    <View>
      <Text style={[styles.aboutStatLabel, { color: palette.muted }]}>{label}</Text>
      <Text style={[styles.aboutStatValue, { color: palette.text }]}>{value}</Text>
    </View>
  );
}

function TradeActions({
  palette,
  pro
}: {
  palette: DetailPalette;
  pro: boolean;
}) {
  const openTrade = () => {
    router.push("/(app)/(tabs)/trade");
  };

  return (
    <View style={[styles.tradeActions, { backgroundColor: palette.bottom, borderTopColor: palette.line }]}>
      <Pressable onPress={openTrade} style={[styles.actionButton, { backgroundColor: palette.buy }]}>
        <Text style={styles.actionText}>MUA</Text>
        {pro ? <Text style={styles.actionSub}>PHÍ 0% - SPOT</Text> : null}
      </Pressable>
      <Pressable onPress={openTrade} style={[styles.actionButton, { backgroundColor: palette.sell }]}>
        <Text style={[styles.actionText, { color: "#ffffff" }]}>BÁN</Text>
        {pro ? <Text style={styles.actionSub}>ĐÒN BẨY X100</Text> : null}
      </Pressable>
    </View>
  );
}

function MarketSelectorSheet({
  currentMarket,
  onClose,
  onSelect,
  palette,
  visible
}: {
  currentMarket: MarketOption;
  onClose: () => void;
  onSelect: (market: MarketOption) => void;
  palette: DetailPalette;
  visible: boolean;
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<MarketSelectorTab>("favorite");

  const filteredMarkets = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return marketOptions.filter((market) => {
      const matchesKeyword =
        !keyword ||
        market.symbol.toLowerCase().includes(keyword) ||
        market.name.toLowerCase().includes(keyword);
      const matchesTab =
        tab === "all" ||
        (tab === "favorite" && market.favorite) ||
        (tab === "crypto" && market.category === "crypto") ||
        (tab === "xau" && market.category === "xau");

      return matchesKeyword && matchesTab;
    });
  }, [query, tab]);

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.selectorModal}>
        <Pressable onPress={onClose} style={styles.selectorBackdrop} />
        <View style={[styles.selectorSheet, { backgroundColor: palette.card, borderColor: palette.line }]}>
          <View style={styles.selectorHandle} />

          <View style={styles.selectorHeader}>
            <Text style={[styles.selectorTitle, { color: palette.text }]}>Chọn thị trường</Text>
            <Pressable hitSlop={10} onPress={onClose}>
              <Ionicons color={palette.muted} name="close-outline" size={26} />
            </Pressable>
          </View>

          <View style={[styles.selectorSearch, { backgroundColor: palette.chip }]}>
            <Ionicons color={palette.muted} name="search-outline" size={18} />
            <TextInput
              autoCapitalize="characters"
              onChangeText={setQuery}
              placeholder="Tìm kiếm cặp tiền..."
              placeholderTextColor={palette.muted}
              style={[styles.selectorInput, { color: palette.text }]}
              value={query}
            />
          </View>

          <View style={[styles.selectorTabs, { borderBottomColor: palette.line }]}>
            <SelectorTab active={tab === "favorite"} label="Yêu thích" onPress={() => setTab("favorite")} palette={palette} />
            <SelectorTab active={tab === "all"} label="Tất cả" onPress={() => setTab("all")} palette={palette} />
            <SelectorTab active={tab === "crypto"} label="Crypto" onPress={() => setTab("crypto")} palette={palette} />
            <SelectorTab active={tab === "xau"} label="XAU/Forex" onPress={() => setTab("xau")} palette={palette} />
          </View>

          <View style={styles.selectorList}>
            {filteredMarkets.map((market) => {
              const active = currentMarket.apiSymbol === market.apiSymbol;
              const positive = market.change >= 0;

              return (
                <Pressable
                  key={market.apiSymbol}
                  onPress={() => onSelect(market)}
                  style={[styles.marketOption, active && { backgroundColor: "rgba(252, 213, 53, 0.08)" }]}
                >
                  <View>
                    <Text style={[styles.marketOptionSymbol, { color: palette.text }]}>{market.symbol}</Text>
                    <Text style={[styles.marketOptionName, { color: palette.muted }]}>{market.name}</Text>
                  </View>
                  <View style={styles.marketOptionRight}>
                    <Text style={[styles.marketOptionPrice, { color: palette.text }]}>{formatMoney(market.price)}</Text>
                    <Text style={[styles.marketOptionChange, { color: positive ? palette.success : palette.danger }]}>
                      {positive ? "+" : ""}
                      {market.change.toFixed(2)}%
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SelectorTab({
  active,
  label,
  onPress,
  palette
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  palette: DetailPalette;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.selectorTab, { borderBottomColor: active ? palette.accent : "transparent" }]}>
      <Text style={[styles.selectorTabText, { color: active ? palette.accent : palette.muted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    minHeight: "100%"
  },
  scrollContent: {
    paddingBottom: 16
  },
  header: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    height: 58,
    paddingHorizontal: 16
  },
  headerTitleWrap: {
    flex: 1
  },
  headerSymbolRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  headerSymbol: {
    fontSize: 20,
    fontWeight: "900"
  },
  headerChange: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 1
  },
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 17
  },
  quoteBlock: {
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 20
  },
  quoteBlockPro: {
    backgroundColor: "#111a2b"
  },
  priceBlock: {
    flex: 1,
    justifyContent: "center"
  },
  bigPrice: {
    fontSize: 32,
    fontWeight: "900"
  },
  vndPrice: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 4
  },
  marketStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "flex-end",
    width: 164
  },
  marketStat: {
    alignItems: "flex-end",
    width: 76
  },
  marketStatLabel: {
    fontSize: 12,
    fontWeight: "700"
  },
  marketStatValue: {
    fontSize: 13,
    fontWeight: "900",
    marginTop: 2
  },
  intervalRow: {
    alignItems: "center",
    borderBottomWidth: 1,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 14,
    minHeight: 44,
    paddingHorizontal: 16
  },
  proIntervalRow: {
    alignItems: "center",
    borderBottomWidth: 1,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 42,
    paddingHorizontal: 14
  },
  intervalGroup: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14
  },
  timeTab: {
    borderBottomWidth: 2,
    fontSize: 12,
    fontWeight: "800",
    paddingVertical: 11
  },
  timeTabCompact: {
    borderBottomWidth: 2,
    fontSize: 12,
    fontWeight: "800",
    paddingVertical: 9
  },
  indicatorChip: {
    borderRadius: 3,
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 5,
    paddingVertical: 2
  },
  proChartTools: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  toolLabel: {
    fontSize: 12,
    fontWeight: "800"
  },
  chartCanvas: {
    height: 322,
    overflow: "hidden"
  },
  chartCanvasPro: {
    height: 370
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject
  },
  gridLineHorizontal: {
    height: 1,
    left: 0,
    position: "absolute",
    right: 0
  },
  gridLineVertical: {
    bottom: 0,
    position: "absolute",
    top: 0,
    width: 1
  },
  candleLayer: {
    bottom: 30,
    flexDirection: "row",
    gap: 9,
    left: 16,
    position: "absolute"
  },
  candleSlot: {
    alignItems: "center",
    height: 240,
    justifyContent: "flex-end",
    position: "relative",
    width: 14
  },
  candleWick: {
    borderRadius: 1,
    position: "absolute",
    width: 2
  },
  candleBody: {
    borderRadius: 2,
    width: 9
  },
  chartGuide: {
    alignItems: "center",
    flexDirection: "row",
    left: 0,
    position: "absolute",
    right: 0
  },
  guideDash: {
    borderStyle: "dashed",
    borderTopWidth: 1,
    flex: 1
  },
  guideLabel: {
    borderRadius: 2,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 5,
    paddingVertical: 3
  },
  axisLabels: {
    bottom: 18,
    gap: 42,
    position: "absolute",
    right: 6,
    top: 16
  },
  axisText: {
    fontSize: 11,
    fontWeight: "600"
  },
  indicatorToolbar: {
    borderBottomWidth: 1,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  indicatorTool: {
    alignItems: "center",
    gap: 4
  },
  indicatorIconBox: {
    alignItems: "center",
    borderRadius: 2,
    borderWidth: 1,
    height: 31,
    justifyContent: "center",
    width: 31
  },
  indicatorToolText: {
    fontSize: 9,
    fontWeight: "800"
  },
  orderBookSection: {
    paddingHorizontal: 16,
    paddingTop: 18
  },
  orderBookTitleRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10
  },
  orderTitle: {
    fontSize: 21,
    fontWeight: "900"
  },
  orderHeaders: {
    flexDirection: "row",
    gap: 20
  },
  orderHeader: {
    fontSize: 11,
    fontWeight: "800"
  },
  orderColumns: {
    flexDirection: "row",
    gap: 14
  },
  orderColumn: {
    flex: 1,
    gap: 5
  },
  depthRow: {
    alignItems: "center",
    flexDirection: "row",
    height: 23,
    justifyContent: "space-between",
    overflow: "hidden",
    paddingHorizontal: 4
  },
  depthBar: {
    bottom: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  depthPrice: {
    fontSize: 14,
    fontWeight: "900"
  },
  depthSize: {
    fontSize: 14,
    fontWeight: "800"
  },
  aboutCard: {
    borderRadius: 7,
    borderWidth: 1,
    gap: 14,
    margin: 16,
    padding: 16
  },
  aboutHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: "900"
  },
  rankBadge: {
    fontSize: 11,
    fontWeight: "900",
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  aboutBody: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 24
  },
  aboutStats: {
    flexDirection: "row",
    gap: 80
  },
  aboutStatLabel: {
    fontSize: 11,
    fontWeight: "800"
  },
  aboutStatValue: {
    fontSize: 13,
    fontWeight: "900",
    marginTop: 2
  },
  tradeActions: {
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 16,
    padding: 16
  },
  actionButton: {
    alignItems: "center",
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    minHeight: 56
  },
  actionText: {
    color: "#06110b",
    fontSize: 16,
    fontWeight: "900"
  },
  actionSub: {
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: 9,
    fontWeight: "800",
    marginTop: 5
  },
  selectorModal: {
    flex: 1,
    justifyContent: "flex-end"
  },
  selectorBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.72)"
  },
  selectorSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    paddingBottom: 22,
    paddingHorizontal: 16,
    paddingTop: 9
  },
  selectorHandle: {
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 999,
    height: 4,
    marginBottom: 16,
    width: 48
  },
  selectorHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16
  },
  selectorTitle: {
    fontSize: 22,
    fontWeight: "900"
  },
  selectorSearch: {
    alignItems: "center",
    borderRadius: 9,
    flexDirection: "row",
    gap: 8,
    height: 42,
    paddingHorizontal: 12
  },
  selectorInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700"
  },
  selectorTabs: {
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 18,
    marginTop: 12
  },
  selectorTab: {
    borderBottomWidth: 2,
    paddingBottom: 10,
    paddingTop: 8
  },
  selectorTabText: {
    fontSize: 13,
    fontWeight: "900"
  },
  selectorList: {
    paddingTop: 10
  },
  marketOption: {
    alignItems: "center",
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 62,
    paddingHorizontal: 6
  },
  marketOptionSymbol: {
    fontSize: 14,
    fontWeight: "900"
  },
  marketOptionName: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2
  },
  marketOptionRight: {
    alignItems: "flex-end"
  },
  marketOptionPrice: {
    fontSize: 14,
    fontWeight: "900"
  },
  marketOptionChange: {
    fontSize: 13,
    fontWeight: "900",
    marginTop: 2
  }
});
