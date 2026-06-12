import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/libs/env";

export type ConsultationHistoryItem = {
  id: string;
  type: "consultation" | "callback";
  submittedAt: string; // ISO String
  fullName: string;
  phone: string;
  email?: string;
  projectName?: string;
  content?: string; // for consultation
  preferredCallbackTime?: string; // for callback
};

export async function getConsultationHistory(): Promise<ConsultationHistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.consultationHistory);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (error) {
    return [];
  }
}

export async function saveConsultationToHistory(
  item: Omit<ConsultationHistoryItem, "id" | "submittedAt">
): Promise<void> {
  try {
    const history = await getConsultationHistory();
    const newItem: ConsultationHistoryItem = {
      ...item,
      id: Math.random().toString(36).substring(2, 11),
      submittedAt: new Date().toISOString()
    };
    const nextHistory = [newItem, ...history];
    await AsyncStorage.setItem(STORAGE_KEYS.consultationHistory, JSON.stringify(nextHistory));
  } catch (error) {
    // Ignore storage errors
  }
}

export async function deleteConsultationHistoryItem(id: string): Promise<ConsultationHistoryItem[]> {
  try {
    const history = await getConsultationHistory();
    const nextHistory = history.filter((item) => item.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.consultationHistory, JSON.stringify(nextHistory));
    return nextHistory;
  } catch (error) {
    return [];
  }
}

export async function clearConsultationHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.consultationHistory);
  } catch (error) {
    // Ignore storage errors
  }
}
