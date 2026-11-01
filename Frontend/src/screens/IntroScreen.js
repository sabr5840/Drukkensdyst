
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  Easing,
  StatusBar,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";

const COLORS = {
  background: "#f8f3ef",
  shape: "#dbe6f1",
  navy: "#0b2250",
};

// Organisk, deform cirkel
const OrganicShape = ({ style }) => (
  <Svg
    viewBox="0 0 500 500"
    width="100%"
    height="100%"
    style={style}
  >
    <Path
      d={`
        M 247 35
        C 303 35, 327 76, 383 71
        C 441 65, 469 113, 463 166
        C 456 218, 483 248, 470 292
        C 458 336, 478 367, 442 404
        C 405 443, 360 422, 314 449
        C 263 479, 211 463, 169 436
        C 128 410, 88 395, 72 351
        C 58 312, 32 286, 35 248
        C 38 207, 72 187, 91 150
        C 110 112, 116 66, 164 47
        C 193 35, 218 36, 247 35
        Z
      `}
      fill={COLORS.shape}
    />
  </Svg>
);

export default function IntroScreen() {
  const navigation = useNavigation();

  const [showIntro, setShowIntro] = useState(false);
  const [layout, setLayout] = useState({
    width: 0,
    height: 0,
  });

  const zoom = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const introOpacity = useRef(new Animated.Value(0)).current;

  const w = layout.width;
  const h = layout.height;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(zoom, {
          toValue: 12,
          duration: 950,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 950,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!finished) return;

        setShowIntro(true);

        Animated.parallel([
          Animated.timing(overlayOpacity, {
            toValue: 0,
            duration: 550,
            useNativeDriver: true,
          }),
          Animated.timing(introOpacity, {
            toValue: 1,
            duration: 650,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 5000);

    return () => {
      clearTimeout(timer);
      zoom.stopAnimation();
      overlayOpacity.stopAnimation();
      introOpacity.stopAnimation();
    };
  }, [zoom, overlayOpacity, introOpacity]);

  // Placering af den store lyseblå cirkel
  const blobSize = w * 1.08;
  const blobTop = h * 0.29;
  const blobHeight = h * 0.49;
  const blobCenterY = blobTop + blobHeight / 2;

  return (
    <View
      style={styles.container}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;

        if (
          width !== layout.width ||
          height !== layout.height
        ) {
          setLayout({ width, height });
        }
      }}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.background}
      />

      {w > 0 && h > 0 && (
        <>
          {/* Dekoration øverst til højre */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              width: w * 0.58,
              height: h * 0.34,
              top: h * 0.01,
              right: -w * 0.31,
              transform: [{ rotate: "25deg" }],
            }}
          >
            <OrganicShape />
          </View>

          {/* Dekoration nederst til venstre */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              width: w * 0.49,
              height: w * 0.49,
              bottom: -w * 0.22,
              left: -w * 0.22,
              transform: [{ rotate: "-20deg" }],
            }}
          >
            <OrganicShape />
          </View>

          {/* =====================================
              FØRSTE SKÆRM: LOGO OG ANIMATION
              ===================================== */}
          {!showIntro && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.splashContainer,
                {
                  width: w,
                  height: h,
                  transform: [{ scale: zoom }],
                },
              ]}
            >
              <View
                style={{
                  position: "absolute",
                  width: w * 0.98,
                  height: w * 0.98,
                  transform: [{ translateY: -20 }],
                }}
              >
                <OrganicShape />
              </View>

              <Image
                source={require("../../assets/logo-.png")}
                style={{
                  width: w * 1.02,
                  height: w * 0.7,
                  transform: [{ translateY: -20 }],
                }}
                resizeMode="contain"
              />
            </Animated.View>
          )}

          {/* =====================================
              ANDEN SKÆRM: INTRODUKTION
              ===================================== */}
          {showIntro && (
            <Animated.View
              style={[
                styles.introContainer,
                {
                  width: w,
                  height: h,
                  opacity: introOpacity,
                },
              ]}
            >
              {/* Stor organisk cirkel */}
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  width: blobSize,
                  height: blobHeight,
                  top: blobTop,
                  left: (w - blobSize) / 2,
                }}
              >
                <OrganicShape />
              </View>

              {/* To cocktailglas øverst til højre */}
              <Image
                source={require("../../assets/glas.png")}
                resizeMode="contain"
                style={{
                  position: "absolute",
                  width: w * 0.28,
                  height: w * 0.28,
                  top: h * 0.075,
                  right: w * 0.19,
                  zIndex: 3,
                }}
              />

              {/* Ét cocktailglas til venstre */}
              <Image
                source={require("../../assets/glas-mod-højre.png")}
                resizeMode="contain"
                style={{
                  position: "absolute",
                  width: w * 0.20,
                  height: w * 0.27,
                  left: -w * 0.015,
                  top: h * 0.35,
                  zIndex: 3,
                }}
              />

              {/* Teksten i den store cirkel */}
              <View
                style={[
                  styles.textContainer,
                  {
                    position: "absolute",
                    width: w * 0.76,
                    left: w * 0.12,
                    top: blobCenterY - 113,
                  },
                ]}
              >
                <Text style={styles.description}>
                  Grin, konkurrér og skål jer gennem en
                  aften fyldt med udfordringer, drukspil
                  og uventede twists.
                </Text>

                <Text style={styles.description}>
                  Spillet spilles med alles telefoner
                  og kræver mindst 2 spillere. Der kan
                  deltage op til 15 spillere.
                </Text>

                <Text style={styles.finalText}>
                  Kun én kan blive aftenens fuldeste –
                  er du klar til dysten?
                </Text>
              </View>

              {/* Første glas nederst til højre */}
              <Image
                source={require("../../assets/glas-mod-højre.png")}
                resizeMode="contain"
                style={{
                  position: "absolute",
                  width: w * 0.20,
                  height: w * 0.28,
                  right: w * 0.16,
                  top: h * 0.66,
                  zIndex: 3,
                }}
              />

              {/* Andet glas nederst til højre */}
              <Image
                source={require("../../assets/glas-mod-venstre.png")}
                resizeMode="contain"
                style={{
                  position: "absolute",
                  width: w * 0.23,
                  height: w * 0.31,
                  right: -w * 0.015,
                  top: h * 0.625,
                  zIndex: 3,
                }}
              />

              {/* Kom i gang-knap */}
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    width: w * 0.66,
                    bottom: Math.max(35, h * 0.045),
                  },
                ]}
                onPress={() =>
                  navigation.navigate("CreateUser")
                }
                activeOpacity={0.85}
              >
                <Text style={styles.buttonText}>
                  Kom i gang
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </>
      )}

      {/* Mørkeblå overgang mellem skærmene */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.overlay,
          { opacity: overlayOpacity },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  splashContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  introContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    alignItems: "center",
    overflow: "hidden",
  },

  textContainer: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },

  description: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.navy,
    textAlign: "center",
    marginBottom: 22,
  },

  finalText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.navy,
    textAlign: "center",
  },

  button: {
    position: "absolute",
    paddingVertical: 14,
    borderRadius: 35,
    backgroundColor: COLORS.navy,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.navy,
    zIndex: 10,
  },
});
