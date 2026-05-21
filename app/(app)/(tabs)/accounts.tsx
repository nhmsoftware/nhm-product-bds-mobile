import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { LoadingState } from "@/components/LoadingState";
import { PageTitle } from "@/components/PageTitle";
import { Screen } from "@/components/Screen";
import { StatusBadge } from "@/components/StatusBadge";
import { TextField } from "@/components/TextField";
import { formatMoney } from "@/libs/format";
import { notifyError, notifySuccess } from "@/libs/notify";
import { colors, radius } from "@/libs/theme";
import { accountApi } from "@/services/account/api";
import type { TradingAccount } from "@/services/account/types";

export default function AccountsTab() {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Creation Simulation State
  const [modalVisible, setModalVisible] = useState(false);
  const [accName, setAccName] = useState("");
  const [accType, setAccType] = useState<"demo" | "real">("demo");
  const [leverage, setLeverage] = useState("100");

  const load = () => {
    setLoading(true);
    accountApi
      .list()
      .then((response) => setAccounts(response.data || []))
      .catch((error) => notifyError(error))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggle = async (accountId: string) => {
    try {
      await accountApi.toggleProtect(accountId);
      // Update list locally
      setAccounts((prev) =>
        prev.map((acc) => (acc.id === accountId ? { ...acc, activeProtectCost: !acc.activeProtectCost } : acc))
      );
      notifySuccess({ message: "Đã cập nhật trạng thái Bảo vệ số dư âm cho tài khoản." });
    } catch (error) {
      notifyError(error);
    }
  };

  // Create Trading Account Simulation (UC-020)
  const handleCreateAccount = () => {
    if (!accName) {
      notifyError("Vui lòng nhập Tên tài khoản.");
      return;
    }

    const randomNum = Math.floor(10000000 + Math.random() * 90000000);
    const newAcc: TradingAccount = {
      id: `acc_${Date.now()}`,
      name: accName,
      type: accType,
      typeValue: accType === "real" ? 1 : 2,
      accountNumber: `ZX-${randomNum}`,
      balance: accType === "real" ? 0.0 : 10000.0,
      activeProtectCost: true
    };

    setAccounts((prev) => [...prev, newAcc]);
    notifySuccess({
      message: `Chúc mừng! Tài khoản giao dịch ${accType.toUpperCase()} đã được tạo thành công.`
    });
    setModalVisible(false);
    setAccName("");
  };

  return (
    <Screen>
      <PageTitle
        title="Tài khoản giao dịch"
        subtitle="Quản lý và thiết lập tài khoản giao dịch Live & Demo chuyên nghiệp trên Zentrix Terminal."
      />
      
      {/* Quick Add Button */}
      <Button
        onPress={() => {
          setModalVisible(true);
        }}
        title="MỞ TÀI KHOẢN GIAO DỊCH MỚI"
        variant="primary"
        style={styles.addBtn}
      />

      {loading ? (
        <LoadingState />
      ) : (
        <View style={styles.list}>
          {accounts.map((account) => {
            const isReal = account.type.toLowerCase() === "real";
            return (
              <Card key={account.id} style={styles.card} variant="solid">
                <View style={styles.cardHeader}>
                  <View style={styles.left}>
                    <View style={[styles.accIcon, isReal ? styles.accIconReal : styles.accIconDemo]}>
                      <Ionicons 
                        name={isReal ? "trending-up-outline" : "color-wand-outline"} 
                        size={20} 
                        color={isReal ? colors.success : colors.primary} 
                      />
                    </View>
                    <View>
                      <Text style={styles.name}>{account.name}</Text>
                      <Text style={styles.number}>{account.accountNumber}</Text>
                    </View>
                  </View>
                  <StatusBadge 
                    label={account.type.toUpperCase()} 
                    tone={isReal ? "success" : "neutral"} 
                  />
                </View>

                <View style={styles.balanceRow}>
                  <Text style={styles.balanceLabel}>SỐ DƯ TÀI KHOẢN</Text>
                  <Text style={[styles.balanceValue, isReal ? styles.realBalance : styles.demoBalance]}>
                    {formatMoney(account.balance)} <Text style={styles.unit}>USDT</Text>
                  </Text>
                </View>

                {/* Negative Balance Protection indicator (UC-026/028 properties) */}
                <View style={styles.divider} />

                <View style={styles.protectionRow}>
                  <View style={styles.protectionLeft}>
                    <Ionicons 
                      name={account.activeProtectCost ? "shield-checkmark" : "shield-outline"} 
                      size={18} 
                      color={account.activeProtectCost ? colors.success : colors.muted} 
                    />
                    <Text style={styles.protectionText}>Bảo vệ số dư âm</Text>
                  </View>
                  <Pressable 
                    onPress={() => toggle(account.id)}
                    style={[
                      styles.toggleBtn, 
                      account.activeProtectCost ? styles.toggleBtnActive : styles.toggleBtnInactive
                    ]}
                  >
                    <Text style={[
                      styles.toggleText,
                      account.activeProtectCost ? styles.toggleTextActive : styles.toggleTextInactive
                    ]}>
                      {account.activeProtectCost ? "ĐANG BẬT" : "ĐANG TẮT"}
                    </Text>
                  </Pressable>
                </View>
              </Card>
            );
          })}
        </View>
      )}

      {/* Account Creation Modal Simulation (UC-020) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mở tài khoản mới</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <TextField
                label="Tên tài khoản gợi nhớ"
                onChangeText={setAccName}
                placeholder="Ví dụ: My Golden Live Account"
                value={accName}
              />

              <Text style={styles.modalLabel}>Loại tài khoản</Text>
              <View style={styles.typeSelector}>
                <Pressable
                  onPress={() => setAccType("demo")}
                  style={[styles.typeBtn, accType === "demo" && styles.typeBtnActive]}
                >
                  <Ionicons name="color-wand-outline" size={16} color={accType === "demo" ? colors.primary : colors.muted} />
                  <Text style={[styles.typeText, accType === "demo" && styles.typeTextActive]}>DEMO (10K USDT)</Text>
                </Pressable>
                <Pressable
                  onPress={() => setAccType("real")}
                  style={[styles.typeBtn, accType === "real" && styles.typeBtnActive]}
                >
                  <Ionicons name="trending-up-outline" size={16} color={accType === "real" ? colors.primary : colors.muted} />
                  <Text style={[styles.typeText, accType === "real" && styles.typeTextActive]}>REAL (TÀI KHOẢN THẬT)</Text>
                </Pressable>
              </View>

              <Text style={styles.modalLabel}>Đòn bẩy giao dịch</Text>
              <View style={styles.leverageSelector}>
                {["50", "100", "200", "500"].map((lev) => {
                  const isActive = leverage === lev;
                  return (
                    <Pressable
                      key={lev}
                      onPress={() => setLeverage(lev)}
                      style={[styles.levBtn, isActive && styles.levBtnActive]}
                    >
                      <Text style={[styles.levText, isActive && styles.levTextActive]}>
                        1:{lev}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Button
                onPress={handleCreateAccount}
                title="XÁC NHẬN MỞ TÀI KHOẢN"
                variant="primary"
                style={styles.modalSubmit}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    marginBottom: 20
  },
  list: {
    gap: 16,
    paddingBottom: 24
  },
  card: {
    backgroundColor: "#161a1e", // Stitch Level 1 card color
    borderColor: colors.border,
    padding: 16,
    gap: 16
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  accIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1
  },
  accIconReal: {
    borderColor: "rgba(14, 203, 129, 0.2)",
    backgroundColor: "rgba(14, 203, 129, 0.08)"
  },
  accIconDemo: {
    borderColor: "rgba(252, 213, 53, 0.2)",
    backgroundColor: "rgba(252, 213, 53, 0.08)"
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800"
  },
  number: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2
  },
  balanceRow: {
    gap: 4
  },
  balanceLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5
  },
  balanceValue: {
    fontSize: 26,
    fontWeight: "900"
  },
  realBalance: {
    color: colors.success
  },
  demoBalance: {
    color: colors.primary
  },
  unit: {
    fontSize: 14,
    fontWeight: "700"
  },
  divider: {
    height: 1,
    backgroundColor: colors.border
  },
  protectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  protectionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  protectionText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600"
  },
  toggleBtn: {
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  toggleBtnActive: {
    borderColor: "rgba(14, 203, 129, 0.4)",
    backgroundColor: "rgba(14, 203, 129, 0.08)"
  },
  toggleBtnInactive: {
    borderColor: colors.border,
    backgroundColor: "transparent"
  },
  toggleText: {
    fontSize: 10,
    fontWeight: "800"
  },
  toggleTextActive: {
    color: colors.success
  },
  toggleTextInactive: {
    color: colors.muted
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end"
  },
  modalContent: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 24,
    maxHeight: "80%"
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  modalBody: {
    gap: 16
  },
  modalLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: -4
  },
  typeSelector: {
    flexDirection: "row",
    gap: 12
  },
  typeBtn: {
    flex: 1,
    backgroundColor: colors.surfaceDark,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8
  },
  typeBtnActive: {
    borderColor: colors.primary,
    backgroundColor: "rgba(252, 213, 53, 0.05)"
  },
  typeText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700"
  },
  typeTextActive: {
    color: colors.primary
  },
  leverageSelector: {
    flexDirection: "row",
    gap: 8
  },
  levBtn: {
    flex: 1,
    backgroundColor: colors.surfaceDark,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: "center"
  },
  levBtnActive: {
    borderColor: colors.primary,
    backgroundColor: "rgba(252, 213, 53, 0.05)"
  },
  levText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  levTextActive: {
    color: colors.primary
  },
  modalSubmit: {
    marginTop: 10
  }
});
