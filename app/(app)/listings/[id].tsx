import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { InfoRow } from "@/components/InfoRow";
import { LoadingState } from "@/components/LoadingState";
import { RoleGuard } from "@/components/RoleGuard";
import { Screen } from "@/components/Screen";
import { Pressable } from "@/components/SafePressable";
import { StatusBadge } from "@/components/StatusBadge";
import { formatArea, formatCurrencyVnd, formatRelativeCount } from "@/libs/format";
import { useI18n } from "@/libs/i18n";
import { useAppTheme } from "@/libs/layout-mode";
import { notifyError, notifySuccess } from "@/libs/notify";
import { listingApi } from "@/services/listings/api";
import type { PropertyListing } from "@/services/listings/types";

export default function ListingDetailScreen() {
  return (
    <RoleGuard allowedRoles={["customer"]}>
      <ListingDetailContent />
    </RoleGuard>
  );
}

function ListingDetailContent() {
  const theme = useAppTheme();
  const { language, t } = useI18n();
  const params = useLocalSearchParams<{ id: string }>();
  const [listing, setListing] = useState<PropertyListing | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;

    Promise.all([
      listingApi.getById(params.id),
      listingApi.isSaved(params.id)
    ])
      .then(([listingResponse, savedState]) => {
        setListing(listingResponse.data);
        setSaved(savedState);
      })
      .catch((error) => notifyError(error, t("listing.error.detail")))
      .finally(() => setLoading(false));
  }, [params.id, t]);

  async function handleToggleSaved() {
    if (!listing) return;

    try {
      const response = await listingApi.toggleSaved(listing.id);
      setSaved(response.data.saved);
      notifySuccess({
        message: response.data.saved ? t("listing.saved") : t("listing.unsaved")
      });
    } catch (error) {
      notifyError(error, t("listing.error.saved"));
    }
  }

  if (loading || !listing) {
    return (
      <Screen scroll={false}>
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.iconButton,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md
            }
          ]}
        >
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>
        <Pressable
          onPress={handleToggleSaved}
          style={[
            styles.iconButton,
            {
              backgroundColor: saved ? theme.colors.primary : theme.colors.surface,
              borderColor: saved ? theme.colors.primary : theme.colors.border,
              borderRadius: theme.radius.md
            }
          ]}
        >
          <Ionicons
            name={saved ? "heart" : "heart-outline"}
            size={22}
            color={saved ? theme.colors.ink : theme.colors.text}
          />
        </Pressable>
      </View>

      <Card style={styles.hero}>
        <View
          style={[
            styles.media,
            {
              backgroundColor: theme.colors.surfaceAlt,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md
            }
          ]}
        >
          <Ionicons name="business-outline" size={44} color={theme.colors.primary} />
          <Text style={[styles.mediaCode, { color: theme.colors.muted }]}>{listing.code}</Text>
        </View>
        <View style={styles.badges}>
          <StatusBadge label={t(`listingType.${listing.listingType}`)} tone="primary" />
          <StatusBadge label={t(`listingStatus.${listing.status}`)} tone="success" />
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>{listing.title}</Text>
        <Text style={[styles.address, { color: theme.colors.muted }]}>
          {listing.address}, {listing.ward}, {listing.district}, {listing.city}
        </Text>
        <Text style={[styles.price, { color: theme.colors.primary }]}>
          {formatCurrencyVnd(listing.priceVnd, language)}
        </Text>
      </Card>

      <Card>
        <InfoRow label={t("listing.area")} value={formatArea(listing.areaM2, language)} />
        <InfoRow label={t("listing.bedrooms")} value={t("listing.roomCount", { count: listing.bedrooms })} />
        <InfoRow label={t("listing.bathrooms")} value={t("listing.roomCount", { count: listing.bathrooms })} />
        <InfoRow label={t("listing.direction")} value={listing.direction ?? t("common.updating")} />
        <InfoRow label={t("listing.legal")} value={listing.legalStatus} />
        <InfoRow label={t("listing.views")} value={formatRelativeCount(listing.viewCount, language)} />
      </Card>

      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t("listing.description")}</Text>
        <Text style={[styles.description, { color: theme.colors.muted }]}>{listing.description}</Text>
      </Card>

      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t("listing.highlights")}</Text>
        <View style={styles.chips}>
          {listing.highlights.map((item) => (
            <View
              key={item}
              style={[
                styles.chip,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.full
                }
              ]}
            >
              <Text style={[styles.chipText, { color: theme.colors.text }]}>{item}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card style={styles.agentCard}>
        <View style={styles.agentCopy}>
          <Text style={[styles.agentName, { color: theme.colors.text }]}>{listing.agent.name}</Text>
          <Text style={[styles.agentMeta, { color: theme.colors.muted }]}>
            {listing.agent.agency} · {listing.agent.phone}
          </Text>
        </View>
        <Button title={t("common.consult")} onPress={() => router.push("/(app)/(tabs)/inquiries")} style={styles.agentButton} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12
  },
  iconButton: {
    alignItems: "center",
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  hero: {
    gap: 12,
    marginBottom: 12
  },
  media: {
    alignItems: "center",
    borderWidth: 1,
    gap: 8,
    height: 190,
    justifyContent: "center"
  },
  mediaCode: {
    fontSize: 12,
    fontWeight: "900"
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 30
  },
  address: {
    fontSize: 14,
    lineHeight: 20
  },
  price: {
    fontSize: 24,
    fontWeight: "900"
  },
  section: {
    gap: 10,
    marginTop: 12
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "900"
  },
  description: {
    fontSize: 14,
    lineHeight: 21
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  chip: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  chipText: {
    fontSize: 12,
    fontWeight: "800"
  },
  agentCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginTop: 12
  },
  agentCopy: {
    flex: 1,
    gap: 4
  },
  agentName: {
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 20
  },
  agentMeta: {
    fontSize: 13,
    lineHeight: 18
  },
  agentButton: {
    minWidth: 104
  }
});
