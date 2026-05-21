import { Link } from "expo-router";
import { StyleSheet, Text } from "react-native";

import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { colors } from "@/libs/theme";

export default function NotFound() {
  return (
    <Screen>
      <Text style={styles.title}>Không tìm thấy màn hình</Text>
      <Link href="/(app)/(tabs)" asChild>
        <Button title="Về trang chính" />
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 20
  }
});
