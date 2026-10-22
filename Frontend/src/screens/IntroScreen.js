
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
  useWindowDimensions,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";

const COLORS = {
  background: "#fefcf9",
  shape: "#dbe6f1",
  navy: "#0b2250",
};

const OrganicShape = ({ style }) => (
  <Svg
    viewBox="0 0 500 500"
    width="100%"
    height="100%"
    style={style}
  >
    <Path
      d="
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
      "
      fill={COLORS.shape}
    />
  </Svg>
);

export default function IntroScreen() {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();

  const [showIntro, setShowIntro] = useState(false);

  const zoom = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const introOpacity = useRef(new Animated.Value(0)).current;

  // Størrelser, der tilpasses telefonens skærm
  const blobSize = Math.min(width * 1.16, height * 0.52);
  const introBlobSize = Math.min(width * 1.18, height * 0.50);

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

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.background}
      />

      {/* Dekoration øverst til højre */}
      <View
        pointerEvents="none"
        style={[
          styles.topCorner,
          {
            width: width * 0.38,
            height: height * 0.26,
            top: height * 0.17,
            right: -width * 0.24,
          },
        ]}
      >
        <OrganicShape />
      </View>

      {/* Dekoration nederst til venstre */}
      <View
        pointerEvents="none"
        style={[
          styles.bottomCorner,
          {
            width: width * 0.52,
            height: width * 0.52,
            bottom: -width * 0.20,
            left: -width * 0.16,
          },
        ]}
      >
        <OrganicShape />
      </View>

      {/* STARTSKÆRM MED LOGO */}
      {!showIntro && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.splashContainer,
            { transform: [{ scale: zoom }] },
          ]}
        >
          <View
            style={{
              width: blobSize,
              height: blobSize,
              position: "absolute",
            }}
          >
            <OrganicShape />
          </View>

          <Image
            source={require("../../assets/logo-.png")}
            style={{
              width: width * 0.94,
              height: width * 0.68,
            }}
            resizeMode="contain"
          />
        </Animated.View>
      )}

      {/* INTRODUKTIONSSKÆRM */}
      {showIntro && (
        <Animated.View
          style={[
            styles.introContainer,
            { opacity: introOpacity },
          ]}
        >
          {/* Den organiske form bag teksten */}
          <View
            pointerEvents="none"
            style={[
              styles.introBlob,
              {
                width: introBlobSize,
                height: introBlobSize,
                top: height * 0.25,
              },
            ]}
          >
            <OrganicShape />
          </View>

          {/* Cocktailglas øverst */}
          <Image
            source={require("../../assets/glas.png")}
            style={[
              styles.topGlasses,
              {
                width: width * 0.34,
                height: width * 0.34,
                top: height * 0.06,
                right: width * 0.10,
              },
            ]}
            resizeMode="contain"
          />

          {/* Cocktailglas til venstre */}
          <Image
            source={require("../../assets/glas-mod-højre.png")}
            style={[
              styles.leftGlass,
              {
                width: width * 0.19,
                height: width * 0.28,
                top: height * 0.27,
              },
            ]}
            resizeMode="contain"
          />

          {/* Teksten i midten */}
          <View
            style={[
              styles.textContainer,
              {
                top: height * 0.31,
                width: width * 0.83,
              },
            ]}
          >
            <Text style={styles.description}>
              Grin, konkurrér og skål jer gennem en
              aften fyldt med udfordringer, drukspil
              og uventede twists.
            </Text>

            <Text style={styles.description}>
              Spillet spilles med alles telefoner og
              kræver mindst 2 spillere. Der kan
              deltage op til 15 spillere.
            </Text>

            <Text style={styles.finalText}>
              Kun én kan blive aftenens fuldeste –
              er du klar til dysten?
            </Text>
          </View>

          {/* Cocktailglas nederst til højre */}
          <Image
            source={require("../../assets/glas-mod-venstre.png")}
            style={[
              styles.rightGlass,
              {
                width: width * 0.27,
                height: width * 0.34,
                top: height * 0.52,
                right: width * 0.02,
              },
            ]}
            resizeMode="contain"
          />

          {/* Startknap */}
          <TouchableOpacity
            style={[
              styles.button,
              {
                bottom: Math.max(55, height * 0.075),
                width: width * 0.75,
              },
            ]}
            onPress={() => navigation.navigate("CreateUser")}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>
              Kom i gang
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Mørkeblå overgang */}
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

  topCorner: {
    position: "absolute",
    transform: [{ rotate: "25deg" }],
  },

  bottomCorner: {
    position: "absolute",
    transform: [{ rotate: "-20deg" }],
  },

  splashContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  introContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
  },

  introBlob: {
    position: "absolute",
    alignSelf: "center",
  },

  topGlasses: {
    position: "absolute",
  },

  leftGlass: {
    position: "absolute",
    left: -12,
  },

  rightGlass: {
    position: "absolute",
  },

  textContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    zIndex: 2,
  },

  description: {
    fontSize: 15,
    lineHeight: 23,
    color: COLORS.navy,
    textAlign: "center",
    marginBottom: 24,
  },

  finalText: {
    fontSize: 15,
    lineHeight: 23,
    color: COLORS.navy,
    textAlign: "center",
    marginTop: 2,
  },

  button: {
    position: "absolute",
    paddingVertical: 16,
    borderRadius: 35,
    backgroundColor: COLORS.navy,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "bold",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.navy,
    zIndex: 10,
  },
});
