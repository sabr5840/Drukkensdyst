
import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  useWindowDimensions,
} from "react-native";

import {
  useNavigation,
  useRoute,
} from "@react-navigation/native";

import Svg, { Path } from "react-native-svg";

import { games } from "../../Shared/games";
import socket from "../../services/socket";
import MostLikelyVoting from "./MostLikelyVoting";


const API_URL = "http://10.0.0.28:3000";

const getProfileImageUri = (image) => {
  if (!image || typeof image !== "string") return null;

  if (
    image.startsWith("file:") ||
    image.startsWith("content:") ||
    image.startsWith("data:")
  ) {
    return image;
  }

  const filename = image.split("?")[0].split("/").pop();

  return `${API_URL}/uploads/${filename}`;
};


/**
 * =====================================================
 * COLORS
 * =====================================================
 */

const COLORS = {
  background: "#f8f3ef",
  navy: "#0b2250",
  blue: "#14558A",
  lightBlue: "#dbe6f1",
  muted: "#647594",
  white: "#ffffff",
  pink: "#F8DAD7",
};

/**
 * =====================================================
 * GAME LOGOS
 * =====================================================
 */

const GAME_LOGOS = {
  "jeg har aldrig": require(
    "../../assets/Jeg-har-aldrig.png"
  ),

  "kender du mig": require(
    "../../assets/kender-du-mig.png"
  ),

  "hvad vil du helst": require(
    "../../assets/Hvad-vil-du-helst.png"
  ),

  "hvem er mest tilbojelig til": require(
    "../../assets/Hvem-er-mest-tilbøjelig-til.png"
  ),

  "the hot seat": require(
    "../../assets/The-Hot-Seat.png"
  ),
};

/**
 * =====================================================
 * NORMALIZE GAME NAME
 * =====================================================
 */

const normalizeGameName = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ø/g, "o")
    .replace(/æ/g, "ae")
    .replace(/å/g, "a")
    .replace(/[?!]/g, "")
    .replace(/\s+/g, " ");

/**
 * =====================================================
 * BACKGROUND BLOBS
 * =====================================================
 */

const Blob = ({
  width,
  height,
  style,
  rotation = 0,
}) => (
  <View
    pointerEvents="none"
    style={[
      {
        width,
        height,
        transform: [
          { rotate: `${rotation}deg` },
        ],
      },
      style,
    ]}
  >
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 400 400"
    >
      <Path
        d="
          M 205 25
          C 270 15, 295 60, 345 65
          C 395 75, 370 135, 382 185
          C 395 250, 365 280, 345 325
          C 310 370, 265 355, 215 382
          C 165 405, 125 360, 80 340
          C 35 315, 45 260, 20 220
          C -5 175, 35 135, 55 90
          C 80 40, 145 30, 205 25
          Z
        "
        fill={COLORS.lightBlue}
      />
    </Svg>
  </View>
);

/**
 * =====================================================
 * PLAYER PHOTO
 * =====================================================
 */


const getPlayerImage = (player) => {
  const photo =
    player?.profileImage ||
    player?.profilePicture ||
    player?.avatar ||
    player?.photo ||
    player?.image;

  if (!photo) return null;

  if (typeof photo === "object") {
    return photo;
  }

  const imageUri = getProfileImageUri(photo);

  return imageUri ? { uri: imageUri } : null;
};


/**
 * =====================================================
 * PLAYER AVATAR
 * =====================================================
 */

const PlayerAvatar = ({
  player,
  size = 86,
}) => {
  const imageSource = getPlayerImage(player);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
        backgroundColor: COLORS.lightBlue,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {imageSource ? (
        <Image
          source={imageSource}
          style={{
            width: size,
            height: size,
          }}
          resizeMode="cover"
        />
      ) : (
        <Text
          style={{
            fontSize: size * 0.34,
            fontWeight: "800",
            color: COLORS.navy,
          }}
        >
          {(player?.name || "?")
            .charAt(0)
            .toUpperCase()}
        </Text>
      )}
    </View>
  );
};

/**
 * =====================================================
 * AUTOMATIC CARD FONT SIZE
 * =====================================================
 */

const getInitialFontSize = (
  text = "",
  cardWidth = 350
) => {
  const length = String(text).length;

  const scale = Math.min(
    cardWidth / 350,
    1
  );

  let size = 33;

  if (length > 130) {
    size = 17;
  } else if (length > 105) {
    size = 19;
  } else if (length > 85) {
    size = 21;
  } else if (length > 65) {
    size = 24;
  } else if (length > 45) {
    size = 27;
  } else if (length > 30) {
    size = 30;
  }

  return Math.round(size * scale);
};

/**
 * =====================================================
 * RESPONSIVE CARD TEXT
 * =====================================================
 */

const ResponsiveCardText = ({
  text,
  cardWidth,
  cardHeight,
}) => {
  const initialFontSize = getInitialFontSize(
    text,
    cardWidth
  );

  const [fontSize, setFontSize] = useState(
    initialFontSize
  );

  const availableHeight = cardHeight * 0.43;

  useEffect(() => {
    setFontSize(initialFontSize);
  }, [text, initialFontSize]);

  const handleTextLayout = (event) => {
    const lines =
      event.nativeEvent.lines || [];

    if (!lines.length) return;

    const measuredHeight = lines.reduce(
      (total, line) =>
        total + (line.height || 0),
      0
    );

    if (
      measuredHeight > availableHeight &&
      fontSize > 13
    ) {
      setFontSize((previous) =>
        Math.max(previous - 1, 13)
      );
    }
  };

  return (
    <View
      style={{
        position: "absolute",
        left: cardWidth * 0.17 + 18,
        right: cardWidth * 0.17,
        top: cardHeight * 0.18 + 18,
        height: availableHeight,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <Text
        onTextLayout={handleTextLayout}
        adjustsFontSizeToFit
        minimumFontScale={0.35}
        numberOfLines={12}
        style={{
          color: COLORS.white,
          fontSize,
          fontWeight: "800",
          lineHeight: Math.round(
            fontSize * 1.25
          ),
          textAlign: "center",
          includeFontPadding: false,
        }}
      >
        {text}
      </Text>
    </View>
  );
};

/**
 * =====================================================
 * JEG HAR ALDRIG – CARD
 * =====================================================
 */

const NeverHaveIEverCard = ({
  text,
  width,
}) => {
  const cardWidth = Math.min(
    width * 0.82,
    370
  );

  const cardHeight = cardWidth * 1.12;

  return (
    <View
      style={{
        width: cardWidth,
        height: cardHeight,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 400 450"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Path
          d="
            M 145 25
            C 200 -5, 265 30, 310 28
            C 365 20, 390 65, 385 120
            C 378 170, 405 210, 385 255
            C 405 305, 365 345, 325 365
            C 280 390, 245 440, 190 425
            C 140 408, 105 440, 65 400
            C 20 365, 30 320, 12 280
            C -5 240, 25 205, 48 165
            C 72 125, 78 65, 145 25
            Z
          "
          fill={COLORS.lightBlue}
        />
      </Svg>

      <ResponsiveCardText
        text={text}
        cardWidth={cardWidth}
        cardHeight={cardHeight}
      />

      <Image
        source={require(
          "../../assets/glas-mod-højre.png"
        )}
        resizeMode="contain"
        style={{
          position: "absolute",
          width: cardWidth * 0.25,
          height: cardWidth * 0.35,
          right: cardWidth * 0.24,
          top: cardHeight * 0.73,
          zIndex: 3,
        }}
      />

      <Image
        source={require(
          "../../assets/glas-mod-venstre.png"
        )}
        resizeMode="contain"
        style={{
          position: "absolute",
          width: cardWidth * 0.29,
          height: cardWidth * 0.39,
          right: -cardWidth * 0.025,
          top: cardHeight * 0.67,
          zIndex: 3,
        }}
      />

      <Image
        source={require(
          "../../assets/effekt.png"
        )}
        resizeMode="contain"
        style={{
          position: "absolute",
          width: cardWidth * 0.15,
          height: cardWidth * 0.25,
          right: cardWidth * 0.21,
          top: cardHeight * 0.57,
          transform: [
            { rotate: "-25deg" },
          ],
          zIndex: 4,
        }}
      />
    </View>
  );
};

/**
 * =====================================================
 * GAME PLAY SCREEN
 * =====================================================
 */

const GamePlayScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const { width, height } =
    useWindowDimensions();

  const isSmallScreen = height < 750;

  const lastTitlePressRef = useRef(0);
  const advancingRef = useRef(false);

  /**
   * ===================================================
   * ROUTE PARAMETERS
   * ===================================================
   */

  const {
    game,
    gameId,
    isHost,
    players = [],
    card: routeCard,
    usedIndexes: routeUsedIndexes,
    usedPlayerIndexes: routeUsedPlayerIndexes,
    currentPlayer: routeCurrentPlayer,
    turnCount: routeTurnCount,
  } = route.params || {};

  /**
   * ===================================================
   * GAME TYPE
   * ===================================================
   */

  const gameName = normalizeGameName(
    game?.title || ""
  );

  const gameLogo = GAME_LOGOS[gameName];

  const isNeverHaveIEver =
    gameName === "jeg har aldrig";

  const isMostLikely =
    game?.id === "most_likely_to";

  const isKnowMe =
    gameName === "kender du mig";

  /**
   * ===================================================
   * EXIT BY DOUBLE TAP
   * ===================================================
   */

  const handleTitlePress = () => {
    const now = Date.now();

    if (
      now - lastTitlePressRef.current <
      350
    ) {
      socket.emit("leaveGame", {
        gameId,
      });

      navigation.reset({
        index: 0,
        routes: [
          { name: "Home" },
        ],
      });
    }

    lastTitlePressRef.current = now;
  };

  /**
   * ===================================================
   * NEXT GAME
   * ===================================================
   */

  const getNextGame = () => {
    if (!game) return null;

    const otherGames = games.filter(
      (item) => item.id !== game.id
    );

    if (otherGames.length === 0) {
      return game;
    }

    return otherGames[
      Math.floor(
        Math.random() *
        otherGames.length
      )
    ];
  };

  /**
   * ===================================================
   * ROUND LIMIT
   * ===================================================
   */

  const getRoundLimit = (playerCount) => {
    if (playerCount === 2) return 4;
    if (playerCount === 3) return 5;
    if (playerCount === 4) return 3;
    if (playerCount === 5) return 4;
    if (playerCount === 6) return 4;
    if (playerCount === 7) return 5;
    if (playerCount === 8) return 6;
    if (playerCount === 9) return 6;
    if (playerCount === 10) return 7;
    if (playerCount === 11) return 8;
    if (playerCount === 12) return 8;
    if (playerCount === 13) return 9;
    if (playerCount === 14) return 9;

    return 10;
  };

  const roundLimit = game
    ? game.cardsPerRound === "players"
      ? getRoundLimit(players.length)
      : game.cardsPerRound === "halfPlayers"
      ? players.length < 3
        ? players.length
        : Math.ceil(players.length / 2)
      : game.cardsPerRound
    : null;

  /**
   * ===================================================
   * GAME STATE
   * ===================================================
   */

  const [
    usedIndexes,
    setUsedIndexes,
  ] = useState(
    routeUsedIndexes || []
  );

  const [
    usedPlayerIndexes,
    setUsedPlayerIndexes,
  ] = useState(
    routeUsedPlayerIndexes || []
  );

  const [
    turnCount,
    setTurnCount,
  ] = useState(
    routeTurnCount || 0
  );

  const [
    card,
    setCard,
  ] = useState(
    routeCard || null
  );

  const [
    currentPlayer,
    setCurrentPlayer,
  ] = useState(
    routeCurrentPlayer || null
  );

  /**
   * ===================================================
   * VOTING STATE
   * ===================================================
   */

  const [
    voting,
    setVoting,
  ] = useState(
    route.params?.voting || null
  );

  const [
    selectedVote,
    setSelectedVote,
  ] = useState(null);

  const [
    voteProgress,
    setVoteProgress,
  ] = useState(null);

  const [
    voteResults,
    setVoteResults,
  ] = useState(null);

  /**
   * ===================================================
   * KENDER DU MIG – STATE
   * ===================================================
   *
   * Et valgt svar er ikke det samme
   * som en afgivet stemme.
   */

  const [
    knowMeSubmitted,
    setKnowMeSubmitted,
  ] = useState(false);

  const knowMeOptions =
    Array.isArray(voting?.options)
      ? voting.options
      : [];

  const knowMeHasVoted =
    knowMeSubmitted;

  const knowMeHasResults =
    voteResults !== null;

  /**
   * ===================================================
   * HOT SEAT STATE
   * ===================================================
   */

  const [
    selectedHotSeatCategory,
    setSelectedHotSeatCategory,
  ] = useState(null);

  /**
   * ===================================================
   * ROUND STATUS
   * ===================================================
   */

  const reachedLimit =
    roundLimit !== null &&
    roundLimit !== undefined &&
    turnCount >= roundLimit;

  const cardText = card
    ? typeof card === "string"
      ? card
      : card.text || null
    : "Der er ikke flere kort i dette spil.";

  /**
   * ===================================================
   * ACTIVE ROUND REFERENCE
   * ===================================================
   */

  const activeRoundIdRef = useRef(
    voting?.roundId ?? null
  );

  activeRoundIdRef.current =
    voting?.roundId ?? null;

  /**
   * ===================================================
   * SOCKET EVENTS
   * ===================================================
   */

  useEffect(() => {
    /**
     * SHOW GAME PLAY
     */

    const handleShowGamePlay = (payload) => {
      if (
        payload.gameId &&
        payload.gameId !== gameId
      ) {
        return;
      }

      advancingRef.current = false;

      activeRoundIdRef.current =
        payload.voting?.roundId ?? null;

      setCard(payload.card);

      setUsedIndexes(
        payload.usedIndexes || []
      );

      setUsedPlayerIndexes(
        payload.usedPlayerIndexes || []
      );

      setCurrentPlayer(
        payload.currentPlayer || null
      );

      setTurnCount(
        payload.turnCount || 0
      );

      setSelectedHotSeatCategory(null);

      setVoting(
        payload.voting || null
      );

      setSelectedVote(null);

      // Kender du mig:
      // Ny runde = ny afstemning
      setKnowMeSubmitted(false);

      setVoteProgress(null);
      setVoteResults(null);
    };

    /**
     * VOTE PROGRESS
     */

    const handleVoteProgress = (payload) => {
      if (
        payload.gameId &&
        payload.gameId !== gameId
      ) {
        return;
      }

      if (
        payload.roundId !==
        activeRoundIdRef.current
      ) {
        return;
      }

      setVoteProgress({
        votedCount: payload.votedCount,
        totalCount: payload.totalCount,
      });
    };

    /**
     * VOTE RESULTS
     */

    const handleVoteResults = (payload) => {
      if (
        payload.gameId &&
        payload.gameId !== gameId
      ) {
        return;
      }

      if (
        payload.roundId !==
        activeRoundIdRef.current
      ) {
        return;
      }

      setVoteResults(payload);
    };

    /**
     * NEXT GAME INTRO
     */

    const handleShowGameIntro = ({
      gameId: incomingGameId,
      game: nextGame,
      players: nextPlayers,
      reader,
    }) => {
      if (
        incomingGameId &&
        incomingGameId !== gameId
      ) {
        return;
      }

      advancingRef.current = false;

      navigation.navigate(
        "GameIntro",
        {
          game: nextGame,
          gameId,
          isHost,
          players: nextPlayers || players,
          reader,
        }
      );
    };

    /**
     * GAME ENDED
     */

    const handleGameEnded = ({
      gameId: endedGameId,
    }) => {
      if (endedGameId !== gameId) {
        return;
      }

      navigation.reset({
        index: 0,
        routes: [
          { name: "Home" },
        ],
      });
    };

    socket.on(
      "showGamePlay",
      handleShowGamePlay
    );

    socket.on(
      "voteProgress",
      handleVoteProgress
    );

    socket.on(
      "voteResults",
      handleVoteResults
    );

    socket.on(
      "showGameIntro",
      handleShowGameIntro
    );

    socket.on(
      "gameEnded",
      handleGameEnded
    );

    return () => {
      socket.off(
        "showGamePlay",
        handleShowGamePlay
      );

      socket.off(
        "voteProgress",
        handleVoteProgress
      );

      socket.off(
        "voteResults",
        handleVoteResults
      );

      socket.off(
        "showGameIntro",
        handleShowGameIntro
      );

      socket.off(
        "gameEnded",
        handleGameEnded
      );
    };
  }, [
    navigation,
    isHost,
    gameId,
    players,
  ]);

  /**
   * ===================================================
   * SUBMIT VOTE
   * ===================================================
   *
   * Bruges af de øvrige spil.
   */

  const handleVote = (optionId) => {
    if (!voting) {
      console.log(
        "Ingen aktiv afstemningsrunde"
      );
      return;
    }

    if (
      selectedVote !== null ||
      voteResults !== null
    ) {
      return;
    }

    setSelectedVote(optionId);

    socket.emit("submitVote", {
      gameId,
      roundId: voting.roundId,
      optionId,
    });
  };

  /**
   * ===================================================
   * KENDER DU MIG – SUBMIT VOTE
   * ===================================================
   *
   * Sender først stemmen, når spilleren
   * trykker på AFGIV STEMME.
   */

  const handleKnowMeSubmitVote = () => {
    if (
      selectedVote === null ||
      knowMeSubmitted ||
      !voting?.roundId ||
      voteResults !== null
    ) {
      return;
    }

    setKnowMeSubmitted(true);

    socket.emit("submitVote", {
      gameId,
      roundId: voting.roundId,
      optionId: selectedVote,
    });
  };

  /**
   * ===================================================
   * REVEAL VOTES
   * ===================================================
   */

  const handleRevealVotes = () => {
    if (
      !isHost ||
      !voting ||
      voteResults
    ) {
      return;
    }

    socket.emit(
      "revealVotes",
      {
        gameId,
        roundId: voting.roundId,
      }
    );
  };

  /**
   * ===================================================
   * NEXT CARD
   * ===================================================
   */

  const handleNext = () => {
    if (!isHost) return;

    if (voting && !voteResults) {
      return;
    }

    if (reachedLimit) return;

    if (advancingRef.current) return;

    advancingRef.current = true;

    socket.emit(
      "showGamePlay",
      {
        gameId,
        game,
        usedIndexes,
        usedPlayerIndexes,
        turnCount,
      }
    );
  };

  /**
   * ===================================================
   * NEXT GAME
   * ===================================================
   */

  const handleNextGame = () => {
    if (!isHost) return;

    if (voting && !voteResults) {
      return;
    }

    if (advancingRef.current) return;

    advancingRef.current = true;

    socket.emit(
      "showGameIntro",
      {
        gameId,
        game: getNextGame(),
      }
    );
  };

  /**
   * ===================================================
   * END ENTIRE GAME
   * ===================================================
   */

  const handleEndGame = () => {
    if (!isHost) return;

    socket.emit(
      "endGame",
      {
        gameId,
      }
    );
  };

  /**
   * ===================================================
   * DEL 2 FORTSÆTTER HER
   * ===================================================
   *
   * Indsæt del 2 direkte herunder.
   *
   * Den indeholder:
   *
   * - Kender du mig? – afstemningsskærm
   * - Valgt svar med lyseblå markering
   * - AFGIV STEMME-knap
   * - Venteskærm
   * - Rigtigt/forkert-resultat
   * - De øvrige spilvisninger
   * - Host-knapper
   * - StyleSheet
   * - export default GamePlayScreen
   */

  /**
   * ===================================================
   * KENDER DU MIG – DATA
   * ===================================================
   */


  const knowMePlayer =
    players.find(
      (player) =>
        String(player.id) ===
        String(
          voting?.selectedPlayerId ||
          currentPlayer?.id
        )
    ) ||
    currentPlayer ||
    null;


  const knowMeStatements = knowMeOptions
    .slice(0, 2)
    .map((option, index) => ({
      id:
        typeof option === "object"
          ? option?.id ?? option?.optionId ?? index
          : index,

      text:
        typeof option === "string"
          ? option
          : option?.text ||
            option?.label ||
            option?.statement ||
            "",
    }));

  const knowMeVotedCount =
    voteProgress?.votedCount ??
    voting?.votedCount ??
    (knowMeSubmitted ? 1 : 0);

  const knowMeTotalCount =
    voteProgress?.totalCount ??
    voting?.totalCount ??
    players.length;

  const knowMeCorrect =
    voteResults?.isCorrect ??
    voteResults?.correct ??
    voteResults?.playerResult?.isCorrect ??
    null;

  /**
   * ===================================================
   * KENDER DU MIG – RESULTAT
   * ===================================================
   */


  const renderKnowMeResult = () => {
    const isCorrect = knowMeCorrect === true;
    const isIncorrect = knowMeCorrect === false;
    const isSelectedPlayer =
      voteResults?.isSelectedPlayer === true;

    const isPink = isIncorrect;
    const shapeColor = isPink ? "#F8DAD7" : "#DBEAF6";

    return (
      <View style={styles.knowMeResultScreen}>
        <View style={styles.knowMeResultArtwork}>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 400 420"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Path
          d="
            M 57 27

            C 76 28, 78 27, 89 22
            C 103 22, 108 4, 139 5
            C 176 0, 185 14, 214 13
            C 244 12, 273 7, 284 25

            C 294 41, 289 53, 305 73
            C 316 89, 308 106, 321 126
            C 337 151, 367 162, 380 187

            C 392 210, 367 226, 372 247
            C 377 268, 395 280, 383 296
            C 369 313, 353 297, 346 320

            C 340 341, 332 372, 315 386
            C 304 395, 291 383, 277 389
            C 253 400, 228 410, 204 404
            C 184 400, 177 381, 157 380

            C 133 376, 117 389, 91 386
            C 65 387, 40 389, 34 369

            C 28 349, 40 332, 49 320
            C 60 305, 39 291, 31 275
            C 18 253, 28 237, 42 225

            C 55 214, 58 201, 50 183
            C 44 168, 27 156, 29 137
            C 31 121, 19 109, 21 92

            C 24 77, 16 65, 20 48
            C 23 30, 35 25, 57 27

            Z
          "
          fill={shapeColor}
        />
      </Svg>

          <Image
            source={
              isPink
                ? require("../../assets/forkert-svar.png")
                : require("../../assets/glas.png")
            }
            style={styles.knowMeResultImage}
            resizeMode="contain"
          />

          <Text style={styles.knowMeResultTitle}>
            {isCorrect
              ? "Du gættede rigtigt!"
              : isIncorrect
              ? "Forkert gæt!"
              : isSelectedPlayer
              ? "Alle har stemt!"
              : "Afstemningen er afsluttet"}
          </Text>

          {isIncorrect && (
            <Text style={styles.knowMeResultSubtitle}>
              Du skal drikke!
            </Text>
          )}

          {isSelectedPlayer && (
            <Text style={styles.knowMeResultDescription}>
              De andre har gættet på dit svar.
            </Text>
          )}
        </View>

        {isHost ? (
          <TouchableOpacity
            style={styles.knowMeResultNextButton}
            onPress={
              reachedLimit
                ? handleNextGame
                : handleNext
            }
            activeOpacity={0.85}
          >
            <Text style={styles.knowMeResultNextText}>
              {reachedLimit ? "Næste spil" : "Næste runde"}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.knowMeHostWaiting}>
            Venter på, at hosten går videre...
          </Text>
        )}
      </View>
    );
  };


  /**
   * ===================================================
   * KENDER DU MIG – VENTESKÆRM
   * ===================================================
   */

  const renderKnowMeWaiting = () => {
    const total = Math.max(
      0,
      Number(knowMeTotalCount) || 0
    );

    const voted = Math.min(
      total,
      Math.max(
        0,
        Number(knowMeVotedCount) || 0
      )
    );

    return (
      <View style={styles.knowMeWaitingScreen}>
        <View style={styles.knowMeWaitingIcons}>
          {Array.from({
            length: total,
          }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.knowMeWaitingPerson,
                index < voted
                  ? styles.knowMePersonActive
                  : styles.knowMePersonInactive,
              ]}
            >
              <View
                style={styles.knowMePersonHead}
              />

              <View
                style={styles.knowMePersonBody}
              />
            </View>
          ))}
        </View>

        <Text style={styles.knowMeWaitingCount}>
          {voted} ud af {total} har stemt
        </Text>

        <Text style={styles.knowMeWaitingSubtitle}>
          Venter på de andre spillere...
        </Text>
      </View>
    );
  };

  /**
   * ===================================================
   * KENDER DU MIG – AFSTEMNING
   * ===================================================
   */

  const renderKnowMeVoting = () => {
    const hasOptions =
      knowMeStatements.length === 2;

    return (
      <ScrollView
        style={styles.knowMeScroll}
        contentContainerStyle={
          styles.knowMeVotingContent
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.knowMePlayer}>
          <PlayerAvatar
            player={knowMePlayer}
            size={90}
          />

          <Text style={styles.knowMePlayerName}>
            {knowMePlayer?.name || "Spiller"}
          </Text>
        </View>

        <Text style={styles.knowMeQuestion}>
          Hvad tror du,{" "}
          {knowMePlayer?.name || "spilleren"}{" "}
          stemmer?
        </Text>

        {!hasOptions ? (
          <View style={styles.knowMeOption}>
            <Text style={styles.knowMeOptionText}>
              Venter på svarmuligheder...
            </Text>
          </View>
        ) : (
          knowMeStatements.map(
            (option, index) => {
              const isSelected =
                selectedVote !== null &&
                String(selectedVote) ===
                  String(option.id);

              return (
                <React.Fragment
                  key={String(option.id)}
                >
                  {index === 1 && (
                    <Text style={styles.knowMeOr}>
                      eller
                    </Text>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.knowMeOption,
                      isSelected &&
                        styles.knowMeOptionSelected,
                    ]}
                    activeOpacity={0.85}
                    disabled={knowMeSubmitted}
                    onPress={() => {
                      setSelectedVote(option.id);
                    }}
                  >
                    <Text
                      style={[
                        styles.knowMeOptionText,
                        isSelected &&
                          styles.knowMeOptionTextSelected,
                      ]}
                    >
                      {option.text}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              );
            }
          )
        )}

        <TouchableOpacity
          style={[
            styles.knowMePrimaryButton,
            (!hasOptions ||
              selectedVote === null ||
              knowMeSubmitted ||
              !voting?.roundId) &&
              styles.knowMeButtonDisabled,
          ]}
          disabled={
            !hasOptions ||
            selectedVote === null ||
            knowMeSubmitted ||
            !voting?.roundId
          }
          onPress={handleKnowMeSubmitVote}
          activeOpacity={0.85}
        >
          <Text
            style={styles.knowMePrimaryButtonText}
          >
            AFGIV STEMME
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  /**
   * ===================================================
   * KENDER DU MIG – SCREEN CONTROLLER
   * ===================================================
   */

  const renderKnowMe = () => {
    if (knowMeHasResults) {
      return renderKnowMeResult();
    }

    if (knowMeHasVoted) {
      return renderKnowMeWaiting();
    }

    return renderKnowMeVoting();
  };

  /**
   * ===================================================
   * MAIN RENDER
   * ===================================================
   */

  return (
    <View style={styles.container}>
      <Blob
        width={220}
        height={260}
        rotation={15}
        style={styles.backgroundBlobRight}
      />

      <Blob
        width={220}
        height={250}
        rotation={-25}
        style={styles.backgroundBlobBottom}
      />


      <TouchableOpacity
        onPress={handleTitlePress}
        activeOpacity={1}
        style={[
          styles.logoContainer,
          isKnowMe && styles.knowMeLogoContainer,
        ]}
      >

        {gameLogo ? (
          <Image
            source={gameLogo}
            style={styles.gameLogo}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.gameTitle}>
            {game?.title || "Drukkensdyst"}
          </Text>
        )}
      </TouchableOpacity>

      {isMostLikely ? (
        <View style={styles.gameArea}>
          <MostLikelyVoting
            card={card}
            players={players}
            voting={voting}
            selectedVote={selectedVote}
            voteProgress={voteProgress}
            voteResults={voteResults}
            onVote={handleVote}
          />

          {isHost && voteResults && (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={
                reachedLimit
                  ? handleNextGame
                  : handleNext
              }
            >
              <Text style={styles.nextButtonText}>
                {reachedLimit
                  ? "Næste spil"
                  : "Næste runde"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : isKnowMe ? (
        renderKnowMe()
      ) : isNeverHaveIEver ? (
        <View style={styles.genericContent}>
          <NeverHaveIEverCard
            text={cardText}
            width={width}
          />
        </View>
      ) : (
        <ScrollView
          style={styles.genericScroll}
          contentContainerStyle={
            styles.genericContent
          }
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.genericCardText}>
            {cardText}
          </Text>
        </ScrollView>
      )}

      {!isKnowMe &&
        !isMostLikely &&
        isHost && (
          <View style={styles.bottomControls}>
            <TouchableOpacity
              style={styles.nextButton}
              onPress={
                reachedLimit
                  ? handleNextGame
                  : handleNext
              }
            >
              <Text style={styles.nextButtonText}>
                {reachedLimit
                  ? "Næste spil"
                  : "Næste spørgsmål"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.roundCounter}>
              {turnCount} / {roundLimit || 0}
            </Text>
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    overflow: "hidden",
  },

  gameArea: {
    flex: 1,
  },

  backgroundBlobRight: {
    position: "absolute",
    top: 160,
    right: -120,
    opacity: 0.95,
  },

  backgroundBlobBottom: {
    position: "absolute",
    bottom: -120,
    left: -100,
    opacity: 0.95,
  },

  logoContainer: {
    height: 175,
    paddingTop: 25,
    paddingHorizontal: 25,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },


  knowMeLogoContainer: {
    transform: [{ translateY: 25 }],
    marginBottom: -10,
  },


  gameLogo: {
    width: "100%",
    height: 115,
  },

  gameTitle: {
    fontSize: 29,
    fontWeight: "900",
    color: COLORS.navy,
    textAlign: "center",
  },

  /**
   * ===================================================
   * KENDER DU MIG – VOTING
   * ===================================================
   */

  knowMeScroll: {
    flex: 1,
  },

  knowMeVotingContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 10,
    paddingBottom: 45,
    alignItems: "center",
  },

  knowMePlayer: {
    alignItems: "center",
    marginBottom: 25,
  },

  knowMePlayerName: {
    color: COLORS.navy,
    fontSize: 21,
    fontWeight: "800",
    marginTop: 10,
    textAlign: "center",
  },

  knowMeQuestion: {
    color: COLORS.navy,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },

  knowMeOption: {
    width: "100%",
    minHeight: 115,
    backgroundColor: COLORS.white,
    borderRadius: 25,
    paddingHorizontal: 23,
    paddingVertical: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },

  knowMeOptionSelected: {
    backgroundColor: "#E4F0FB",
    borderColor: COLORS.blue,
  },

  knowMeOptionText: {
    color: COLORS.navy,
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 27,
    textAlign: "center",
  },

  knowMeOptionTextSelected: {
    color: COLORS.blue,
  },

  knowMeOr: {
    color: COLORS.navy,
    fontSize: 23,
    fontWeight: "800",
    textAlign: "center",
    marginVertical: 12,
  },

  knowMePrimaryButton: {
    width: "90%",
    minHeight: 62,
    backgroundColor: COLORS.navy,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 35,
    paddingHorizontal: 20,
  },

  knowMePrimaryButtonText: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: "800",
    textAlign: "center",
  },

  knowMeButtonDisabled: {
    opacity: 0.45,
  },

  /**
   * ===================================================
   * KENDER DU MIG – WAITING
   * ===================================================
   */

  knowMeWaitingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 90,
  },

  knowMeWaitingIcons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 25,
  },

  knowMeWaitingPerson: {
    width: 30,
    height: 49,
    alignItems: "center",
  },

  knowMeResultNextButton: {
    width: "100%",
    maxWidth: 450,
    height: 62,
    borderRadius: 35,
    backgroundColor: COLORS.navy,
    justifyContent: "center",
    alignItems: "center",
  },

  knowMeResultNextText: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: "800",
  },

  knowMePersonActive: {
    opacity: 1,
  },

  knowMePersonInactive: {
    opacity: 0.25,
  },

  knowMePersonHead: {
    width: 16,
    height: 16,
    borderWidth: 2.5,
    borderColor: COLORS.blue,
    borderRadius: 8,
    marginBottom: 4,
  },

  knowMePersonBody: {
    width: 28,
    height: 27,
    borderWidth: 2.5,
    borderColor: COLORS.blue,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    backgroundColor: COLORS.lightBlue,
  },

  knowMeWaitingCount: {
    color: COLORS.navy,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
  },

  knowMeWaitingSubtitle: {
    color: COLORS.blue,
    fontSize: 17,
    textAlign: "center",
  },

  /**
   * ===================================================
   * KENDER DU MIG – RESULTS
   * ===================================================
   */

  knowMeResultScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 35,
    paddingBottom: 30,
  },

  knowMeResultBlob: {
    width: "100%",
    minHeight: 300,
    borderRadius: 80,
    backgroundColor: COLORS.lightBlue,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingVertical: 35,
  },

  knowMeIncorrectBlob: {
    backgroundColor: COLORS.pink,
  },

  knowMeResultIcon: {
    fontSize: 65,
    marginBottom: 20,
  },

  knowMeResultTitle: {
    color: COLORS.navy,
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 39,
    textAlign: "center",
  },

  knowMeResultArtwork: {
    width: "100%",
    maxWidth: 480,
    height: 355,
    marginTop: 45,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 55,
    paddingTop: 10,
  },

  knowMeResultImage: {
    width: 155,
    height: 125,
    marginBottom: 15,
  },


knowMeResultSubtitle: {
  color: COLORS.navy,
  fontSize: 25,
  fontWeight: "800",
  textAlign: "center",
  marginTop: 8,
},

  knowMeResultDescription: {
    color: COLORS.blue,
    fontSize: 16,
    textAlign: "center",
    marginTop: 12,
  },


  knowMeAvatar: {
    width: 135,
    height: 135,
    borderRadius: 67.5,
    backgroundColor: "#ffffff",
    borderWidth: 3,
    borderColor: "#ffffff",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  knowMeAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 67.5,
  },


  knowMeHostWaiting: {
    color: COLORS.muted,
    fontSize: 16,
    textAlign: "center",
    marginTop: 25,
  },

  /**
   * ===================================================
   * OTHER GAMES
   * ===================================================
   */

  genericScroll: {
    flex: 1,
  },

  genericContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 50,
  },

  genericCardText: {
    color: COLORS.navy,
    fontSize: 25,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 35,
    backgroundColor: COLORS.white,
    borderRadius: 25,
    overflow: "hidden",
    padding: 28,
  },

  /**
   * ===================================================
   * BOTTOM CONTROLS
   * ===================================================
   */

  bottomControls: {
    alignItems: "center",
    paddingBottom: 35,
    paddingHorizontal: 25,
  },

  nextButton: {
    width: "85%",
    minHeight: 60,
    backgroundColor: COLORS.navy,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },

  nextButtonText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "800",
  },

  roundCounter: {
    color: COLORS.muted,
    fontSize: 17,
    fontWeight: "600",
    marginTop: 14,
  },
});

export default GamePlayScreen;
