import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Modal, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Pressable } from "@/components/SafePressable";
import type { ImageSourcePropType } from "react-native";
import { appFonts } from "@/libs/typography";

type Props = {
  visible: boolean;
  images: ImageSourcePropType[];
  initialIndex: number;
  onClose: () => void;
};

export function LessonFullscreenImage({ visible, images, initialIndex, onClose }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  function handleScrollEnd(event: any) {
    const width = event.nativeEvent.layoutMeasurement.width;
    if (!width) return;
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(Math.min(Math.max(nextIndex, 0), images.length - 1));
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#ffffff" />
          </Pressable>
          <Text style={styles.counter}>
            {images.length > 0 ? `${currentIndex + 1}/${images.length}` : ""}
          </Text>
        </View>
        <ScrollView
          bounces={false}
          decelerationRate="fast"
          horizontal
          onMomentumScrollEnd={handleScrollEnd}
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.scrollView}
        >
          {images.map((source, index) => (
            <View key={`full-${index}`} style={{ width: windowWidth }}>
              <Image source={source} style={styles.image} resizeMode="contain" />
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(0,0,0,0.95)",
    flex: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  closeButton: {
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  counter: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: appFonts.semiBold,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  image: {
    height: "100%",
    resizeMode: "contain",
    width: "100%",
  },
});
