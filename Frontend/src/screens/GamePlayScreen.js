import React, { useEffect, useRef, useState } from "react";
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { games } from "../../Shared/games";
import socket from "../../services/socket";

const GamePlayScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const { height } = useWindowDimensions();
  const isSmallScreen = height < 750;

  const lastTitlePressRef = useRef(0);

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
  } = route.params;

  const handleTitlePress = () => {
    const now = Date.now();

    if (now - lastTitlePressRef.current < 350) {
      socket.emit("leaveGame", { gameId });

      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    }

    lastTitlePressRef.current = now;
  };

  const getNextGame = () => {
    const otherGames = games.filter((item) => item.id !== game.id);

    if (otherGames.length === 0) {
      return game;
    }

    const randomIndex = Math.floor(Math.random() * otherGames.length);
    return otherGames[randomIndex];
  };

  const [line1, line2] = game.headerTitle
    ? game.headerTitle.split("\n")
    : game.title.split(" ");

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

  const roundLimit =
    game.cardsPerRound === "players"
      ? getRoundLimit(players.length)
      : game.cardsPerRound === "halfPlayers"
      ? players.length < 3
        ? players.length
        : Math.ceil(players.length / 2)
      : game.cardsPerRound;

  const [usedIndexes, setUsedIndexes] = useState(routeUsedIndexes || []);
  const [usedPlayerIndexes, setUsedPlayerIndexes] = useState(
    routeUsedPlayerIndexes || []
  );
  const [card, setCard] = useState(routeCard || null);
  const [currentPlayer, setCurrentPlayer] = useState(
    routeCurrentPlayer || null
  );
  const [turnCount, setTurnCount] = useState(routeTurnCount || 0);

  const [selectedHotSeatCategory, setSelectedHotSeatCategory] = useState(null);

  const reachedLimit =
    roundLimit !== null && roundLimit !== undefined && turnCount >= roundLimit;

  const cardText = card
    ? typeof card === "string"
      ? card
      : card.text || null
    : "Der er ikke flere kort i dette spil.";

  useEffect(() => {
    socket.on("showGamePlay", (payload) => {
      setCard(payload.card);
      setUsedIndexes(payload.usedIndexes || []);
      setUsedPlayerIndexes(payload.usedPlayerIndexes || []);
      setCurrentPlayer(payload.currentPlayer || null);
      setTurnCount(payload.turnCount || 0);
      setSelectedHotSeatCategory(null);
    });

    socket.on("showGameIntro", ({ gameId, game, players, reader }) => {
      navigation.navigate("GameIntro", {
        game,
        gameId,
        isHost,
        players,
        reader,
      });
    });

    return () => {
      socket.off("showGamePlay");
      socket.off("showGameIntro");
    };
  }, []);

  const handleNext = () => {
    if (reachedLimit) return;

    socket.emit("showGamePlay", {
      gameId,
      game,
      usedIndexes,
      usedPlayerIndexes,
      turnCount,
    });
  };

  const handleEndRound = () => {
    socket.emit("showGameIntro", {
      gameId,
      game: getNextGame(),
    });
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        isSmallScreen && styles.containerSmall,
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Image
          source={require("../../assets/phone_logo.png")}
          style={styles.icon}
        />

        <TouchableOpacity
          style={styles.titleWrapper}
          activeOpacity={1}
          onPress={handleTitlePress}
        >
          <Text style={styles.headerSmall}>{line1}</Text>
          <Text
            style={[
              styles.headerBig,
              line2?.length > 10 && styles.headerBigSmall,
            ]}
          >
            {line2 || ""}
          </Text>
        </TouchableOpacity>

        <Image
          source={require("../../assets/phone_logo.png")}
          style={styles.icon}
        />
      </View>

      {game.mode === "player_turns" && currentPlayer && (
        <View style={styles.currentPlayerBox}>
          <Image
            source={
              currentPlayer.profileImage
                ? { uri: currentPlayer.profileImage }
                : require("../../assets/kamera.png")
            }
            style={styles.currentPlayerImage}
          />

          <Text style={styles.currentPlayerName}>{currentPlayer.name}</Text>
          {game.screenType === "hot_seat" &&
            currentPlayer?.id !== socket.id && (
              <Text style={styles.hotSeatSuggestionTitle}>
                FORSLAG TIL SPØRGSMÅL
              </Text>
          )}
        </View>
      )}

      <View style={styles.cardBox}>
        {game.screenType === "hot_seat" ? (
          currentPlayer?.id === socket.id ? (
            <Text style={styles.cardText}>
              Du er blevet valgt,{"\n"}
              sæt dig godt til rette
            </Text>
          ) : selectedHotSeatCategory ? (
            <ScrollView showsVerticalScrollIndicator={false}>

              <Text style={styles.hotSeatTitle}>
                {selectedHotSeatCategory === "green"
                  ? "Easy Going Edition"
                  : selectedHotSeatCategory === "orange"
                  ? "Buzz Edition"
                  : "Hård Spiritus Edition"}
              </Text>

              {game.cards[selectedHotSeatCategory]?.map((question, index) => (
                <Text key={index} style={styles.hotSeatQuestion}>
                  {index + 1}. {question}
                </Text>
              ))}
            </ScrollView>
          ) : (
          <View style={styles.categoryWrapper}>

            <TouchableOpacity
              onPress={() => setSelectedHotSeatCategory("green")}
            >
              <Image
                source={require("../../assets/hot-seat-green.png")}
                style={styles.categoryOnlyImage}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedHotSeatCategory("orange")}
            >
              <Image
                source={require("../../assets/hot-seat-orange.png")}
                style={styles.categoryOnlyImage}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedHotSeatCategory("red")}
            >
              <Image
                source={require("../../assets/hot-seat-red.png")}
                style={styles.categoryOnlyImage}
              />
            </TouchableOpacity>

          </View>
          )
        ) : game.screenType === "three_random_statements" &&
          Array.isArray(card) ? (
          <>
            {card.map((statement, index) => (
              <React.Fragment key={index}>
                <Text style={styles.statementText}>{statement}</Text>

                {index < card.length - 1 && (
                  <View style={styles.statementDivider} />
                )}
              </React.Fragment>
            ))}
          </>
        ) : card?.optionA && card?.optionB ? (
          <>
            <Text style={styles.optionText}>{card.optionA}</Text>
            <Text style={styles.orText}>eller</Text>
            <Text style={styles.optionText}>{card.optionB}</Text>
          </>
        ) : (
          <Text style={styles.cardText}>{cardText}</Text>
        )}
      </View>

    {selectedHotSeatCategory ? (
      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => setSelectedHotSeatCategory(null)}
      >
        <Text style={styles.buttonText}>Tilbage</Text>
      </TouchableOpacity>
    ) : isHost ? (
      <>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={reachedLimit ? handleEndRound : handleNext}
        >
          <Text style={styles.buttonText}>
            {reachedLimit ? "NÆSTE SPIL" : "Næste"}
          </Text>
        </TouchableOpacity>

        {!game.cardsPerRound && (
          <TouchableOpacity style={styles.endButton} onPress={handleEndRound}>
            <Text style={styles.buttonText}>NÆSTE SPIL</Text>
          </TouchableOpacity>
        )}
      </>
    ) : (
      <Text style={styles.waitingText}></Text>
    )}
    </ScrollView>
  );
};

export default GamePlayScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#e1e0e4",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: 70,
    paddingBottom: 35,
  },

  containerSmall: {
    paddingTop: 45,
  },

  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 45,
  },

  titleWrapper: {
    flex: 1,
    alignItems: "center",
  },

  icon: {
    width: 55,
    height: 55,
    resizeMode: "contain",
  },

  headerSmall: {
    fontSize: 28,
    color: "#2f56a6",
    fontWeight: "bold",
    textAlign: "center",
  },

  headerBig: {
    fontSize: 38,
    color: "#2f56a6",
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
  },

  headerBigSmall: {
    fontSize: 28,
    letterSpacing: 1,
  },

  currentPlayerBox: {
    alignItems: "center",
    marginTop: -33,
    marginBottom: 18,
  },

  currentPlayerImage: {
    width: 95,
    height: 95,
    borderRadius: 47.5,
    backgroundColor: "#e8e5fc",
    marginBottom: 8,
  },

  currentPlayerName: {
    fontSize: 20,
    color: "#137DC5",
    fontWeight: "bold",
    fontStyle: "italic",
  },

  cardBox: {
    width: "100%",
    minHeight: 320,
    maxHeight: 430,
    backgroundColor: "#e8e5fc",
    borderRadius: 28,
    padding: 24,
    alignItems: "stretch",
    justifyContent: "center",
    marginBottom: 20,
  },

  cardText: {
    fontSize: 25,
    color: "#9c9c9c",
    fontWeight: "bold",
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 36,
  },

  statementDivider: {
    height: 28,
  },

  statementText: {
    fontSize: 20,
    color: "#555",
    fontWeight: "bold",
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 32,
  },

  optionText: {
    fontSize: 23,
    color: "#555",
    fontWeight: "bold",
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 33,
  },

  orText: {
    fontSize: 28,
    color: "#2f56a6",
    fontWeight: "900",
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 16,
  },

  nextButton: {
    width: 230,
    padding: 12,
    borderRadius: 30,
    backgroundColor: "#137DC5",
    marginBottom: 35,
  },

  endButton: {
    width: 300,
    padding: 14,
    borderRadius: 30,
    backgroundColor: "#137DC5",
  },

  buttonText: {
    color: "white",
    fontSize: 20,
    textAlign: "center",
    fontWeight: "bold",
  },

  hotSeatTitle: {
    fontSize: 24,
    color: "#137DC5",
    fontWeight: "bold",
    textAlign: "left",
    marginBottom: 22,
  },

  greenTitle: {
    fontSize: 20,
    color: "#137DC5",
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },

  hotSeatSuggestionTitle: {
    marginTop: 15,
    marginBottom: -10,
    fontSize: 20,
    fontWeight: "900",
    fontStyle: "italic",
    color: "#9c9c9c",
    letterSpacing: 1,
  },

  orangeTitle: {
    fontSize: 20,
    color: "#137DC5",
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },


  redTitle: {
    fontSize: 20,
    color: "#137DC5",
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },

  hotSeatQuestion: {
    fontSize: 15,
    color: "#9c9c9c",
    fontWeight: "600",
    textAlign: "left",
    lineHeight: 23,
    marginBottom: 18,
    width: "100%",
  },

  categoryWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },

  categoryOnlyImage: {
    width: 315,
    height: 135,
    resizeMode: "contain",
    marginBottom: 5,
  },

  backCategoryText: {
    color: "#137DC5",
    fontWeight: "bold",
    fontSize: 17,
    marginBottom: 15,
  },

  waitingText: {
    color: "#9c9c9c",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 25,
  },
});