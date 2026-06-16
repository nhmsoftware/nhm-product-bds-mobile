import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { RoleGuard } from "@/components/RoleGuard";
import { Screen } from "@/components/Screen";
import { Pressable } from "@/components/SafePressable";
import { appFonts } from "@/libs/typography";
import {
  getConsultationHistory,
  deleteConsultationHistoryItem,
  clearConsultationHistory,
  type ConsultationHistoryItem
} from "@/services/customer/history";

export default function ConsultationHistoryScreen() {
  return (
    <RoleGuard allowedRoles={["customer"]}>
      <ConsultationHistoryContent />
    </RoleGuard>
  );
}

function ConsultationHistoryContent() {
  const [history, setHistory] = useState<ConsultationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    const list = await getConsultationHistory();
    setHistory(list);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const handleDeleteItem = (id: string) => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa yêu cầu này khỏi lịch sử không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            const nextList = await deleteConsultationHistoryItem(id);
            setHistory(nextList);
          }
        }
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      "Xác nhận xóa tất cả",
      "Bạn có chắc chắn muốn xóa toàn bộ lịch sử yêu cầu tư vấn không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa tất cả",
          style: "destructive",
          onPress: async () => {
            await clearConsultationHistory();
            setHistory([]);
          }
        }
      ]
    );
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color="#6a0100" name="chevron-back" size={20} />
          <Text style={styles.backText}>Quay lại</Text>
        </Pressable>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Lịch sử tư vấn</Text>
            <Text style={styles.subtitle}>Danh sách các yêu cầu liên hệ bạn đã gửi thành công.</Text>
          </View>
          {history.length > 0 ? (
            <Pressable accessibilityRole="button" onPress={handleClearAll} style={styles.clearButton}>
              <Ionicons color="#6b7280" name="trash-outline" size={20} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Đang tải lịch sử...</Text>
        </View>
      ) : history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Ionicons color="#6b7280" name="chatbubble-ellipses-outline" size={48} />
          </View>
          <Text style={styles.emptyTitle}>Chưa có lịch sử yêu cầu</Text>
          <Text style={styles.emptyText}>
            Bạn chưa gửi yêu cầu tư vấn hoặc đặt lịch hẹn gọi lại nào trên thiết bị này.
          </Text>
          <View style={styles.emptyAction}>
            <Button
              onPress={() => router.push("/(app)/(tabs)/profile")}
              title="GỬI YÊU CẦU NGAY"
              variant="brand"
            />
          </View>
        </View>
      ) : (
        <View style={styles.list}>
          {history.map((item) => {
            const isCallback = item.type === "callback";
            return (
              <Card key={item.id} style={styles.historyCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.badge, isCallback ? styles.badgeCallback : styles.badgeConsultation]}>
                    <Text style={[styles.badgeText, isCallback ? styles.badgeTextCallback : styles.badgeTextConsultation]}>
                      {isCallback ? "ĐẶT LỊCH GỌI LẠI" : "YÊU CẦU TƯ VẤN"}
                    </Text>
                  </View>
                  <Pressable accessibilityRole="button" onPress={() => handleDeleteItem(item.id)} style={styles.deleteButton}>
                    <Ionicons color="#9ca3af" name="close-circle-outline" size={20} />
                  </Pressable>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.metaRow}>
                    <Ionicons color="#6b7280" name="time-outline" size={14} />
                    <Text style={styles.metaText}>{formatTime(item.submittedAt)}</Text>
                  </View>

                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Họ và tên</Text>
                      <Text style={styles.infoValue}>{item.fullName}</Text>
                    </View>

                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Số điện thoại</Text>
                      <Text style={styles.infoValue}>{item.phone}</Text>
                    </View>

                    {item.email ? (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Email</Text>
                        <Text style={styles.infoValue}>{item.email}</Text>
                      </View>
                    ) : null}

                    {item.projectName ? (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Khu đất quan tâm</Text>
                        <Text style={styles.infoValue}>{item.projectName}</Text>
                      </View>
                    ) : null}

                    {isCallback && item.preferredCallbackTime ? (
                      <View style={[styles.infoItem, { width: "100%" }]}>
                        <Text style={styles.infoLabel}>Thời gian mong muốn gọi lại</Text>
                        <Text style={[styles.infoValue, styles.highlightValue]}>{item.preferredCallbackTime}</Text>
                      </View>
                    ) : null}

                    {!isCallback && item.content ? (
                      <View style={[styles.infoItem, { width: "100%" }]}>
                        <Text style={styles.infoLabel}>Nội dung lời nhắn</Text>
                        <Text style={styles.infoValue}>{item.content}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 4,
    marginBottom: 12
  },
  backText: {
    color: "#6a0100",
    fontFamily: appFonts.semiBold,
    fontSize: 14
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  badgeCallback: {
    backgroundColor: "rgba(106, 1, 0, 0.08)"
  },
  badgeConsultation: {
    backgroundColor: "rgba(25, 28, 29, 0.05)"
  },
  badgeText: {
    fontFamily: appFonts.bold,
    fontSize: 10,
    letterSpacing: 0.5,
    lineHeight: 14
  },
  badgeTextCallback: {
    color: "#6a0100"
  },
  badgeTextConsultation: {
    color: "#191c1d"
  },
  cardHeader: {
    alignItems: "center",
    borderBottomColor: "#f3f4f6",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 10
  },
  cardBody: {
    gap: 12,
    marginTop: 10
  },
  clearButton: {
    alignItems: "center",
    borderRadius: 8,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  deleteButton: {
    padding: 4
  },
  emptyAction: {
    marginTop: 8,
    width: "100%"
  },
  emptyContainer: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginTop: 20,
    padding: 30,
    textAlign: "center"
  },
  emptyIconWrap: {
    alignItems: "center",
    backgroundColor: "#fbeaea",
    borderRadius: 999,
    height: 80,
    justifyContent: "center",
    marginBottom: 16,
    width: 80
  },
  emptyTitle: {
    color: "#191c1d",
    fontFamily: appFonts.bold,
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 6
  },
  emptyText: {
    color: "#6b7280",
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center"
  },
  header: {
    marginBottom: 16
  },
  highlightValue: {
    color: "#6a0100"
  },
  historyCard: {
    marginBottom: 14,
    padding: 14
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  infoItem: {
    width: "47%"
  },
  infoLabel: {
    color: "#6b7280",
    fontFamily: appFonts.regular,
    fontSize: 11,
    lineHeight: 15
  },
  infoValue: {
    color: "#191c1d",
    fontFamily: appFonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2
  },
  list: {
    marginTop: 8
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  metaText: {
    color: "#6b7280",
    fontFamily: appFonts.regular,
    fontSize: 12,
    lineHeight: 16
  },
  subtitle: {
    color: "#6b7280",
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  title: {
    color: "#191c1d",
    fontFamily: appFonts.bold,
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 6
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  }
});
