import { forwardRef, useCallback, useRef, type ComponentProps, type ElementRef } from "react";
import { Pressable as NativePressable } from "react-native";

type NativePressableProps = ComponentProps<typeof NativePressable>;

export type SafePressableProps = NativePressableProps & {
  disablePressThrottle?: boolean;
  pressThrottleMs?: number;
};

const DEFAULT_PRESS_THROTTLE_MS = 650;

export const Pressable = forwardRef<ElementRef<typeof NativePressable>, SafePressableProps>(
  ({ disablePressThrottle, onPress, pressThrottleMs = DEFAULT_PRESS_THROTTLE_MS, ...props }, ref) => {
    const nextAllowedPressAtRef = useRef(0);

    const handlePress = useCallback<NonNullable<NativePressableProps["onPress"]>>(
      (event) => {
        if (!onPress) return;

        if (disablePressThrottle || pressThrottleMs <= 0) {
          onPress(event);
          return;
        }

        const now = Date.now();
        if (now < nextAllowedPressAtRef.current) {
          event.stopPropagation?.();
          return;
        }

        nextAllowedPressAtRef.current = now + pressThrottleMs;
        onPress(event);
      },
      [disablePressThrottle, onPress, pressThrottleMs]
    );

    return <NativePressable ref={ref} {...props} onPress={handlePress} />;
  }
);

Pressable.displayName = "SafePressable";
