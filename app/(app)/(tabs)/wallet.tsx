import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { formatDate, formatMoney } from "@/libs/format";
import { useLayoutMode } from "@/libs/layout-mode";
import { notifyError, notifyInfo } from "@/libs/notify";
import { profileApi } from "@/services/profile/api";
import type { UserProfile } from "@/services/profile/types";
import { walletApi } from "@/services/wallet/api";
import type { WalletTransaction, WalletTransactionPage } from "@/services/wallet/types";

type AssetItem = {
  amount: string;
  fiat: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  name: string;
  percent?: string;
  symbol: string;
  trend?: "up" | "down";
};

const portfolioAssets: AssetItem[] = [
  {
    amount: "2.450000",
    fiat: "$110,250.00",
    icon: "logo-bitcoin",
    iconBg: "rgba(247, 147, 26, 0.18)",
    iconColor: "#f7931a",
    name: "Bitcoin",
    percent: "+1.25%",
    symbol: "BTC",
    trend: "up"
  },
  {
    amount: "15.200000",
    fiat: "$15,200.00",
    icon: "diamond-outline",
    iconBg: "rgba(96, 165, 250, 0.16)",
    iconColor: "#60a5fa",
    name: "Ethereum",
    percent: "-0.45%",
    symbol: "ETH",
    trend: "down"
  },
  {
    amount: "50.000000",
    fiat: "$3,000.00",
    icon: "sparkles-outline",
    iconBg: "rgba(252, 213, 53, 0.14)",
    iconColor: "#fcd535",
    name: "Vàng Demo",
    symbol: "GOLD"
  }
];

function normalizeWalletTransactions(data: WalletTransaction[] | WalletTransactionPage | null | undefined) {
  if (Array.isArray(data)) {
    return data;
  }

  if (!data) {
    return [];
  }

  if (Array.isArray(data.items)) {
    return data.items;
  }

  if (Array.isArray(data.Items)) {
    return data.Items;
  }

  return [];
}

export default function WalletTab() {
  const { mode, theme } = useLayoutMode();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const isProfessionalLayout = mode === "default";

  useEffect(() => {
    let mounted = true;

    Promise.all([walletApi.list(), profileApi.getProfile()])
      .then(([walletResponse, profileResponse]) => {
        if (!mounted) return;
        setTransactions(normalizeWalletTransactions(walletResponse.data));
        setProfile(profileResponse.data);
      })
      .catch((error) => notifyError(error))
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const displayBalance = useMemo(() => {
    const apiBalance = Number(profile?.money ?? 0);
    return apiBalance > 0 ? apiBalance : 128450;
  }, [profile?.money]);

  const handleComingSoon = (label: string) => {
    notifyInfo({
      message: `${label} đang được chuẩn hóa theo luồng Finance.`,
      description: "Màn nhập chi tiết sẽ được triển khai khi chốt nghiệp vụ nạp/rút."
    });
  };

  if (loading) {
    return (
      <Screen padded={false}>
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <View style={[styles.page, { backgroundColor: theme.colors.bg }]}>
        {isProfessionalLayout ? (
          <ProfessionalWallet
            balance={displayBalance}
            onDeposit={() => handleComingSoon("Nạp tiền")}
            onWithdraw={() => handleComingSoon("Rút tiền")}
            transactions={transactions}
          />
        ) : (
          <DemoWallet
            balance={displayBalance}
            onDeposit={() => handleComingSoon("Nạp tiền demo")}
            onWithdraw={() => handleComingSoon("Rút tiền")}
            transactions={transactions}
          />
        )}
      </View>
    </Screen>
  );
}

function DemoWallet({
  balance,
  onDeposit,
  onWithdraw,
  transactions
}: {
  balance: number;
  onDeposit: () => void;
  onWithdraw: () => void;
  transactions: WalletTransaction[];
}) {
  const { theme } = useLayoutMode();

  return (
    <View style={styles.page}>
      <TopBar title="Ví" trailingIcon="notifications-outline" />

      <View style={styles.demoContent}>
        <View style={styles.demoBalanceCard}>
          <View style={styles.demoBalanceTop}>
            <View style={styles.flex}>
              <Text style={styles.demoBalanceLabel}>Tổng số dư ước tính (Demo USD)</Text>
              <Text style={styles.demoBalanceValue}>
                {formatMoney(balance)} <Text style={styles.currencyText}>USD</Text>
              </Text>
              <Text style={styles.demoBtcValue}>≈ 5.12 BTC (+2.45%)</Text>
            </View>

            <View style={styles.demoLogo}>
              <Ionicons color={theme.colors.primary} name="trending-up-outline" size={20} />
              <Text style={styles.demoLogoText}>TRADENEX</Text>
            </View>
          </View>

          <View style={styles.demoActions}>
            <WalletActionButton label="Nạp tiền demo" onPress={onDeposit} primary />
            <WalletActionButton label="Rút tiền" onPress={onWithdraw} />
          </View>
        </View>

        <View style={styles.demoBento}>
          <View style={styles.demoDonutCard}>
            <DonutChart
              center={<Text style={styles.demoDonutText}>Cơ cấu</Text>}
              size={104}
              tone="demo"
            />
            <View style={styles.demoLegendRow}>
              <MiniLegend color="#fcd535" label="BTC" />
              <MiniLegend color="#25d4a6" label="ETH" />
            </View>
          </View>

          <View style={styles.demoSideStats}>
            <SmallStatCard label="Lợi nhuận 24h" value="+$1,240.50" valueColor={theme.colors.success} />
            <SmallStatCard label="Giao dịch chờ" value="2 lệnh" />
          </View>
        </View>

        <SectionHeader title="Tài sản hiện có" />
        <View style={styles.assetList}>
          {portfolioAssets.map((asset) => (
            <AssetRow asset={asset} compact key={asset.symbol} />
          ))}
        </View>

        <TransactionPreview transactions={transactions} />
      </View>
    </View>
  );
}

function ProfessionalWallet({
  balance,
  onDeposit,
  onWithdraw,
  transactions
}: {
  balance: number;
  onDeposit: () => void;
  onWithdraw: () => void;
  transactions: WalletTransaction[];
}) {
  const { theme } = useLayoutMode();

  return (
    <View style={styles.page}>
      <TopBar
        title="Tài khoản thực"
        trailing={
          <View style={styles.headerActions}>
            <Ionicons color={theme.colors.text} name="time-outline" size={23} />
            <Ionicons color={theme.colors.text} name="ellipsis-vertical" size={22} />
          </View>
        }
      />

      <View style={styles.proContent}>
        <View style={styles.proEquity}>
          <Text style={styles.proEquityLabel}>TỔNG TÀI SẢN (EQUITY)</Text>
          <Text style={styles.proEquityValue}>
            {formatMoney(balance)} <Text style={styles.proCurrency}>USD</Text>
          </Text>
        </View>

        <View style={styles.marginGrid}>
          <MarginBox label="KÝ QUỸ (MARGIN)" value="25,690.00" />
          <MarginBox label="DƯ KÝ QUỸ" value="102,760.00" valueColor={theme.colors.success} />
          <MarginBox label="MỨC KÝ QUỸ" value="500%" valueColor={theme.colors.primary} />
        </View>

        <View style={styles.proActions}>
          <WalletActionButton icon="add-circle-outline" label="Nạp tiền" onPress={onDeposit} primary />
          <WalletActionButton icon="wallet-outline" label="Rút tiền" onPress={onWithdraw} />
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.proSectionTitle}>Phân bổ tài sản</Text>
          <Text style={[styles.detailLink, { color: theme.colors.primary }]}>Chi tiết</Text>
        </View>

        <View style={styles.proAllocationCard}>
          <DonutChart
            center={
              <View style={styles.proDonutCenter}>
                <Text style={styles.proDonutLabel}>ĐANG DÙNG</Text>
                <Text style={styles.proDonutValue}>20.4%</Text>
              </View>
            }
            size={134}
            tone="pro"
          />

          <View style={styles.proLegendList}>
            <LegendRow color="#fcd535" label="BTC" value="45%" />
            <LegendRow color="#25d4a6" label="ETH" value="25%" />
            <LegendRow color="#60a5fa" label="USD" value="15%" />
            <LegendRow color="#94a3b8" label="Khác" value="15%" />
          </View>
        </View>

        <SectionHeader title="Danh mục tài sản" />
        <View style={styles.assetList}>
          {portfolioAssets.slice(0, 2).map((asset) => (
            <AssetRow asset={asset} key={asset.symbol} showTrend />
          ))}
        </View>

        <TransactionPreview transactions={transactions} />
      </View>
    </View>
  );
}

function TopBar({
  title,
  trailing,
  trailingIcon
}: {
  title: string;
  trailing?: ReactNode;
  trailingIcon?: keyof typeof Ionicons.glyphMap;
}) {
  const { theme } = useLayoutMode();

  return (
    <View style={[styles.topBar, { borderBottomColor: theme.mode === "default" ? "#202532" : "#1f252d" }]}>
      <Pressable hitSlop={10} onPress={() => router.back()}>
        <Ionicons color={theme.colors.text} name="arrow-back" size={24} />
      </Pressable>
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{title}</Text>
      {trailing || (trailingIcon ? <Ionicons color={theme.colors.text} name={trailingIcon} size={23} /> : <View />)}
    </View>
  );
}

function WalletActionButton({
  icon,
  label,
  onPress,
  primary
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  const { theme } = useLayoutMode();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.actionButton,
        {
          backgroundColor: primary ? theme.colors.primary : theme.colors.surface,
          borderColor: primary ? theme.colors.primary : theme.colors.border
        }
      ]}
    >
      {icon ? <Ionicons color={primary ? theme.colors.ink : theme.colors.text} name={icon} size={20} /> : null}
      <Text
        style={[
          styles.actionButtonText,
          { color: primary ? theme.colors.ink : theme.colors.text }
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function DonutChart({
  center,
  size,
  tone
}: {
  center: ReactNode;
  size: number;
  tone: "demo" | "pro";
}) {
  const borderWidth = tone === "pro" ? 11 : 14;
  const colors =
    tone === "pro"
      ? ["#fcd535", "#25d4a6", "#60a5fa", "#94a3b8"]
      : ["#fcd535", "#25d4a6", "#f6465d", "#d7d1c1"];

  return (
    <View
      style={[
        styles.donut,
        {
          borderBottomColor: colors[1],
          borderLeftColor: colors[2],
          borderRightColor: colors[1],
          borderTopColor: colors[0],
          borderWidth,
          height: size,
          width: size
        }
      ]}
    >
      <View
        style={[
          styles.donutInner,
          {
            height: size - borderWidth * 2,
            width: size - borderWidth * 2
          }
        ]}
      >
        {center}
      </View>
    </View>
  );
}

function MiniLegend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.miniLegend}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.miniLegendText}>{label}</Text>
    </View>
  );
}

function SmallStatCard({
  label,
  value,
  valueColor
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  const { theme } = useLayoutMode();

  return (
    <View style={styles.smallStatCard}>
      <Text style={styles.smallStatLabel}>{label}</Text>
      <Text style={[styles.smallStatValue, { color: valueColor || theme.colors.text }]}>{value}</Text>
    </View>
  );
}

function MarginBox({
  label,
  value,
  valueColor
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  const { theme } = useLayoutMode();

  return (
    <View style={styles.marginBox}>
      <Text style={styles.marginLabel}>{label}</Text>
      <Text style={[styles.marginValue, { color: valueColor || theme.colors.text }]}>{value}</Text>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  const { theme } = useLayoutMode();

  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
      <Ionicons color={theme.colors.muted} name="search-outline" size={24} />
    </View>
  );
}

function LegendRow({
  color,
  label,
  value
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.legendRow}>
      <View style={styles.legendLeft}>
        <View style={[styles.legendDot, { backgroundColor: color }]} />
        <Text style={styles.legendLabel}>{label}</Text>
      </View>
      <Text style={styles.legendValue}>{value}</Text>
    </View>
  );
}

function AssetRow({
  asset,
  compact,
  showTrend
}: {
  asset: AssetItem;
  compact?: boolean;
  showTrend?: boolean;
}) {
  const { theme } = useLayoutMode();

  return (
    <View style={[styles.assetRow, compact && styles.assetRowCompact]}>
      <View style={styles.assetLeft}>
        <View style={[styles.assetIcon, { backgroundColor: asset.iconBg }]}>
          <Ionicons color={asset.iconColor} name={asset.icon} size={23} />
        </View>
        <View>
          <Text style={[styles.assetName, { color: theme.colors.text }]}>{asset.name}</Text>
          <Text style={styles.assetSymbol}>{asset.symbol}</Text>
        </View>
      </View>
      <View style={styles.assetRight}>
        <Text style={[styles.assetAmount, { color: theme.colors.text }]}>{asset.amount}</Text>
        <Text style={styles.assetFiat}>≈ {asset.fiat}</Text>
        {showTrend && asset.percent ? (
          <Text style={[styles.assetTrend, { color: asset.trend === "down" ? theme.colors.danger : theme.colors.success }]}>
            {asset.percent}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function TransactionPreview({ transactions }: { transactions: WalletTransaction[] }) {
  const { theme } = useLayoutMode();
  const recentTransactions = Array.isArray(transactions) ? transactions.slice(0, 3) : [];

  if (recentTransactions.length === 0) {
    return null;
  }

  return (
    <View style={styles.transactionSection}>
      <Text style={[styles.historyTitle, { color: theme.colors.text }]}>Lịch sử gần đây</Text>
      {recentTransactions.map((item) => {
        const type = String(item.type || "").toLowerCase();
        const isDeposit = type.includes("recharge") || type.includes("deposit");

        return (
          <View key={item.id} style={styles.transactionRow}>
            <View style={styles.assetLeft}>
              <View style={[styles.txIcon, { backgroundColor: isDeposit ? "rgba(14, 203, 129, 0.12)" : "rgba(246, 70, 93, 0.12)" }]}>
                <Ionicons
                  color={isDeposit ? theme.colors.success : theme.colors.danger}
                  name={isDeposit ? "arrow-down-outline" : "arrow-up-outline"}
                  size={17}
                />
              </View>
              <View>
                <Text style={[styles.txType, { color: theme.colors.text }]}>
                  {isDeposit ? "Nạp tiền" : "Rút tiền"}
                </Text>
                <Text style={styles.txDate}>{formatDate(item.createdAtUtc)}</Text>
              </View>
            </View>
            <Text style={[styles.txAmount, { color: isDeposit ? theme.colors.success : theme.colors.danger }]}>
              {isDeposit ? "+" : "-"}{formatMoney(item.money)} USDT
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    minHeight: "100%"
  },
  flex: {
    flex: 1
  },
  topBar: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: 62,
    justifyContent: "space-between",
    paddingHorizontal: 20
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    marginLeft: 16
  },
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16
  },
  demoContent: {
    gap: 24,
    padding: 20,
    paddingBottom: 52
  },
  demoBalanceCard: {
    backgroundColor: "#171b20",
    borderColor: "#252a31",
    borderRadius: 10,
    borderWidth: 1,
    gap: 24,
    padding: 24
  },
  demoBalanceTop: {
    flexDirection: "row",
    gap: 14
  },
  demoBalanceLabel: {
    color: "#b6ad95",
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 23
  },
  demoBalanceValue: {
    color: "#fff6d2",
    fontSize: 31,
    fontWeight: "900",
    marginTop: 10
  },
  currencyText: {
    fontSize: 17,
    fontWeight: "900"
  },
  demoBtcValue: {
    color: "#25d4a6",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 6
  },
  demoLogo: {
    alignItems: "center",
    backgroundColor: "#0f1618",
    height: 44,
    justifyContent: "center",
    marginTop: 2,
    width: 44
  },
  demoLogoText: {
    color: "#fcd535",
    fontSize: 5,
    fontWeight: "900",
    marginTop: 1
  },
  demoActions: {
    flexDirection: "row",
    gap: 12
  },
  actionButton: {
    alignItems: "center",
    borderRadius: 7,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 12
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center"
  },
  demoBento: {
    flexDirection: "row",
    gap: 12
  },
  demoDonutCard: {
    alignItems: "center",
    backgroundColor: "#1d2127",
    borderRadius: 9,
    flex: 1,
    gap: 14,
    justifyContent: "center",
    minHeight: 164,
    padding: 16
  },
  donut: {
    alignItems: "center",
    borderRadius: 999,
    justifyContent: "center",
    transform: [{ rotate: "24deg" }]
  },
  donutInner: {
    alignItems: "center",
    backgroundColor: "#1d2127",
    borderRadius: 999,
    justifyContent: "center",
    transform: [{ rotate: "-24deg" }]
  },
  demoDonutText: {
    color: "#f5f5f5",
    fontSize: 15,
    fontWeight: "700"
  },
  demoLegendRow: {
    flexDirection: "row",
    gap: 8
  },
  miniLegend: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  miniLegendText: {
    color: "#d8d0ba",
    fontSize: 11,
    fontWeight: "700"
  },
  legendDot: {
    borderRadius: 5,
    height: 10,
    width: 10
  },
  demoSideStats: {
    flex: 1,
    gap: 12
  },
  smallStatCard: {
    backgroundColor: "#242830",
    borderRadius: 9,
    flex: 1,
    justifyContent: "center",
    minHeight: 76,
    padding: 16
  },
  smallStatLabel: {
    color: "#b6ad95",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6
  },
  smallStatValue: {
    fontSize: 20,
    fontWeight: "900"
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: "900"
  },
  assetList: {
    gap: 12
  },
  assetRow: {
    alignItems: "center",
    backgroundColor: "#171b20",
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 78,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  assetRowCompact: {
    minHeight: 68
  },
  assetLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  assetIcon: {
    alignItems: "center",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  assetName: {
    fontSize: 16,
    fontWeight: "700"
  },
  assetSymbol: {
    color: "#a59d88",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2
  },
  assetRight: {
    alignItems: "flex-end"
  },
  assetAmount: {
    fontSize: 15,
    fontWeight: "700"
  },
  assetFiat: {
    color: "#b6ad95",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2
  },
  assetTrend: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2
  },
  proContent: {
    gap: 24,
    padding: 24,
    paddingBottom: 52
  },
  proEquity: {
    alignItems: "center",
    gap: 8,
    paddingTop: 26
  },
  proEquityLabel: {
    color: "#8f96a4",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1.2
  },
  proEquityValue: {
    color: "#f5f5f5",
    fontSize: 34,
    fontWeight: "900"
  },
  proCurrency: {
    color: "#a7adbb",
    fontSize: 18,
    fontWeight: "800"
  },
  marginGrid: {
    flexDirection: "row",
    gap: 4
  },
  marginBox: {
    backgroundColor: "#1b2230",
    borderRadius: 7,
    flex: 1,
    justifyContent: "center",
    minHeight: 76,
    paddingHorizontal: 10,
    paddingVertical: 12
  },
  marginLabel: {
    color: "#8992a5",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  marginValue: {
    fontSize: 15,
    fontWeight: "900",
    marginTop: 8
  },
  proActions: {
    flexDirection: "row",
    gap: 12
  },
  sectionRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: -4
  },
  proSectionTitle: {
    color: "#f5f5f5",
    fontSize: 21,
    fontWeight: "900"
  },
  detailLink: {
    fontSize: 12,
    fontWeight: "900"
  },
  proAllocationCard: {
    alignItems: "center",
    backgroundColor: "#121b2b",
    borderColor: "#253249",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 28,
    justifyContent: "center",
    minHeight: 178,
    paddingHorizontal: 22,
    paddingVertical: 20
  },
  proDonutCenter: {
    alignItems: "center"
  },
  proDonutLabel: {
    color: "#8892a2",
    fontSize: 9,
    fontWeight: "900"
  },
  proDonutValue: {
    color: "#f5f5f5",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 4
  },
  proLegendList: {
    flex: 1,
    gap: 16
  },
  legendRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  legendLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  legendLabel: {
    color: "#e6e8ef",
    fontSize: 14,
    fontWeight: "800"
  },
  legendValue: {
    color: "#f5f5f5",
    fontSize: 16,
    fontWeight: "700"
  },
  transactionSection: {
    gap: 10,
    paddingBottom: 20
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4
  },
  transactionRow: {
    alignItems: "center",
    backgroundColor: "#171b20",
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14
  },
  txIcon: {
    alignItems: "center",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  txType: {
    fontSize: 14,
    fontWeight: "800"
  },
  txDate: {
    color: "#8b8e95",
    fontSize: 11,
    marginTop: 2
  },
  txAmount: {
    fontSize: 14,
    fontWeight: "900"
  }
});
