import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
} from "react-native";
import { Pressable } from "@/components/SafePressable";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmployeeNotificationButton } from "@/components/EmployeeUI";
import { employeePalette } from "@/libs/employee-theme";
import { appLogger } from "@/libs/logger";
import { ApiRequestError } from "@/libs/api";
import { employeeApi } from "@/services/employee/api";
import { styles } from "@/components/employee/utils/styles";
import { apiList, apiBoolean, apiText, type ApiObject } from "./utils/apiNormalizers";
import { inventoryAreaFilterOptions, inventoryImages, type InventoryAreaFilterValue } from "./utils/constants";
import { back } from "./utils/navigation";


// ---- Local helpers extracted from original monolith ----

function inventoryAreaLotCount(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? Math.trunc(count) : null;
}

function inventoryAreaAvailability(area: ApiObject) {
  const remainingLots = inventoryAreaLotCount(area.remaining_lots ?? area.remainingLots);
  const totalLots = inventoryAreaLotCount(area.total_lots ?? area.totalLots);

  if (remainingLots !== null && totalLots !== null) {
    return `Còn ${remainingLots}/${totalLots} lô`;
  }

  return apiText(area.available_label ?? area.available ?? area.available_count, "Còn hàng");
}

function inventoryAreaTotal(area: ApiObject) {
  const totalLots = inventoryAreaLotCount(area.total_lots ?? area.totalLots);
  return totalLots !== null ? `Tổng: ${totalLots} lô` : apiText(area.total, "Tổng: --");
}

function inventoryAreaHasStock(area: ApiObject) {
  const remainingLots = inventoryAreaLotCount(area.remaining_lots ?? area.remainingLots);
  if (remainingLots !== null) return remainingLots > 0;

  const status = apiText(area.status ?? area.label_status ?? area.lable_status, "").toLowerCase();
  return !status.includes("hết");
}

function inventoryAreaMatchesFilter(area: ApiObject, filter: InventoryAreaFilterValue) {
  if (filter === "all") return true;
  if (filter === "featured") return apiBoolean(area.is_featured ?? area.isFeatured ?? area.is_hot ?? area.hot, false);
  if (filter === "available") return inventoryAreaHasStock(area);
  return !inventoryAreaHasStock(area);
}

interface InventoryAreaCardItem {
  available: string;
  cover: string;
  id: string;
  image: string;
  name: string;
  total: string;
  type: string;
  lotId?: string;
}

function inventoryAreaCardFromRecord(area: ApiObject, index: number): InventoryAreaCardItem {
  const recordType = apiText(area.record_type ?? area.recordType ?? area.type ?? area.entity_type ?? area.entityType ?? area.item_type ?? area.itemType ?? area.kind, "area");
  const name = apiText(area.name ?? area.title ?? area.label ?? area.area_name ?? area.areaName, `Khu đất ${index + 1}`);
  const remainingLots = inventoryAreaLotCount(area.remaining_lots ?? area.remainingLots);
  const totalLots = inventoryAreaLotCount(area.total_lots ?? area.totalLots);
  const available = remainingLots !== null && totalLots !== null
    ? `Còn ${remainingLots}/${totalLots} lô`
    : apiText(area.available_label ?? area.available ?? area.available_count, "Còn hàng");
  const total = totalLots !== null ? `Tổng: ${totalLots} lô` : apiText(area.total, "Tổng: --");
  const cover = apiText(area.cover_url ?? area.coverUrl ?? area.image ?? area.thumbnail ?? area.thumb ?? area.image_url ?? area.imageUrl, "");
  const lotId = area.lot_id ? apiText(area.lot_id) : (area.lotId ? apiText(area.lotId) : undefined);

  return {
    available,
    cover,
    id: apiText(area.id ?? area._id ?? area.slug ?? area.code, `area-${index}`),
    image: cover,
    name,
    total,
    type: recordType,
    lotId
  };
}

export function InventoryListScreen() {
  const [areaRows, setAreaRows] = useState<ApiObject[]>([]);
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [failed, setFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState("Không thể tải danh sách khu đất.");
  const [filterPickerVisible, setFilterPickerVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<InventoryAreaFilterValue>("all");
  const filteredRows = useMemo(
    () => areaRows.filter((area) => inventoryAreaMatchesFilter(area, selectedFilter)),
    [areaRows, selectedFilter]
  );
  const zones = useMemo(
    () => filteredRows.map((area, index) => inventoryAreaCardFromRecord(area, index)),
    [filteredRows]
  );
  const hasSearchText = Boolean(debouncedSearchText);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearchText(searchText.trim());
    }, 350);

    return () => clearTimeout(handle);
  }, [searchText]);

  useEffect(() => {
    let mounted = true;
    const params = selectedFilter === "featured" && !debouncedSearchText
      ? { filters: { is_featured: "true" } }
      : undefined;
    const request = debouncedSearchText
      ? employeeApi.searchAreas(debouncedSearchText)
      : employeeApi.areas(params);

    setLoading(true);
    setFailed(false);
    setErrorMessage("Không thể tải danh sách khu đất.");

    request
      .then((response) => {
        if (!mounted) return;
        setAreaRows(apiList(response.data));
      })
      .catch((error) => {
        if (!mounted) return;

        if (error instanceof ApiRequestError && error.status === 404) {
          setAreaRows([]);
          return;
        }

        setAreaRows([]);
        setFailed(true);
        const msg = error instanceof Error ? error.message : "Không thể tải danh sách khu đất.";
        setErrorMessage(msg);
        appLogger.warn("employee.inventory", msg, { error });
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [debouncedSearchText, selectedFilter]);

  return (
    <SafeAreaView style={styles.inventoryAreaSafe}>
      <View style={styles.inventoryAreaHeader}>
        <View style={styles.inventoryAreaHeaderLeft}>
          <Pressable accessibilityRole="button" onPress={() => back()} style={styles.inventoryAreaIconButton}>
            <Ionicons name="arrow-back" size={24} color="#111111" />
          </Pressable>
          <Text style={styles.inventoryAreaTitle}>Danh sách Khu đất</Text>
        </View>
        <EmployeeNotificationButton returnTo="/employee/inventory" />
      </View>

      <ScrollView
        contentContainerStyle={styles.inventoryAreaScroll}
        showsVerticalScrollIndicator={false}
        style={styles.inventoryAreaRoot}
      >
        <View style={styles.inventoryAreaSearchRow}>
          <View style={styles.inventoryAreaSearchInput}>
            <Ionicons name="search" size={22} color="#8f706b" />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              onChangeText={setSearchText}
              placeholder="Tìm khu đất, mã lô..."
              placeholderTextColor="#8f706b"
              returnKeyType="search"
              style={styles.inventoryAreaSearchText}
              value={searchText}
            />
            {searchText ? (
              <Pressable accessibilityRole="button" onPress={() => setSearchText("")} style={styles.inventoryAreaClearButton}>
                <Ionicons name="close" size={18} color={employeePalette.muted} />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setFilterPickerVisible(true)}
            style={[styles.inventoryAreaFilterButton, selectedFilter !== "all" && styles.inventoryAreaFilterButtonActive]}
          >
            <Ionicons name="filter" size={22} color={selectedFilter !== "all" ? employeePalette.redDark : employeePalette.muted} />
          </Pressable>
        </View>

        {loading ? <Text style={styles.bodyText}>Đang tải khu đất...</Text> : null}
        {failed ? <Text style={styles.bodyText}>{errorMessage}</Text> : null}
        {!loading && !failed && zones.length === 0 ? (
          <Text style={styles.bodyText}>{hasSearchText ? "Không tìm thấy khu đất phù hợp." : "Chưa có dữ liệu khu đất."}</Text>
        ) : null}
        <View style={styles.inventoryAreaGrid}>
          {zones.map((zone) => (
            <InventoryZoneCard key={`${zone.id || zone.name}-${zone.lotId || "area"}`} {...zone} />
          ))}
        </View>
      </ScrollView>

      <InventoryAreaFilterPicker
        onClose={() => setFilterPickerVisible(false)}
        onSelect={(value) => {
          setSelectedFilter(value);
          setFilterPickerVisible(false);
        }}
        selectedFilter={selectedFilter}
        visible={filterPickerVisible}
      />

    </SafeAreaView>
  );
}

function InventoryAreaFilterPicker({
  onClose,
  onSelect,
  selectedFilter,
  visible
}: {
  onClose: () => void;
  onSelect: (value: InventoryAreaFilterValue) => void;
  selectedFilter: InventoryAreaFilterValue;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.inventoryAreaFilterBackdrop} onPress={onClose}>
        <Pressable style={styles.inventoryAreaFilterModal} onPress={(event) => event.stopPropagation()}>
          <View style={styles.inventoryAreaFilterModalHeader}>
            <Text style={styles.inventoryAreaFilterModalTitle}>Lọc khu đất</Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.inventoryAreaFilterCloseButton}>
              <Ionicons color={employeePalette.text} name="close" size={20} />
            </Pressable>
          </View>
          <View style={styles.inventoryAreaFilterModalList}>
            {inventoryAreaFilterOptions.map((option) => {
              const active = option.value === selectedFilter;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={option.value}
                  onPress={() => onSelect(option.value)}
                  style={[styles.inventoryAreaFilterOption, active && styles.inventoryAreaFilterOptionActive]}
                >
                  <Text style={[styles.inventoryAreaFilterOptionText, active && styles.inventoryAreaFilterOptionTextActive]}>
                    {option.label}
                  </Text>
                  {active ? <Ionicons color={employeePalette.goldDark} name="checkmark" size={20} /> : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function InventoryZoneCard({
  available,
  hot,
  id,
  image,
  lotId,
  name,
  total,
  type
}: {
  available: string;
  hot?: boolean;
  id?: string;
  image: string | ImageSourcePropType;
  lotId?: string;
  name: string;
  total: string;
  type?: string;
}) {
  const resolvedImage = typeof image === "string"
    ? (image ? { uri: image } : inventoryImages.planningArea)
    : image;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        if (type === "lot") {
          router.push({
            pathname: "/employee/lot-detail",
            params: id ? { lotId: id } : undefined
          });
        } else {
          router.push({
            pathname: "/employee/inventory-map",
            params: id ? { areaId: id, ...(lotId ? { lotId } : {}) } : undefined
          });
        }
      }}
      style={({ pressed }) => [styles.inventoryAreaCard, pressed && styles.pressed]}
    >
      <View style={styles.inventoryAreaCardImageWrap}>
        <Image source={resolvedImage} style={styles.inventoryAreaCardImage} />
        {hot ? (
          <View style={styles.inventoryAreaHotPill}>
            <Text style={styles.inventoryAreaHotText}>HOT</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.inventoryAreaCardBody}>
        <View style={styles.inventoryAreaCardCopy}>
          <Text style={styles.inventoryAreaCardTitle}>{name}</Text>
          <View style={styles.inventoryAreaCardMeta}>
            <Ionicons name="grid-outline" size={12} color={employeePalette.muted} />
            <Text style={styles.inventoryAreaCardMetaText}>{total}</Text>
          </View>
        </View>
        <View style={styles.inventoryAreaCardFooter}>
          <Text style={styles.inventoryAreaCardAvailable}>{available}</Text>
          <Ionicons name="arrow-forward" size={18} color="#6a0100" />
        </View>
      </View>
    </Pressable>
  );
}


