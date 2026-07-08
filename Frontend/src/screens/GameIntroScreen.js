import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { games } from "../../Shared/games";
import socket from "../../services/socket";

const GameIntroScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const { height } = useWindowDimensions();
  const isSmallScreen = height < 750;

  const { game, gameId, isHost, players = [], reader } = route.params;

  const selectedReader =
    reader ||
    (players.length > 0
      ? players[Math.floor(Math.random() * players.length)]
      : null);

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

  useEffect(() => {
    socket.on("showGameIntro", ({ gameId, game, players, reader }) => {
      const currentPlayer = players.find((player) => player.id === socket.id);

      navigation.navigate("GameIntro", {
        game,
        gameId,
        isHost: currentPlayer?.isHost || false,
        players,
        reader,
      });
    });

    socket.on("showGamePlay", ({ gameId, game, players, reader }) => {
      const currentPlayer = players.find((player) => player.id === socket.id);

      navigation.navigate("GamePlay", {
        game,
        gameId,
        isHost: currentPlayer?.isHost || false,
        players,
        reader,
      });
    });

    return () => {
      socket.off("showGameIntro");
      socket.off("showGamePlay");
    };
  }, []);

  const handleStartRound = () => {
    socket.emit("showGamePlay", {
      gameId,
      game,
      reader: selectedReader,
    });
  };

  const handleSkipGame = () => {
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

        <View style={styles.titleWrapper}>
          <Text style={styles.headerSmall}>{line1}</Text>
          <Text
            style={[
              styles.headerBig,
              line2?.length > 10 && styles.headerBigSmall,
            ]}
          >
            {line2 || ""}
          </Text>
        </View>

        <Image
          source={require("../../assets/phone_logo.png")}
          style={styles.icon}
        />
      </View>

      <Text style={styles.rulesHeading}>REGELSÆT</Text>

    <View style={styles.rulesBox}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <Text style={styles.description}>{game.description}</Text>

        <Text style={styles.sectionTitle}>Sådan spiller I:</Text>

        {game.rules.map((rule, index) => (
          <Text key={index} style={styles.ruleText}>
            • {rule}
          </Text>
        ))}
      </ScrollView>
    </View>

      {isHost ? (
        <>
          <TouchableOpacity style={styles.button} onPress={handleStartRound}>
            <Text style={styles.buttonText}>Vi er klar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={handleSkipGame}>
            <Text style={styles.buttonText}>SKIP SPIL</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.waitingText}>Venter på host...</Text>
      )}
    </ScrollView>
  );
};

export default GameIntroScreen;

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

  rulesHeading: {
    fontSize: 25,
    color: "#9c9c9c",
    fontWeight: "bold",
    marginBottom: 15,
  },

  rulesBox: {
    width: "100%",
    maxHeight: 380,  
    backgroundColor: "#e8e5fc",
    borderRadius: 28,
    padding: 22,
    marginBottom: 35,
  },

  description: {
    fontSize: 14,
    color: "#9c9c9c",
    lineHeight: 21,
    marginBottom: 20,
    fontWeight: "600",
  },

  sectionTitle: {
    fontSize: 15,
    color: "#9c9c9c",
    fontWeight: "bold",
    marginBottom: 8,
  },

  ruleText: {
    fontSize: 13,
    color: "#9c9c9c",
    lineHeight: 20,
    marginBottom: 5,
  },

  readerName: {
    color: "#137DC5",
    fontWeight: "900",
  },

  button: {
    width: 250,
    padding: 13,
    borderRadius: 30,
    backgroundColor: "#137DC5",
    marginBottom: 18,
  },

  skipButton: {
    width: 300,
    padding: 14,
    borderRadius: 30,
    backgroundColor: "#137DC5",
  },

  waitingText: {
    color: "#137DC5",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 25,
  },

  buttonText: {
    color: "white",
    fontSize: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
});