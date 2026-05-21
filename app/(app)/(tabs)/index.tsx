import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";

import { Screen } from "@/components/Screen";
import { useLayoutMode } from "@/libs/layout-mode";

type FavoriteMarket = {
  change: number;
  name: string;
  price: string;
  symbol: string;
};

type TrendCoin = {
  change: string;
  icon: string;
  name: string;
  price: string;
  symbol: string;
};

const favorites: FavoriteMarket[] = [
  { change: 3.24, name: "Bitcoin", price: "64,281.50", symbol: "BTC/USDT" },
  { change: 1.85, name: "Ethereum", price: "3,492.12", symbol: "ETH/USDT" },
  { change: -0.12, name: "Vàng Thế Giới", price: "2,154.40", symbol: "XAUUSD" },
  { change: 0.45, name: "Dầu WTI", price: "81.42", symbol: "OIL/WTI" }
];

const trends: TrendCoin[] = [
  { change: "+12.45%", icon: "S", name: "Solana", price: "148.52", symbol: "SOL" },
  { change: "+8.12%", icon: "A", name: "Cardano", price: "0.6421", symbol: "ADA" },
  { change: "+7.90%", icon: "P", name: "Pepe", price: "0.0000084", symbol: "PEPE" }
];

export default function HomeTab() {
  const { mode } = useLayoutMode();
  const isProfessionalLayout = mode === "default";

  return isProfessionalLayout ? <ProfessionalHome /> : <DefaultHome />;
}

function ProfessionalHome() {
  return (
    <Screen padded={false} scroll={false}>
      <View style={styles.proPage}>
        <ScrollView
          horizontal
          pagingEnabled={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.proHorizontalContent}
        >
          <ScrollView showsVerticalScrollIndicator={false} style={styles.proPanel} contentContainerStyle={styles.proScrollContent}>
            <HomeHeader pro />
            <ProfessionalBalanceCard />
            <ProfessionalFavorites />
            <NewsStrip compact />
            <TrendSection pro />
          </ScrollView>

          <View style={styles.proRightPanel} />
        </ScrollView>
      </View>
    </Screen>
  );
}

function DefaultHome() {
  return (
    <Screen padded={false} scroll={false}>
      <View style={styles.defaultPage}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.defaultScrollContent}>
          <HomeHeader />
          <DefaultBalanceCard />
          <DefaultFavorites />
          <NewsStrip />
          <TrendSection />
        </ScrollView>
      </View>
    </Screen>
  );
}

function HomeHeader({ pro = false }: { pro?: boolean }) {
  return (
    <View style={pro ? styles.proHeader : styles.defaultHeader}>
      <View style={styles.headerLeft}>
        <View style={pro ? styles.proHeaderLogo : styles.defaultHeaderLogo}>
          {pro ? (
            <Ionicons color="#0f172a" name="trending-up" size={19} />
          ) : (
            <Text style={styles.defaultLogoText}>T</Text>
          )}
        </View>
        <Text style={pro ? styles.proHeaderTitle : styles.defaultHeaderTitle}>Thị trường</Text>
      </View>

      <View style={styles.headerActions}>
        <Pressable hitSlop={10} onPress={() => router.push("/(app)/(tabs)/market")}>
          <Ionicons color={pro ? "#9aa6b8" : "#f5f0df"} name="search-outline" size={23} />
        </Pressable>
        <Ionicons color={pro ? "#9aa6b8" : "#f5f0df"} name="notifications-outline" size={23} />
      </View>
    </View>
  );
}

function DefaultBalanceCard() {
  return (
    <View style={styles.defaultBalanceCard}>
      <View style={styles.balanceTopRow}>
        <Text style={styles.defaultBalanceLabel}>Tổng số dư ước tính</Text>
        <Ionicons color="#bcb49b" name="eye-outline" size={20} />
      </View>
      <View style={styles.balanceAmountRow}>
        <Text style={styles.defaultBalanceValue}>0.142857</Text>
        <Text style={styles.defaultBalanceCurrency}>BTC</Text>
      </View>
      <Text style={styles.defaultBalanceSub}>≈ $9,284.12 (+2.45%)</Text>
      <View style={styles.defaultBalanceActions}>
        <Pressable onPress={() => router.push("/(app)/(tabs)/wallet")} style={styles.defaultPrimaryButton}>
          <Text style={styles.defaultPrimaryText}>Nạp tiền</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/(app)/(tabs)/wallet")} style={styles.defaultOutlineButton}>
          <Text style={styles.defaultOutlineText}>Rút tiền</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ProfessionalBalanceCard() {
  return (
    <View style={styles.proBalanceBlock}>
      <Text style={styles.proBalanceLabel}>TỔNG SỐ DƯ ƯỚC TÍNH</Text>
      <View style={styles.proBalanceAmountRow}>
        <Text style={styles.proBalanceValue}>0.142857</Text>
        <Text style={styles.proBalanceCurrency}>BTC</Text>
      </View>
      <View style={styles.proProfitRow}>
        <Text style={styles.proProfitText}>≈ $9,284.12</Text>
        <Text style={styles.proProfitPill}>+2.45%</Text>
      </View>
      <Pressable onPress={() => router.push("/(app)/(tabs)/wallet")} style={styles.proDepositButton}>
        <Text style={styles.proDepositText}>Nạp tiền</Text>
      </Pressable>
    </View>
  );
}

function DefaultFavorites() {
  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.defaultSectionTitle}>Yêu thích</Text>
      <View style={styles.favoriteGrid}>
        {favorites.map((item) => (
          <DefaultFavoriteCard item={item} key={item.symbol} />
        ))}
      </View>
    </View>
  );
}

function ProfessionalFavorites() {
  return (
    <View style={styles.proSectionBlock}>
      <Text style={styles.proSectionTitle}>Yêu thích</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.proFavoriteRail}>
        <View style={styles.proFavoriteColumn}>
          <ProfessionalFavoriteCard item={favorites[0]} />
          <ProfessionalFavoriteCard item={favorites[2]} />
        </View>
        <View style={styles.proFavoriteColumn}>
          <ProfessionalFavoriteCard item={favorites[1]} />
          <ProfessionalFavoriteCard item={favorites[3]} />
        </View>
      </ScrollView>
    </View>
  );
}

function DefaultFavoriteCard({ item }: { item: FavoriteMarket }) {
  const positive = item.change >= 0;

  return (
    <Pressable onPress={() => router.push("/(app)/(tabs)/market")} style={styles.defaultFavoriteCard}>
      <View style={styles.favoriteSymbolRow}>
        <Text style={styles.defaultFavoriteSymbol}>{item.symbol}</Text>
        <Text style={[styles.favoriteChange, positive ? styles.positiveText : styles.negativeText]}>
          {positive ? "+" : ""}
          {item.change.toFixed(2)}%
        </Text>
      </View>
      <Text style={styles.defaultFavoritePrice}>{item.price}</Text>
      <View style={styles.sparklineWrap}>
        <MiniSparkline positive={positive} />
      </View>
    </Pressable>
  );
}

function ProfessionalFavoriteCard({ item }: { item: FavoriteMarket }) {
  const positive = item.change >= 0;

  return (
    <Pressable onPress={() => router.push("/(app)/(tabs)/market")} style={styles.proFavoriteCard}>
      <Text style={styles.proFavoriteSymbol}>{item.symbol}</Text>
      <Text style={styles.proFavoritePrice}>{item.price}</Text>
      <Text style={[styles.proFavoriteChange, positive ? styles.positiveText : styles.negativeText]}>
        {positive ? "+" : ""}
        {item.change.toFixed(2)}%
      </Text>
      <MiniSparkline positive={positive} pro />
    </Pressable>
  );
}

function MiniSparkline({ positive, pro = false }: { positive: boolean; pro?: boolean }) {
  const color = positive ? "#16c784" : "#f6465d";
  const points = positive ? [32, 26, 28, 20, 18] : [20, 23, 24, 30, 32];

  return (
    <View style={pro ? styles.proSparkline : styles.defaultSparkline}>
      {points.slice(0, -1).map((point, index) => {
        const next = points[index + 1];
        const width = pro ? 26 : 34;
        const rotation = Math.atan2(next - point, width) * (180 / Math.PI);

        return (
          <View
            key={`${point}-${index}`}
            style={[
              styles.sparkSegment,
              {
                backgroundColor: color,
                left: index * (pro ? 22 : 30),
                top: point,
                transform: [{ rotate: `${rotation}deg` }],
                width
              }
            ]}
          />
        );
      })}
    </View>
  );
}

function NewsStrip({ compact = false }: { compact?: boolean }) {
  return (
    <View style={compact ? styles.proNewsBlock : styles.defaultNewsBlock}>
      <View style={styles.newsHeader}>
        <Text style={compact ? styles.proSectionTitle : styles.defaultSectionTitle}>Tin tức mới nhất</Text>
        {!compact ? <Text style={styles.viewAllText}>Xem tất cả</Text> : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={compact ? styles.proNewsRail : styles.defaultNewsRail}>
        <View style={compact ? styles.proNewsCard : styles.defaultNewsCard}>
          <BrandTile />
          <View style={styles.newsTextWrap}>
            <Text numberOfLines={compact ? 2 : 3} style={compact ? styles.proNewsTitle : styles.defaultNewsTitle}>
              Bitcoin đạt mức cao kỷ lục mới trong quý 1
            </Text>
            <Text style={compact ? styles.proNewsMeta : styles.defaultNewsMeta}>{compact ? "TÀI CHÍNH • 2H" : "2 giờ trước • Tài chính"}</Text>
          </View>
        </View>

        {!compact ? (
          <View style={styles.defaultNewsCard}>
            <BrandTile />
            <View style={styles.newsTextWrap}>
              <Text numberOfLines={3} style={styles.defaultNewsTitle}>Thị trường crypto phục hồi sau phiên Mỹ</Text>
              <Text style={styles.defaultNewsMeta}>3 giờ trước • Thị trường</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function BrandTile() {
  return (
    <View style={styles.brandTile}>
      <Text style={styles.brandMark}>T</Text>
      <Text style={styles.brandName}>TRADENEX</Text>
    </View>
  );
}

function TrendSection({ pro = false }: { pro?: boolean }) {
  return (
    <View style={pro ? styles.proTrendBlock : styles.defaultTrendBlock}>
      <View style={styles.trendTabs}>
        <Text style={pro ? styles.proTrendActive : styles.defaultTrendActive}>Top tăng giá</Text>
        <Text style={pro ? styles.proTrendInactive : styles.defaultTrendInactive}>Xu hướng</Text>
      </View>

      <View style={pro ? styles.proTrendList : styles.defaultTrendList}>
        {trends.map((item) => (
          <TrendRow item={item} key={item.symbol} pro={pro} />
        ))}
      </View>
    </View>
  );
}

function TrendRow({ item, pro }: { item: TrendCoin; pro: boolean }) {
  return (
    <Pressable onPress={() => router.push("/(app)/(tabs)/market")} style={pro ? styles.proTrendRow : styles.defaultTrendRow}>
      <View style={styles.trendLeft}>
        <View style={pro ? styles.proTrendIcon : styles.defaultTrendIcon}>
          <Text style={styles.trendIconText}>{item.icon}</Text>
        </View>
        <View>
          <Text style={pro ? styles.proTrendSymbol : styles.defaultTrendSymbol}>{item.symbol}</Text>
          <Text style={pro ? styles.proTrendName : styles.defaultTrendName}>{item.name}</Text>
        </View>
      </View>

      {!pro ? (
        <View style={styles.defaultTrendPriceWrap}>
          <Text style={styles.defaultTrendPrice}>{item.price}</Text>
          <Text style={styles.defaultTrendApprox}>≈ ${Number(item.price.replace(",", "") || "0").toFixed(2)}</Text>
        </View>
      ) : null}

      <View style={pro ? styles.proChangeBadge : styles.defaultChangeBadge}>
        <Text style={styles.changeBadgeText}>{item.change}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  defaultPage: {
    backgroundColor: "#0b0e14",
    flex: 1
  },
  defaultScrollContent: {
    paddingBottom: 22,
    paddingHorizontal: 16,
    paddingTop: 14
  },
  proPage: {
    backgroundColor: "#101827",
    flex: 1
  },
  proHorizontalContent: {
    flexGrow: 1
  },
  proPanel: {
    backgroundColor: "#101827",
    width: 212
  },
  proRightPanel: {
    backgroundColor: "#101827",
    borderLeftColor: "rgba(255,255,255,0.04)",
    borderLeftWidth: 1,
    flex: 1,
    minWidth: 178
  },
  proScrollContent: {
    paddingBottom: 22,
    paddingHorizontal: 16,
    paddingTop: 16
  },
  defaultHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 36
  },
  proHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30
  },
  headerLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  defaultHeaderLogo: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
    width: 24
  },
  proHeaderLogo: {
    alignItems: "center",
    backgroundColor: "#fcd535",
    borderRadius: 11,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  defaultLogoText: {
    color: "#fcd535",
    fontSize: 18,
    fontWeight: "900"
  },
  defaultHeaderTitle: {
    color: "#f5f0df",
    fontSize: 26,
    fontWeight: "900"
  },
  proHeaderTitle: {
    color: "#f8fafc",
    fontSize: 25,
    fontWeight: "900"
  },
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 18
  },
  defaultBalanceCard: {
    backgroundColor: "#14191f",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 36,
    overflow: "hidden",
    padding: 16
  },
  balanceTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  defaultBalanceLabel: {
    color: "#b4aa91",
    fontSize: 13,
    fontWeight: "700"
  },
  balanceAmountRow: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 7,
    marginTop: 12
  },
  defaultBalanceValue: {
    color: "#f1f3f8",
    fontSize: 34,
    fontWeight: "900"
  },
  defaultBalanceCurrency: {
    color: "#f0dfb8",
    fontSize: 17,
    fontWeight: "900"
  },
  defaultBalanceSub: {
    color: "#16c784",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8
  },
  defaultBalanceActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 24
  },
  defaultPrimaryButton: {
    alignItems: "center",
    backgroundColor: "#fcd535",
    borderRadius: 7,
    flex: 1,
    justifyContent: "center",
    minHeight: 43
  },
  defaultPrimaryText: {
    color: "#171b20",
    fontSize: 16,
    fontWeight: "900"
  },
  defaultOutlineButton: {
    alignItems: "center",
    borderColor: "#756d57",
    borderRadius: 7,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 43
  },
  defaultOutlineText: {
    color: "#f2f2f2",
    fontSize: 16,
    fontWeight: "900"
  },
  proBalanceBlock: {
    marginBottom: 40
  },
  proBalanceLabel: {
    color: "#98a3b7",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: 10
  },
  proBalanceAmountRow: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 8
  },
  proBalanceValue: {
    color: "#f8fafc",
    fontSize: 31,
    fontWeight: "900"
  },
  proBalanceCurrency: {
    color: "#94a3b8",
    fontSize: 16,
    fontWeight: "900"
  },
  proProfitRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
    marginTop: 12
  },
  proProfitText: {
    color: "#17c784",
    fontSize: 15,
    fontWeight: "900"
  },
  proProfitPill: {
    backgroundColor: "rgba(22, 199, 132, 0.18)",
    borderRadius: 4,
    color: "#17c784",
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  proDepositButton: {
    alignItems: "center",
    backgroundColor: "#fcd535",
    borderRadius: 9,
    justifyContent: "center",
    marginTop: 28,
    minHeight: 46
  },
  proDepositText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "900"
  },
  sectionBlock: {
    marginBottom: 26
  },
  proSectionBlock: {
    marginBottom: 28
  },
  defaultSectionTitle: {
    color: "#f5f5f5",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 18
  },
  proSectionTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 16
  },
  favoriteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14
  },
  defaultFavoriteCard: {
    backgroundColor: "#13181e",
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 9,
    borderWidth: 1,
    height: 146,
    overflow: "hidden",
    padding: 16,
    width: "48%"
  },
  favoriteSymbolRow: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 3
  },
  defaultFavoriteSymbol: {
    color: "#f0f2f7",
    fontSize: 16,
    fontWeight: "900"
  },
  favoriteChange: {
    fontSize: 14,
    fontWeight: "800"
  },
  defaultFavoritePrice: {
    color: "#f0f2f7",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 12
  },
  sparklineWrap: {
    bottom: 17,
    left: 16,
    position: "absolute",
    right: 16
  },
  defaultSparkline: {
    height: 44,
    position: "relative"
  },
  proSparkline: {
    height: 42,
    marginTop: 18,
    position: "relative"
  },
  sparkSegment: {
    borderRadius: 999,
    height: 2,
    position: "absolute"
  },
  positiveText: {
    color: "#16c784"
  },
  negativeText: {
    color: "#f6465d"
  },
  proFavoriteRail: {
    gap: 16
  },
  proFavoriteColumn: {
    gap: 14
  },
  proFavoriteCard: {
    backgroundColor: "#141f31",
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    borderWidth: 1,
    height: 158,
    padding: 16,
    width: 172
  },
  proFavoriteSymbol: {
    color: "#aeb8c9",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 18
  },
  proFavoritePrice: {
    color: "#f8fafc",
    fontSize: 21,
    fontWeight: "900"
  },
  proFavoriteChange: {
    fontSize: 13,
    fontWeight: "900",
    marginTop: 9
  },
  defaultNewsBlock: {
    marginBottom: 28
  },
  proNewsBlock: {
    marginBottom: 28
  },
  newsHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  viewAllText: {
    color: "#f0dfb8",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 18
  },
  defaultNewsRail: {
    gap: 16
  },
  proNewsRail: {
    gap: 12
  },
  defaultNewsCard: {
    alignItems: "center",
    backgroundColor: "#14191f",
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    padding: 16,
    width: 288
  },
  proNewsCard: {
    alignItems: "center",
    backgroundColor: "#141f31",
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 16,
    width: 260
  },
  brandTile: {
    alignItems: "center",
    backgroundColor: "#090d12",
    borderRadius: 5,
    height: 72,
    justifyContent: "center",
    width: 80
  },
  brandMark: {
    color: "#fcd535",
    fontSize: 20,
    fontWeight: "900"
  },
  brandName: {
    color: "#fcd535",
    fontSize: 8,
    fontWeight: "900",
    marginTop: 4
  },
  newsTextWrap: {
    flex: 1
  },
  defaultNewsTitle: {
    color: "#f5f5f5",
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20
  },
  proNewsTitle: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 18
  },
  defaultNewsMeta: {
    color: "#b0a78f",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 13
  },
  proNewsMeta: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 8
  },
  defaultTrendBlock: {
    marginBottom: 16
  },
  proTrendBlock: {
    marginBottom: 16
  },
  trendTabs: {
    alignItems: "center",
    flexDirection: "row",
    gap: 18,
    marginBottom: 16
  },
  defaultTrendActive: {
    borderBottomColor: "#fcd535",
    borderBottomWidth: 2,
    color: "#f5f5f5",
    fontSize: 21,
    fontWeight: "900",
    paddingBottom: 7
  },
  defaultTrendInactive: {
    color: "#9a927f",
    fontSize: 19,
    fontWeight: "800",
    paddingBottom: 7
  },
  proTrendActive: {
    borderBottomColor: "#fcd535",
    borderBottomWidth: 2,
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "900",
    paddingBottom: 8
  },
  proTrendInactive: {
    color: "#7e8798",
    fontSize: 17,
    fontWeight: "800",
    paddingBottom: 8
  },
  defaultTrendList: {
    gap: 2
  },
  proTrendList: {
    gap: 0
  },
  defaultTrendRow: {
    alignItems: "center",
    borderBottomColor: "rgba(255,255,255,0.06)",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 76
  },
  proTrendRow: {
    alignItems: "center",
    borderBottomColor: "rgba(255,255,255,0.06)",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 77
  },
  trendLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14
  },
  defaultTrendIcon: {
    alignItems: "center",
    backgroundColor: "rgba(6, 95, 70, 0.45)",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  proTrendIcon: {
    alignItems: "center",
    backgroundColor: "rgba(6, 95, 70, 0.46)",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  trendIconText: {
    color: "#16c784",
    fontSize: 16,
    fontWeight: "900"
  },
  defaultTrendSymbol: {
    color: "#f5f5f5",
    fontSize: 16,
    fontWeight: "900"
  },
  proTrendSymbol: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "900"
  },
  defaultTrendName: {
    color: "#a9a088",
    fontSize: 11,
    marginTop: 3
  },
  proTrendName: {
    color: "#94a3b8",
    fontSize: 11,
    marginTop: 3
  },
  defaultTrendPriceWrap: {
    alignItems: "flex-end",
    flex: 1,
    marginRight: 20
  },
  defaultTrendPrice: {
    color: "#f5f5f5",
    fontSize: 17,
    fontWeight: "700"
  },
  defaultTrendApprox: {
    color: "#9a927f",
    fontSize: 10,
    marginTop: 2
  },
  defaultChangeBadge: {
    alignItems: "center",
    backgroundColor: "#16c784",
    borderRadius: 7,
    justifyContent: "center",
    minHeight: 34,
    width: 80
  },
  proChangeBadge: {
    display: "none"
  },
  changeBadgeText: {
    color: "#06110b",
    fontSize: 12,
    fontWeight: "900"
  }
});
