import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet } from "react-native";
import { appFonts } from "@/libs/typography";
import type { ApiObject } from "../utils/apiNormalizers";
import { apiText } from "../utils/apiNormalizers";
import { formatWatchTime } from "./lessonHelpers";

type Props = {
  activeLockRequest: ApiObject;
  timeLeft: number;
};

function formatDigitalTime(seconds: number) {
  if (seconds <= 0) return "00:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  }
  return `${pad(minutes)}:${pad(secs)}`;
}

export function LessonLockTimer({ activeLockRequest, timeLeft }: Props) {
  if (!activeLockRequest || timeLeft <= 0) return null;

  const isMine = Boolean(activeLockRequest.is_mine);
  const userName = apiText(activeLockRequest.user_name, "Nhân viên khác");

  return (
    <View style={styles.lockTimerCard}>
      <View style={styles.lockTimerHeader}>
        <Ionicons
          name="time-outline"
          size={22}
          color={isMine ? "#16a34a" : "#ca8a04"}
        />
        <Text style={styles.lockTimerTitle}>
          {isMine ? "Bạn đang giữ chỗ lô này" : "Lô đất đang được giữ chỗ"}
        </Text>
      </View>
      <Text style={styles.lockTimerText}>
        {isMine
          ? "Thời gian giữ chỗ còn lại của bạn:"
          : `Được giữ chỗ bởi: ${userName}`
        }
      </Text>
      <Text style={[
        styles.lockTimerCountdown,
        isMine ? styles.lockTimerCountdownMine : styles.lockTimerCountdownOther
      ]}>
        {formatDigitalTime(timeLeft)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lockTimerCard: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    alignItems: "center",
    shadowColor: "#d97706",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  lockTimerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  lockTimerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#78350f",
    marginLeft: 6,
    fontFamily: appFonts.bold,
  },
  lockTimerText: {
    fontSize: 13,
    color: "#b45309",
    marginBottom: 8,
    textAlign: "center",
    fontFamily: appFonts.regular,
  },
  lockTimerCountdown: {
    fontSize: 28,
    fontWeight: "800",
    fontFamily: appFonts.bold || "System",
    letterSpacing: 2,
  },
  lockTimerCountdownMine: {
    color: "#16a34a",
  },
  lockTimerCountdownOther: {
    color: "#ca8a04",
  },
});
