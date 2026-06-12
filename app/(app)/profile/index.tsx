import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { LoadingState } from "@/components/LoadingState";
import { RoleGuard } from "@/components/RoleGuard";
import { Screen } from "@/components/Screen";
import { Pressable } from "@/components/SafePressable";
import { mediaUrl } from "@/libs/media";
import { notifyError } from "@/libs/notify";
import { appFonts } from "@/libs/typography";
import { profileApi } from "@/services/profile/api";
import type { CustomerProfile } from "@/services/profile/types";

export default function CustomerProfileScreen() {
  return (
    <RoleGuard allowedRoles={["customer"]}>
      <CustomerProfileContent />
    </RoleGuard>
  );
}

function CustomerProfileContent() {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      profileApi
        .getProfile()
        .then((response) => {
          if (active) setProfile(response.data);
        })
        .catch((error) => notifyError(error, "Không thể tải thông tin cá nhân. Vui lòng thử lại."))
        .finally(() => {
          if (active) setLoading(false);
        });

      return () => {
        active = false;
      };
    }, [])
  );

  if (loading || !profile) {
    return (
      <Screen scroll={false}>
        <LoadingState />
      </Screen>
    );
  }

  const avatarUri = mediaUrl(profile.avatar);
  const initial = profile.fullName.trim().charAt(0).toUpperCase() || "K";

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color="#6a0100" name="chevron-back" size={20} />
          <Text style={styles.backText}>Quay lại</Text>
        </Pressable>
        <Text style={styles.title}>Thông tin cá nhân</Text>
        <Text style={styles.subtitle}>Thông tin tài khoản khách hàng đang được lưu trên hệ thống.</Text>
      </View>

      <Card style={styles.heroCard}>
        <View style={styles.avatarWrap}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarInitial}>{initial}</Text>
          )}
        </View>
        <View style={styles.heroText}>
          <Text style={styles.name}>{profile.fullName || "Chưa cập nhật"}</Text>
          <Text style={styles.email}>{profile.email || "Chưa cập nhật"}</Text>
        </View>
      </Card>

      <Card style={styles.infoCard}>
        <InfoRow icon="person-outline" label="Họ và tên" value={profile.fullName} />
        <InfoRow icon="call-outline" label="Số điện thoại" value={profile.phone} />
        <InfoRow icon="mail-outline" label="Email" value={profile.email} />
        <InfoRow icon="location-outline" label="Địa chỉ" value={profile.address} />
        {profile.cccd ? <InfoRow icon="card-outline" label="Số CCCD" value={profile.cccd} /> : null}
      </Card>

      <View style={styles.actions}>
        <Button onPress={() => router.push("/(app)/profile/edit")} title="CHỈNH SỬA HỒ SƠ" variant="brand" />
        <Button onPress={() => router.push("/(app)/profile/change-password")} title="ĐỔI MẬT KHẨU" variant="secondary" />
      </View>
    </Screen>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string | null }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons color="#6a0100" name={icon} size={18} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value?.trim() || "Chưa cập nhật"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
    marginTop: 16
  },
  avatarImage: {
    height: "100%",
    width: "100%"
  },
  avatarInitial: {
    color: "#6a0100",
    fontFamily: appFonts.bold,
    fontSize: 30
  },
  avatarWrap: {
    alignItems: "center",
    backgroundColor: "#fbeaea",
    borderRadius: 999,
    height: 72,
    justifyContent: "center",
    overflow: "hidden",
    width: 72
  },
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
  email: {
    color: "#6b7280",
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  header: {
    marginBottom: 16
  },
  heroCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14
  },
  heroText: {
    flex: 1,
    gap: 4
  },
  infoCard: {
    gap: 4,
    marginTop: 14
  },
  infoIcon: {
    alignItems: "center",
    backgroundColor: "#fbeaea",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  infoLabel: {
    color: "#6b7280",
    fontFamily: appFonts.regular,
    fontSize: 12,
    lineHeight: 16
  },
  infoRow: {
    alignItems: "center",
    borderBottomColor: "#f3f4f6",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12
  },
  infoText: {
    flex: 1,
    gap: 2
  },
  infoValue: {
    color: "#191c1d",
    fontFamily: appFonts.semiBold,
    fontSize: 15,
    lineHeight: 21
  },
  name: {
    color: "#191c1d",
    fontFamily: appFonts.bold,
    fontSize: 20,
    lineHeight: 26
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
  }
});
