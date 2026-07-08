import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import socket from "../../services/socket";
import { LinearGradient } from "expo-linear-gradient";
import { games } from "../data/games";

const LobbyScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [gameId, setGameId] = useState(route.params?.gameId || "");
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(route.params?.isHost || false);

  useEffect(() => {
    const setupLobby = async () => {
      const userData = await AsyncStorage.getItem("user");
      const user = userData ? JSON.parse(userData) : null;


      if (!user) {
        navigation.navigate("CreateUser");
        return;
      }

    if (isHost) {
      socket.emit("createGame", {
        name: user.name,
        profileImage: user.profileImage,
      });
    }
    };

    setupLobby();

    socket.on("gameCreated", ({ gameId, players }) => {
      setGameId(gameId);
      setPlayers(players);
      setIsHost(true);
    });

    socket.on("joinedGame", ({ gameId, players }) => {
      setGameId(gameId);
      setPlayers(players);
      setIsHost(false);
    });

    socket.on("gamePlayers", (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    socket.on("gameStarted", ({ gameId, game, players }) => {
      navigation.navigate("GameIntro", {
        game,
        gameId,
        isHost,
        players,
      });
    });

    socket.on("gameError", (message) => {
      Alert.alert("Fejl", message);
      navigation.reset({
        index: 0,
        routes: [{ name: "JoinGame" }],
      });
    });

    return () => {
      socket.off("gameCreated");
      socket.off("joinedGame");
      socket.off("gamePlayers");
      socket.off("gameError");
      socket.off("gameStarted");
    };
  }, []);

  const handleStartGame = () => {
    const randomIndex = Math.floor(Math.random() * games.length);
    const selectedGame = games[randomIndex];

  socket.emit("startGame", {
    gameId,
    game: selectedGame,
  });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Festkode</Text>

      <View style={styles.pinBox}>
        <Text style={styles.pin}>{gameId || "..."}</Text>
      </View>

      <Text style={styles.infoText}>
        Del koden med dine venner, så de kan joine spillet.
      </Text>

      <View style={styles.playersWrapper}>
        <LinearGradient
          colors={["rgba(225,224,228,1)", "rgba(225,224,228,0)"]}
          style={styles.fadeTop}
          pointerEvents="none"
        />

        <ScrollView
          style={styles.playersScroll}
          contentContainerStyle={styles.playersGrid}
          showsVerticalScrollIndicator={true}
          indicatorStyle="black"
        >
          {players.map((item) => (
            <View key={item.id} style={styles.playerCard}>
              <Image
                source={
                  item.profileImage
                    ? { uri: item.profileImage }
                    : require("../../assets/kamera.png")
                }
                style={styles.playerImage}
              />

              <Text style={styles.playerName} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
          ))}
        </ScrollView>

        <LinearGradient
          colors={["rgba(225,224,228,0)", "rgba(225,224,228,1)"]}
          style={styles.fadeBottom}
          pointerEvents="none"
        />
      </View>

      <View style={styles.bottomArea}>
        {isHost ? (
          <TouchableOpacity style={styles.button} onPress={handleStartGame}>
            <Text style={styles.buttonText}>Start spil</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.waitingText}>Venter på host...</Text>
        )}

        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <Text style={styles.backText}>Tilbage</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e1e0e4",
    alignItems: "center",
    paddingTop: 60,
  },

  title: {
    fontSize: 36,
    color: "#137DC5",
    fontWeight: "bold",
    marginBottom: 20,
  },

  pinBox: {
    width: 290,
    paddingVertical: 16,
    borderRadius: 30,
    backgroundColor: "#e8e5fc",
    marginBottom: 18,
  },

  pin: {
    fontSize: 42,
    color: "#137DC5",
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 8,
  },

  infoText: {
    width: 350,
    color: "#9c9c9c",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },

  playersWrapper: {
    width: "100%",
    flex: 1,
    maxHeight: 390,
    position: "relative",
  },

  playersScroll: {
    width: "100%",
    alignSelf: "stretch",
  },

  playersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    width: "100%",
    paddingHorizontal: 12,
    paddingTop: 18,
    paddingBottom: 35,
  },

  playerCard: {
    width: "33.33%",
    alignItems: "center",
    marginBottom: 16,
  },

  playerImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e8e5fc",
  },

  playerName: {
    fontSize: 16,
    color: "#137DC5",
    fontWeight: "bold",
    marginTop: 8,
    maxWidth: 90,
    textAlign: "center",
  },

  fadeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 35,
    zIndex: 2,
  },

  fadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    zIndex: 2,
  },

  bottomArea: {
    width: "100%",
    alignItems: "center",
    paddingTop: 55,
    paddingBottom: 35,
  },

  button: {
    width: 250,
    padding: 14,
    borderRadius: 30,
    backgroundColor: "#137DC5",
    marginBottom: 18,
  },

  buttonText: {
    color: "white",
    fontSize: 22,
    textAlign: "center",
    fontWeight: "bold",
  },

  waitingText: {
    color: "#137DC5",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 18,
  },

  backText: {
    color: "#137DC5",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default LobbyScreen;