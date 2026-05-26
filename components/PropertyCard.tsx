import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { formatArea, formatCurrencyVnd } from "@/libs/format";
import { useI18n } from "@/libs/i18n";
import { useAppTheme } from "@/libs/layout-mode";
import type { PropertyListing } from "@/services/listings/types";

type PropertyCardProps = {
  listing: PropertyListing;
  compact?: boolean;
};

export function PropertyCard({ listing, compact }: PropertyCardProps) {
  const theme = useAppTheme();
  const { language, t } = useI18n();
  const href = `/(app)/listings/${listing.id}` as Href;

  return (
    <Pressable onPress={() => router.push(href)} style={({ pressed }) => pressed && styles.pressed}>
      <Card style={[styles.card, compact && styles.cardCompact]}>
        <View
          style={[
            styles.media,
            {
              backgroundColor: theme.colors.surfaceAlt,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md
            },
            compact && styles.mediaCompact
          ]}
        >
          <Ionicons name="business-outline" size={compact ? 22 : 30} color={theme.colors.primary} />
          <Text style={[styles.mediaLabel, { color: theme.colors.muted }]}>{listing.code}</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.badges}>
            <StatusBadge label={t(`listingType.${listing.listingType}`)} tone="primary" />
            <StatusBadge label={t(`propertyType.${listing.type}`)} />
          </View>

          <Text
            style={[
              styles.title,
              compact && styles.titleCompact,
              { color: theme.colors.text }
            ]}
            numberOfLines={2}
          >
            {listing.title}
          </Text>

          <Text style={[styles.address, { color: theme.colors.muted }]} numberOfLines={1}>
            {listing.district}, {listing.city}
          </Text>

          <View style={styles.metaRow}>
            <Text style={[styles.price, { color: theme.colors.primary }]}>
              {formatCurrencyVnd(listing.priceVnd, language)}
            </Text>
            <Text style={[styles.meta, { color: theme.colors.muted }]}>
              {formatArea(listing.areaM2, language)}
            </Text>
          </View>

          <View style={styles.featureRow}>
            <Text style={[styles.feature, { color: theme.colors.muted }]}>
              {t("listing.bedroomsShort", { count: listing.bedrooms })}
            </Text>
            <Text style={[styles.feature, { color: theme.colors.muted }]}>
              {t("listing.bathroomsShort", { count: listing.bathrooms })}
            </Text>
            <Text style={[styles.feature, { color: theme.colors.muted }]}>
              {listing.legalStatus}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.86
  },
  card: {
    gap: 14,
    padding: 14
  },
  cardCompact: {
    flexDirection: "row"
  },
  media: {
    alignItems: "center",
    borderWidth: 1,
    gap: 6,
    height: 120,
    justifyContent: "center"
  },
  mediaCompact: {
    height: 94,
    width: 104
  },
  mediaLabel: {
    fontSize: 11,
    fontWeight: "800"
  },
  body: {
    flex: 1,
    gap: 8
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  title: {
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 22
  },
  titleCompact: {
    fontSize: 15,
    lineHeight: 20
  },
  address: {
    fontSize: 13
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  price: {
    fontSize: 16,
    fontWeight: "900"
  },
  meta: {
    fontSize: 13,
    fontWeight: "700"
  },
  featureRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  feature: {
    fontSize: 12,
    fontWeight: "700"
  }
});
