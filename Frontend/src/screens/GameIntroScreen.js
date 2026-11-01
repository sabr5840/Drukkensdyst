
import React, { useEffect, useRef, useState } from "react";

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  useWindowDimensions,
  Animated,
  Easing,
} from "react-native";

import { useNavigation, useRoute } from "@react-navigation/native";
import Svg, { Path } from "react-native-svg";
import { games } from "../../Shared/games";
import socket from "../../services/socket";

/**
 * =====================================================
 * COLORS
 * Samme farver som Home.js
 * =====================================================
 */

const COLORS = {
  background: "#f8f3ef",
  navy: "#0b2250",
  lightBlue: "#dbe6f1",
  muted: "#647594",
  white: "#ffffff",
};

/**
 * =====================================================
 * GAME LOGOS
 * =====================================================
 */

const GAME_LOGOS = {
  "kender du mig": require("../../assets/kender-du-mig.png"),

  "hvad vil du helst": require("../../assets/Hvad-vil-du-helst.png"),

  "hvem er mest tilbøjelig til": require(
    "../../assets/Hvem-er-mest-tilbøjelig-til.png"
  ),

  "jeg har aldrig": require("../../assets/Jeg-har-aldrig.png"),

  "the hot seat": require("../../assets/The-Hot-Seat.png"),
};

/**
 * =====================================================
 * BACKGROUND BLOBS
 * Præcis samme SVG som Home.js
 * =====================================================
 */

const Blob = ({ width, height, style, rotation = 0 }) => (
  <View
    pointerEvents="none"
    style={[
      {
        width,
        height,
        transform: [{ rotate: `${rotation}deg` }],
      },
      style,
    ]}
  >
    <Svg width="100%" height="100%" viewBox="0 0 400 400">
      <Path
        d="M 205 25 C 270 15, 295 60, 345 65 C 395 75, 370 135, 382 185 C 395 250, 365 280, 345 325 C 310 370, 265 355, 215 382 C 165 405, 125 360, 80 340 C 35 315, 45 260, 20 220 C -5 175, 35 135, 55 90 C 80 40, 145 30, 205 25 Z"
        fill={COLORS.lightBlue}
      />
    </Svg>
  </View>
);

/**
 * =====================================================
 * GAME INTRO SCREEN
 * =====================================================
 */

const GameIntroScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const { width, height } = useWindowDimensions();

  const {
    game,
    gameId,
    isHost,
    players = [],
    reader,
  } = route.params || {};

  const selectedReader = reader || null;
  const isSmallScreen = height < 750;

  /**
   * =====================================================
   * ANIMATION VALUES
   * =====================================================
   */

  const [showReveal, setShowReveal] = useState(true);

  // Logoets store introanimation
  const revealScale = useRef(
    new Animated.Value(0.1)
  ).current;

  const revealOpacity = useRef(
    new Animated.Value(0)
  ).current;

  const revealRotation = useRef(
    new Animated.Value(0)
  ).current;

  // Den almindelige regelsætskærm
  const screenOpacity = useRef(
    new Animated.Value(0)
  ).current;

  /**
   * =====================================================
   * NORMALIZE GAME NAME
   * =====================================================
   */

  const normalizeGameName = (value = "") =>
    value
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[?!]/g, "")
      .replace(/ø/g, "o")
      .replace(/æ/g, "ae")
      .replace(/å/g, "a")
      .replace(/\s+/g, " ");

  const GAME_LOGOS_NORMALIZED = {
    "kender du mig": GAME_LOGOS["kender du mig"],

    "hvad vil du helst": GAME_LOGOS["hvad vil du helst"],

    "hvem er mest tilbojelig til":
      GAME_LOGOS["hvem er mest tilbøjelig til"],

    "jeg har aldrig": GAME_LOGOS["jeg har aldrig"],

    "the hot seat": GAME_LOGOS["the hot seat"],
  };

  const gameName = normalizeGameName(game?.title || "");
  const gameLogo = GAME_LOGOS_NORMALIZED[gameName];

  /**
   * =====================================================
   * GAME REVEAL ANIMATION
   * =====================================================
   *
   * 1. Logoet popper frem midt på skærmen.
   * 2. Logoet ryster.
   * 3. Logoet bliver stående kort.
   * 4. Regelsættet og knapperne vises.
   */

  useEffect(() => {
    if (!game) return;

    let active = true;

    setShowReveal(true);

    // Nulstil alle animationer
    revealScale.setValue(0.1);
    revealOpacity.setValue(0);
    revealRotation.setValue(0);
    screenOpacity.setValue(0);

    const animation = Animated.sequence([
      // 1. Logoet popper stort frem
      Animated.parallel([
        Animated.timing(revealOpacity, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),

        Animated.spring(revealScale, {
          toValue: 1.12,
          friction: 4,
          tension: 90,
          useNativeDriver: true,
        }),
      ]),

      // 2. Et kort, tydeligt ryst
      Animated.sequence([
        Animated.timing(revealRotation, {
          toValue: -1,
          duration: 65,
          useNativeDriver: true,
        }),

        Animated.timing(revealRotation, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),

        Animated.timing(revealRotation, {
          toValue: -0.5,
          duration: 80,
          useNativeDriver: true,
        }),

        Animated.timing(revealRotation, {
          toValue: 0,
          duration: 80,
          useNativeDriver: true,
        }),
      ]),

      // 3. Logoet bliver stående et øjeblik
      Animated.delay(450),

      // 4. Logoet skalerer ned og fader ud
      Animated.parallel([
        Animated.timing(revealScale, {
          toValue: 0.75,
          duration: 350,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),

        Animated.timing(revealOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start(({ finished }) => {
      if (!finished || !active) return;

      setShowReveal(false);

      // Vis regelsæt og knapper
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });

    return () => {
      active = false;
      animation.stop();
      screenOpacity.stopAnimation();
    };
  }, [
    game?.id,
    game?.title,
    revealScale,
    revealOpacity,
    revealRotation,
    screenOpacity,
  ]);

  /**
   * =====================================================
   * GET NEXT GAME
   * =====================================================
   */

  const getNextGame = () => {
    const otherGames = games.filter(
      (item) => item.id !== game.id
    );

    if (otherGames.length === 0) {
      return game;
    }

    const randomIndex = Math.floor(
      Math.random() * otherGames.length
    );

    return otherGames[randomIndex];
  };

  /**
   * =====================================================
   * SOCKET EVENTS
   * =====================================================
   */

  useEffect(() => {
    const handleShowGameIntro = ({
      gameId,
      game,
      players = [],
      reader,
    }) => {
      const currentPlayer = players.find(
        (player) => player.id === socket.id
      );

      navigation.navigate("GameIntro", {
        game,
        gameId,
        isHost: currentPlayer?.isHost || false,
        players,
        reader,
      });
    };

    const handleShowGamePlay = (payload) => {
      const currentPlayer = (
        payload.players || []
      ).find(
        (player) => player.id === socket.id
      );

      navigation.navigate("GamePlay", {
        game: payload.game,
        gameId: payload.gameId,
        isHost: currentPlayer?.isHost || false,
        players: payload.players,
        card: payload.card,
        usedIndexes: payload.usedIndexes,
        usedPlayerIndexes: payload.usedPlayerIndexes,
        currentPlayer: payload.currentPlayer,
        reader: payload.reader,
        turnCount: payload.turnCount,
        voting: payload.voting,
      });
    };

    socket.on("showGameIntro", handleShowGameIntro);
    socket.on("showGamePlay", handleShowGamePlay);

    return () => {
      socket.off("showGameIntro", handleShowGameIntro);
      socket.off("showGamePlay", handleShowGamePlay);
    };
  }, [navigation]);

  /**
   * =====================================================
   * START ROUND
   * =====================================================
   */

  const handleStartRound = () => {
    socket.emit("showGamePlay", {
      gameId,
      game,
      reader: selectedReader,
    });
  };

  /**
   * =====================================================
   * SKIP GAME
   * =====================================================
   */

  const handleSkipGame = () => {
    socket.emit("showGameIntro", {
      gameId,
      game: getNextGame(),
    });
  };

  /**
   * =====================================================
   * EMPTY STATE
   * =====================================================
   */

  if (!game) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Kunne ikke hente spillet.
        </Text>
      </View>
    );
  }


  /**
   * =====================================================
   * SCREEN LAYOUT
   * =====================================================
   */

  return (
    <View style={styles.container}>

      {/* =====================================================
          BACKGROUND
          Præcis samme baggrund som Home.js
      ===================================================== */}

      <View
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      >
        <Blob
          width={width * 0.53}
          height={height * 0.32}
          rotation={20}
          style={{
            position: "absolute",
            top: height * 0.045,
            right: -width * 0.3,
          }}
        />

        <Blob
          width={width * 0.9}
          height={width * 0.95}
          rotation={-10}
          style={{
            position: "absolute",
            top: height * 0.35,
            left: -width * 0.14,
          }}
        />

        <Blob
          width={width * 0.5}
          height={height * 0.28}
          rotation={-18}
          style={{
            position: "absolute",
            bottom: -height * 0.1,
            left: -width * 0.26,
          }}
        />
      </View>

      {/* =====================================================
          GAME INTRO CONTENT
          Skjult indtil animationen er færdig
      ===================================================== */}

      <Animated.ScrollView
        pointerEvents={showReveal ? "none" : "auto"}
        style={[
          styles.scrollView,
          {
            opacity: screenOpacity,
          },
        ]}
        contentContainerStyle={[
          styles.scrollContent,
          { minHeight: height },
          isSmallScreen && styles.scrollContentSmall,
        ]}
        showsVerticalScrollIndicator={false}
      >

        {/* SPILLOGO */}

        <View style={styles.header}>
          {gameLogo ? (
            <Image
              source={gameLogo}
              style={[
                styles.gameLogo,
                {
                  width: width * 0.9,
                },
              ]}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.fallbackTitle}>
              {game.title}
            </Text>
          )}
        </View>

        {/* REGELSÆT OVERSKRIFT */}

        <Text style={styles.rulesHeading}>
          Regelsæt
        </Text>

        {/* REGELBOKS */}

        <View
          style={[
            styles.rulesBox,
            {
              maxHeight: isSmallScreen
                ? height * 0.38
                : height * 0.42,
            },
          ]}
        >
          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.rulesContent}
          >
            <Text style={styles.description}>
              {game.description}
            </Text>

            <Text style={styles.sectionTitle}>
              Sådan spiller I
            </Text>

            {(game.rules || []).map((rule, index) => (
              <View
                key={index}
                style={styles.ruleRow}
              >
                <Text style={styles.ruleBullet}>
                  •
                </Text>

                <Text style={styles.ruleText}>
                  {rule.replace(
                    "{reader}",
                    selectedReader?.name || "Spilleren"
                  )}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* =====================================================
            BUTTONS
        ===================================================== */}

        <View style={styles.bottomArea}>
          {isHost ? (
            <>
              <TouchableOpacity
                style={styles.button}
                onPress={handleStartRound}
                activeOpacity={0.85}
              >
                <Text style={styles.buttonText}>
                  Vi er klar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkipGame}
                activeOpacity={0.85}
              >
                <Text style={styles.skipButtonText}>
                  Skip spil
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.waitingText}>
              Venter på, at hosten starter spillet...
            </Text>
          )}
        </View>
      </Animated.ScrollView>

      {/* =====================================================
          GAME REVEAL ANIMATION

          Ingen ekstra baggrund.
          Bruger samme baggrund som Home.js.

          Logoet vises alene lidt over midten.
      ===================================================== */}

      {showReveal && (
        <View
          pointerEvents="none"
          style={styles.revealOverlay}
        >
          <Animated.View
            style={[
              styles.revealLogoContainer,
              {
                width: width * 0.85,

                opacity: revealOpacity,

                transform: [
                  {
                    scale: revealScale,
                  },
                  {
                    rotate: revealRotation.interpolate({
                      inputRange: [-1, 0, 1],
                      outputRange: [
                        "-7deg",
                        "0deg",
                        "7deg",
                      ],
                    }),
                  },
                ],
              },
            ]}
          >
            {gameLogo ? (
              <Image
                source={gameLogo}
                style={[
                  styles.revealLogo,
                  {
                    width: width * 0.85,
                  },
                ]}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.revealFallbackTitle}>
                {game.title}
              </Text>
            )}
          </Animated.View>
        </View>
      )}
    </View>
  );
};

/**
 * =====================================================
 * STYLES
 * =====================================================
 */

const styles = StyleSheet.create({

  /**
   * =====================================================
   * GENERAL
   * =====================================================
   */

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: 75,
    paddingBottom: 40,
  },

  scrollContentSmall: {
    paddingTop: 45,
    paddingBottom: 25,
  },

  /**
   * =====================================================
   * GAME LOGO
   * =====================================================
   */

  header: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 0,
    marginBottom: 12,
  },

  gameLogo: {
    height: 125,
  },

  fallbackTitle: {
    color: COLORS.navy,
    fontSize: 35,
    fontWeight: "900",
    textAlign: "center",
    marginVertical: 30,
  },

  /**
   * =====================================================
   * RULES
   * =====================================================
   */

  rulesHeading: {
    fontSize: 27,
    color: COLORS.navy,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 5,
    marginBottom: 20,
  },

  rulesBox: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 28,

    shadowColor: COLORS.navy,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.035,
    shadowRadius: 12,
    elevation: 2,
  },

  rulesContent: {
    paddingBottom: 8,
  },

  description: {
    fontSize: 17,
    color: COLORS.navy,
    lineHeight: 27,
    marginBottom: 25,
    fontWeight: "500",
  },

  sectionTitle: {
    fontSize: 19,
    color: COLORS.navy,
    fontWeight: "800",
    marginBottom: 18,
  },

  ruleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 17,
  },

  ruleBullet: {
    fontSize: 21,
    color: COLORS.navy,
    fontWeight: "800",
    marginRight: 13,
    lineHeight: 27,
  },

  ruleText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.muted,
    lineHeight: 26,
    fontWeight: "500",
  },

  /**
   * =====================================================
   * BUTTONS
   * =====================================================
   */

  bottomArea: {
    width: "100%",
    alignItems: "center",
    marginTop: "auto",
    paddingTop: 30,
    paddingBottom: 10,
  },

  button: {
    width: "100%",
    maxWidth: 320,
    height: 64,
    borderRadius: 35,
    backgroundColor: COLORS.navy,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,

    shadowColor: COLORS.navy,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 7,
    elevation: 3,
  },

  buttonText: {
    color: COLORS.white,
    fontSize: 23,
    fontWeight: "800",
    textAlign: "center",
  },

  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    alignItems: "center",
  },

  skipButtonText: {
    color: COLORS.navy,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },

  waitingText: {
    color: COLORS.muted,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  /**
   * =====================================================
   * GAME REVEAL ANIMATION
   * =====================================================
   */

  revealOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    elevation: 10,
  },

  revealLogoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: -650,
  },

  revealLogo: {
    height: 170,
    transform: [{ translateY: -90 }],
  },

  revealFallbackTitle: {
    color: COLORS.navy,
    fontSize: 42,
    fontWeight: "900",
    textAlign: "center",
  },

  /**
   * =====================================================
   * EMPTY STATE
   * =====================================================
   */

  emptyContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    color: COLORS.navy,
    fontSize: 18,
    fontWeight: "600",
  },
});

export default GameIntroScreen;

