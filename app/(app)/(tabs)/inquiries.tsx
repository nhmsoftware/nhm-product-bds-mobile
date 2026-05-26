import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageTitle } from "@/components/PageTitle";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { useI18n } from "@/libs/i18n";
import { useAppTheme } from "@/libs/layout-mode";
import { notifyError, notifySuccess } from "@/libs/notify";
import { useAuth } from "@/services/auth/store";
import { inquiryApi } from "@/services/inquiries/api";

export default function InquiriesScreen() {
  const theme = useAppTheme();
  const { t } = useI18n();
  const { session } = useAuth();
  const [fullName, setFullName] = useState(session?.user.fullName ?? "");
  const [phone, setPhone] = useState(session?.user.phone ?? "");
  const [message, setMessage] = useState(() => t("inquiry.defaultMessage"));
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const response = await inquiryApi.create({ fullName, phone, message });
      notifySuccess({ message: response.message });
      setMessage("");
    } catch (error) {
      notifyError(error, t("inquiry.error.submit"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen edges={["top", "left", "right"]}>
      <PageTitle
        title={t("inquiry.title")}
        subtitle={t("inquiry.subtitle")}
      />

      <Card style={styles.form}>
        <TextField
          label={t("inquiry.label.fullName")}
          value={fullName}
          onChangeText={setFullName}
          placeholder={t("inquiry.placeholder.fullName")}
        />
        <TextField
          label={t("inquiry.label.phone")}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder={t("inquiry.placeholder.phone")}
        />
        <TextField
          label={t("inquiry.label.demand")}
          value={message}
          onChangeText={setMessage}
          placeholder={t("inquiry.placeholder.demand")}
          multiline
          numberOfLines={5}
          style={styles.textarea}
        />
        <Button
          title={t("inquiry.submit")}
          loading={submitting}
          disabled={!fullName || !phone || !message}
          onPress={handleSubmit}
        />
      </Card>

      <View style={styles.note}>
        <Text style={[styles.noteText, { color: theme.colors.muted }]}>
          {t("inquiry.note")}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 14
  },
  textarea: {
    minHeight: 120,
    paddingTop: 12,
    textAlignVertical: "top"
  },
  note: {
    paddingVertical: 16
  },
  noteText: {
    fontSize: 13,
    lineHeight: 19
  }
});
