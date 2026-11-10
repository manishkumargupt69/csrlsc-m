import { useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import * as SplashScreen from "expo-splash-screen";

const INTRO_DURATION_MS = 420;
const DISPLAY_DURATION_MS = 900;
const EXIT_DURATION_MS = 260;

interface LaunchSplashState {
  iconScale: Animated.Value;
  isVisible: boolean;
  opacity: Animated.Value;
}

export const useLaunchSplash = (isAppReady: boolean): LaunchSplashState => {
  const [isVisible, setIsVisible] = useState(true);
  const hasStarted = useRef(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.84)).current;

  useEffect(() => {
    if (!isAppReady || hasStarted.current) {
      return;
    }

    hasStarted.current = true;
    let isMounted = true;
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          duration: INTRO_DURATION_MS,
          easing: Easing.out(Easing.cubic),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.spring(iconScale, {
          damping: 12,
          mass: 0.8,
          stiffness: 150,
          toValue: 1,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(DISPLAY_DURATION_MS),
      Animated.timing(opacity, {
        duration: EXIT_DURATION_MS,
        easing: Easing.in(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }),
    ]);

    const startAnimation = async (): Promise<void> => {
      try {
        await SplashScreen.hideAsync();
      } finally {
        if (isMounted) {
          animation.start(({ finished }) => {
            if (finished && isMounted) {
              setIsVisible(false);
            }
          });
        }
      }
    };

    void startAnimation();
    return () => {
      isMounted = false;
      animation.stop();
    };
  }, [iconScale, isAppReady, opacity]);

  return { iconScale, isVisible, opacity };
};
