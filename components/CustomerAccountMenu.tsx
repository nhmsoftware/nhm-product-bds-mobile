import {
  Ionicons } from "@expo/vector-icons";
import { router,
  type Href } from "expo-router";
import type { ComponentProps } from "react";
import { Modal,
  StyleSheet,
  Text,
  View
} from "react-native";
import { Pressable } from "@/components/SafePressable";
import { SafeAreaView } from "react-native-safe-area-context";

import { appFonts } from "@/libs/typography";
import { useAuth } from "@/services/auth/store";

type MenuItem = {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  route?: Href;
  tone?: "default" | "danger";
};

const menuItems: MenuItem[] = [
  { icon: "person-outline", label: "Thông tin cá nhân", route: "/(app)/(tabs)/profile" },
  { icon: "create-outline", label: "Chỉnh sửa hồ sơ", route: "/(app)/profile/edit" },
  { icon: "heart-outline", label: "Dự án đã lưu / đã quan tâm", route: "/(app)/(tabs)/saved" },
  { icon: "chatbubble-ellipses-outline", label: "Lịch sử yêu cầu tư vấn", route: "/(app)/(tabs)/inquiries" },
  { icon: "settings-outline", label: "Cài đặt / đổi mật khẩu", route: "/(app)/profile/change-password" },
  { icon: "log-out-outline", label: "Đăng xuất", tone: "danger" }
];

type CustomerAccountMenuProps = {
  onClose: () => void;
  visible: boolean;
};

export function CustomerAccountMenu({ onClose, visible }: CustomerAccountMenuProps) {
  const { signOut } = useAuth();

  async function handlePress(item: MenuItem) {
    onClose();

    if (item.route) {
      router.push(item.route);
      return;
    }

    await signOut();
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modalRoot}>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.backdrop} />
        <SafeAreaView edges={["bottom"]} style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Tài khoản khách hàng</Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color="#5b403c" />
            </Pressable>
          </View>

          <View style={styles.menuList}>
            {menuItems.map((item) => (
              <Pressable
                accessibilityRole="button"
                key={item.label}
                onPress={() => handlePress(item)}
                style={styles.menuItem}
              >
                <View style={[styles.iconWrap, item.tone === "danger" && styles.iconWrapDanger]}>
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={item.tone === "danger" ? "#950100" : "#6a0100"}
                  />
                </View>
                <Text style={[styles.menuLabel, item.tone === "danger" && styles.menuLabelDanger]}>{item.label}</Text>
                {item.route ? <Ionicons name="chevron-forward" size={18} color="#9ca3af" /> : null}
              </Pressable>
            ))}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end"
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17, 24, 39, 0.38)"
  },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 8,
    paddingHorizontal: 20,
    paddingTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 12
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "#d8dadc",
    borderRadius: 999,
    height: 4,
    marginBottom: 14,
    width: 42
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },
  title: {
    color: "#191c1d",
    fontFamily: appFonts.bold,
    fontSize: 20,
    lineHeight: 28
  },
  closeButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  menuList: {
    paddingBottom: 8
  },
  menuItem: {
    alignItems: "center",
    borderBottomColor: "#f3f4f6",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 58
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: "#fbeaea",
    borderRadius: 999,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  iconWrapDanger: {
    backgroundColor: "#fff1f1"
  },
  menuLabel: {
    color: "#191c1d",
    flex: 1,
    fontFamily: appFonts.semiBold,
    fontSize: 15,
    lineHeight: 22
  },
  menuLabelDanger: {
    color: "#950100"
  }
});
