
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path } from "react-native-svg";
import socket from "../../services/socket";

const COLORS = {
  background: "#f8f3ef",
  navy: "#0b2250",
  lightBlue: "#dbe6f1",
  muted: "#647594",
  white: "#ffffff",
};

const API_URL = "http://10.0.0.28:3000";

// Retter gamle serveradresser på profilbilleder
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

// Samme baggrundsform som i home.js
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

// Deltager med profilbillede og navn
const PlayerCard = ({ player }) => {
  const imageUri = getProfileImageUri(player.profileImage);

  return (
    <View style={styles.playerCard}>
      <View style={styles.playerImageContainer}>
        <Image
          source={
            imageUri
              ? { uri: imageUri }
              : require("../../assets/kamera.png")
          }
          style={[
            styles.playerImage,
            !imageUri && styles.cameraImage,
          ]}
          resizeMode={imageUri ? "cover" : "contain"}
          onError={(error) => {
            console.log(
              "Fejl ved profilbillede:",
              error.nativeEvent.error
            );
          }}
        />
      </View>

      <Text style={styles.playerName} numberOfLines={1}>
        {player.name || "Spiller"}
      </Text>
    </View>
  );
};

const LobbyScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { width, height } = useWindowDimensions();

  const [gameId, setGameId] = useState(
    route.params?.gameId || ""
  );

  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(
    route.params?.isHost || false
  );

  useEffect(() => {
    let active = true;

    const handleGameCreated = ({ gameId, players }) => {
      setGameId(gameId);
      setPlayers(players || []);
      setIsHost(true);
    };

    const handleJoinedGame = ({ gameId, players }) => {
      setGameId(gameId);
      setPlayers(players || []);
      setIsHost(false);
    };

    const handleGamePlayers = (updatedPlayers) => {
      const safePlayers = updatedPlayers || [];

      setPlayers(safePlayers);

      const currentPlayer = safePlayers.find(
        (player) => player.id === socket.id
      );

      if (currentPlayer) {
        setIsHost(!!currentPlayer.isHost);
      }
    };

    const handleGameStarted = ({
      gameId,
      game,
      players,
    }) => {
      const currentPlayer = players?.find(
        (player) => player.id === socket.id
      );

      navigation.navigate("GameIntro", {
        game,
        gameId,
        isHost: currentPlayer?.isHost || false,
        players,
      });
    };

    const handleGameError = (message) => {
      Alert.alert("Fejl", String(message));

      navigation.reset({
        index: 0,
        routes: [{ name: "JoinGame" }],
      });
    };

    socket.on("gameCreated", handleGameCreated);
    socket.on("joinedGame", handleJoinedGame);
    socket.on("gamePlayers", handleGamePlayers);
    socket.on("gameStarted", handleGameStarted);
    socket.on("gameError", handleGameError);

    const setupLobby = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        const user = userData ? JSON.parse(userData) : null;

        if (!active) return;

        if (!user) {
          navigation.navigate("CreateUser");
          return;
        }

        if (route.params?.isHost) {
          socket.emit("createGame", {
            name: user.name,
            profileImage: user.profileImage,
          });
        }
      } catch (error) {
        console.error("Fejl ved oprettelse af lobby:", error);

        Alert.alert(
          "Fejl",
          "Kunne ikke hente din bruger."
        );
      }
    };

    setupLobby();

    return () => {
      active = false;

      socket.off("gameCreated", handleGameCreated);
      socket.off("joinedGame", handleJoinedGame);
      socket.off("gamePlayers", handleGamePlayers);
      socket.off("gameStarted", handleGameStarted);
      socket.off("gameError", handleGameError);
    };
  }, [navigation, route.params?.isHost]);

  const handleStartGame = () => {
    if (!gameId) {
      Alert.alert(
        "Vent lidt",
        "Spillet er ikke oprettet endnu."
      );
      return;
    }

    socket.emit("startGame", { gameId });
  };

  // Gå direkte til Home uden navigation.goBack()
  const handleBack = () => {
    navigation.navigate("Home");
  };

  return (
    <View style={styles.container}>
      {/* Samme baggrund som home.js */}
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

      {/* Logo */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/gamePin.png")}
          style={[
            styles.logo,
            { width: width * 0.84 },
          ]}
          resizeMode="contain"
        />
      </View>

      {/* Festkode */}
      <View style={styles.pinSection}>
        <View style={styles.pinBox}>
          <Text
            style={styles.pin}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {gameId || "..."}
          </Text>
        </View>

        <Text style={styles.infoText}>
          Del koden med dine venner, så de kan joine spillet.
        </Text>
      </View>

      {/* Deltagere */}
      <View style={styles.playersWrapper}>
        <ScrollView
          style={styles.playersScroll}
          contentContainerStyle={styles.playersGrid}
          showsVerticalScrollIndicator={false}
        >
          {players.map((player, index) => (
            <PlayerCard
              key={player.id || index}
              player={player}
            />
          ))}
        </ScrollView>
      </View>

      {/* Knapper nederst */}
      <View style={styles.bottomArea}>
        {isHost ? (
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartGame}
            activeOpacity={0.85}
          >
            <Text style={styles.startButtonText}>
              Start spil
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.waitingText}>
            Venter på, at hosten starter spillet...
          </Text>
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.8}
        >
          <Text style={styles.backText}>
            Tilbage
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
  },

  header: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
  },

  logo: {
    height: 195,
  },

  pinSection: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 35,
    marginTop: 10,
  },

  pinBox: {
    width: "100%",
    maxWidth: 320,
    height: 75,
    borderRadius: 35,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",

    shadowColor: COLORS.navy,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 3,
    marginTop: -45,
  },

  pin: {
    color: COLORS.navy,
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: 5,
    textAlign: "center",
  },

  infoText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 320,
    marginTop: 20,
  },

  playersWrapper: {
    flex: 1,
    width: "100%",
    minHeight: 0,
    paddingHorizontal: 16,
    paddingTop: 35,
    marginTop: -25,
  },

  playersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 22,
  },

  playersTitle: {
    color: COLORS.navy,
    fontSize: 23,
    fontWeight: "800",
  },

  playersCount: {
    color: COLORS.muted,
    fontSize: 16,
    fontWeight: "700",
  },

  playersScroll: {
    flex: 1,
    width: "100%",
  },

  playersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    paddingBottom: 20,
  },

  playerCard: {
    width: "33.33%",
    alignItems: "center",
    marginBottom: 22,
    paddingHorizontal: 4,
  },

  playerImageContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.white,
    overflow: "hidden",
  },

  playerImage: {
    width: "100%",
    height: "100%",
    borderRadius: 44,
  },

  cameraImage: {
    width: "100%",
    height: "100%",
  },

  playerName: {
    color: COLORS.navy,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 9,
    maxWidth: 105,
    textAlign: "center",
  },

  bottomArea: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 35,
    paddingTop: 18,
    paddingBottom: 38,
  },

  startButton: {
    width: "100%",
    maxWidth: 320,
    height: 62,
    borderRadius: 35,
    backgroundColor: COLORS.navy,
    justifyContent: "center",
    alignItems: "center",

    shadowColor: COLORS.navy,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 7,
    elevation: 3,
  },

  startButtonText: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },

  waitingText: {
    color: COLORS.navy,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 18,
  },

  backButton: {
    marginTop: 20,
    padding: 10,
  },

  backText: {
    color: COLORS.navy,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
});

export default LobbyScreen;
