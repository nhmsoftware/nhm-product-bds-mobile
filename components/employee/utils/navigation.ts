import { router, type Href } from "expo-router";

export function back(fallback: "/employee" | "/(app)/(tabs)" = "/employee") {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallback);
}

export function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function backFromNotifications(returnTo: string | string[] | undefined, fallback: "/employee" | "/(app)/(tabs)") {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  const target = paramValue(returnTo);

  if (target) {
    router.replace(target as Href);
    return;
  }

  router.replace(fallback);
}

export function home() {
  router.replace("/employee");
}

export function backToCheckIn() {
  router.replace("/employee/check-in");
}

export function backToCheckInHistory() {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  backToCheckIn();
}

export function backToRequiredLearning() {
  router.dismissTo("/employee/required-learning");
}

export function backToProfile() {
  router.replace("/employee/profile");
}

export function isProfileBackSource(source: unknown) {
  const value = Array.isArray(source) ? source[0] : source;
  return value === "profile";
}

export function backWithProfileSource(source: unknown) {
  if (isProfileBackSource(source)) {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    backToProfile();
    return;
  }

  back();
}
