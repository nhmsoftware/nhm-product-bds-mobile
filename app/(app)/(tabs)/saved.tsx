import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { PageTitle } from "@/components/PageTitle";
import { PropertyCard } from "@/components/PropertyCard";
import { Screen } from "@/components/Screen";
import { useI18n } from "@/libs/i18n";
import { useAppTheme } from "@/libs/layout-mode";
import { notifyError } from "@/libs/notify";
import { listingApi } from "@/services/listings/api";
import type { PropertyListing } from "@/services/listings/types";

export default function SavedScreen() {
  const theme = useAppTheme();
  const { t } = useI18n();
  const [items, setItems] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      listingApi
        .getSaved()
        .then((response) => setItems(response.data.items))
        .catch((error) => notifyError(error, t("saved.error.load")))
        .finally(() => setLoading(false));
    }, [t])
  );

  return (
    <Screen edges={["top", "left", "right"]}>
      <PageTitle
        title={t("saved.title")}
        subtitle={t("saved.subtitle")}
      />

      {loading ? (
        <LoadingState />
      ) : items.length ? (
        <View style={styles.list}>
          {items.map((listing) => (
            <PropertyCard key={listing.id} listing={listing} compact={theme.compact} />
          ))}
        </View>
      ) : (
        <EmptyState
          title={t("saved.empty.title")}
          description={t("saved.empty.description")}
          icon="heart-outline"
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12
  }
});
