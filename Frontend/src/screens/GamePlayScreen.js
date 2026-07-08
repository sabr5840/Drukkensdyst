import React, { useEffect, useRef, useState } from "react";import {
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

  const getRandomIndex = (usedIndexes) => {
    const availableIndexes = game.cards
      .map((_, index) => index)
      .filter((index) => !usedIndexes.includes(index));

    if (availableIndexes.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * availableIndexes.length);
    return availableIndexes[randomIndex];
  };

  const getThreeRandomCards = (usedIndexes) => {
    const selectedCards = [];
    let newUsedIndexes = [...usedIndexes];

    for (let i = 0; i < 3; i++) {
      if (newUsedIndexes.length === game.cards.length) {
        newUsedIndexes = [];
      }

      const nextIndex = getRandomIndex(newUsedIndexes);

      if (nextIndex === null) break;

      newUsedIndexes.push(nextIndex);
      selectedCards.push(game.cards[nextIndex]);
    }

    return {
      cards: selectedCards,
      usedIndexes: newUsedIndexes,
    };
  };

  const getRandomPlayerIndex = (usedPlayerIndexes) => {
    const availableIndexes = players
      .map((_, index) => index)
      .filter((index) => !usedPlayerIndexes.includes(index));

    if (availableIndexes.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * availableIndexes.length);
    return availableIndexes[randomIndex];
  };

  const createInitialState = () => {
    let initialUsedIndexes = [];
    let initialCard = null;

    if (game.screenType === "three_random_statements") {
      const result = getThreeRandomCards([]);
      initialUsedIndexes = result.usedIndexes;
      initialCard = result.cards;
    } else {
      const firstIndex = getRandomIndex([]);

      if (firstIndex !== null) {
        initialUsedIndexes = [firstIndex];
        initialCard = game.cards[firstIndex];
      }
    }

    const firstPlayerIndex = getRandomPlayerIndex([]);

    return {
      card: initialCard,
      usedIndexes: initialUsedIndexes,
      usedPlayerIndexes: firstPlayerIndex !== null ? [firstPlayerIndex] : [],
      currentPlayer:
        firstPlayerIndex !== null ? players[firstPlayerIndex] : null,
    };
  };

  const initialState = createInitialState();

  const [usedIndexes, setUsedIndexes] = useState(
    routeUsedIndexes || initialState.usedIndexes
  );

  const [card, setCard] = useState(routeCard || initialState.card);

  const [usedPlayerIndexes, setUsedPlayerIndexes] = useState(
    routeUsedPlayerIndexes || initialState.usedPlayerIndexes
  );

  const [currentPlayer, setCurrentPlayer] = useState(
    routeCurrentPlayer || initialState.currentPlayer
  );

  const [turnCount, setTurnCount] = useState(routeTurnCount || 0);

  const cardText = card
    ? typeof card === "string"
      ? card
      : card.text || null
    : "Der er ikke flere kort i dette spil.";

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

  const reachedLimit =
    roundLimit !== null && roundLimit !== undefined && turnCount >= roundLimit;




  useEffect(() => {
  socket.on("showGamePlay", (payload) => {
    setCard(payload.card);
    setUsedIndexes(payload.usedIndexes || []);
    setUsedPlayerIndexes(payload.usedPlayerIndexes || []);
    setCurrentPlayer(payload.currentPlayer || null);
    setTurnCount(payload.turnCount || 0);
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

  const createNextState = () => {
    let newUsedIndexes = [...usedIndexes];
    let newCard = card;

    if (game.screenType === "three_random_statements") {
      const result = getThreeRandomCards(newUsedIndexes);
      newUsedIndexes = result.usedIndexes;
      newCard = result.cards;
    } else {
      if (newUsedIndexes.length === game.cards.length) {
        newUsedIndexes = [];
      }

      const nextIndex = getRandomIndex(newUsedIndexes);

      if (nextIndex !== null) {
        newUsedIndexes.push(nextIndex);
        newCard = game.cards[nextIndex];
      }
    }

    let newUsedPlayerIndexes = [...usedPlayerIndexes];
    let newCurrentPlayer = currentPlayer;

    if (game.mode === "player_turns") {
      const nextPlayerIndex = getRandomPlayerIndex(newUsedPlayerIndexes);

      if (nextPlayerIndex !== null) {
        newUsedPlayerIndexes.push(nextPlayerIndex);
        newCurrentPlayer = players[nextPlayerIndex];
      }
    }

    return {
      card: newCard,
      usedIndexes: newUsedIndexes,
      usedPlayerIndexes: newUsedPlayerIndexes,
      currentPlayer: newCurrentPlayer,
    };
  };

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
        </View>
      )}

      <View style={styles.cardBox}>
            {game.screenType === "three_random_statements" && Array.isArray(card) ? (
              <>
                {card.map((statement, index) => (
                  <React.Fragment key={index}>
                    <Text style={styles.statementText}>
                      {statement}
                    </Text>

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

      {isHost ? (
        <>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={reachedLimit ? handleEndRound : handleNext}
          >
            <Text style={styles.buttonText}>
              {reachedLimit ? "AFSLUT RUNDE" : "Næste"}
            </Text>
          </TouchableOpacity>

          {!game.cardsPerRound && (
            <TouchableOpacity style={styles.endButton} onPress={handleEndRound}>
              <Text style={styles.buttonText}>AFSLUT RUNDE</Text>
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
    marginBottom: 22,
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
    minHeight: 210,
    backgroundColor: "#e8e5fc",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
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

  waitingText: {
    color: "#9c9c9c",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 25,
  },
});
