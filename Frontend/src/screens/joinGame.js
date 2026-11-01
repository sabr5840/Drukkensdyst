
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
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

const JoinGame = () => {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();

  const [pin, setPin] = useState("");
  const [joining, setJoining] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleJoinedGame = ({ gameId }) => {
      setJoining(false);

      navigation.navigate("Lobby", {
        gameId,
        isHost: false,
      });
    };

    const handleGameError = (message) => {
      setJoining(false);
      Alert.alert("Fejl", String(message));
    };

    socket.on("joinedGame", handleJoinedGame);
    socket.on("gameError", handleGameError);

    return () => {
      socket.off("joinedGame", handleJoinedGame);
      socket.off("gameError", handleGameError);
    };
  }, [navigation]);

  const handlePinChange = (text) => {
    const onlyNumbers = text.replace(/[^0-9]/g, "").slice(0, 6);
    setPin(onlyNumbers);
  };

  const handleJoinGame = async () => {
    if (joining) return;

    if (pin.length !== 6) {
      Alert.alert("Fejl", "Indtast en 6-cifret festkode");
      return;
    }

    try {
      const userData = await AsyncStorage.getItem("user");
      const user = userData ? JSON.parse(userData) : null;

      if (!user) {
        navigation.navigate("CreateUser");
        return;
      }

      setJoining(true);

      socket.emit("joinGame", {
        gameId: pin,
        name: user.name,
        profileImage: user.profileImage,
      });
    } catch (error) {
      setJoining(false);
      console.error("Fejl ved join af spil:", error);
      Alert.alert("Fejl", "Kunne ikke tilslutte spillet.");
    }
  };

  const handleBack = () => {
    navigation.navigate("Home");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Samme baggrund som Home */}
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { minHeight: height },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.header}>
          <Image
            source={require("../../assets/logo-.png")}
            style={[
              styles.logo,
              { width: width * 0.84 },
            ]}
            resizeMode="contain"
          />
        </View>

        {/* Festkode og knapper */}
        <View style={styles.mainContent}>
          <Text style={styles.title}>
            Indtast festkode
          </Text>

          {/* Seks cifre */}
          <TouchableOpacity
            activeOpacity={1}
            style={styles.pinContainer}
            onPress={() => inputRef.current?.focus()}
          >
            {Array.from({ length: 6 }).map((_, index) => {
              const value = pin[index];

              return (
                <View key={index} style={styles.pinBox}>
                  <Text
                    style={[
                      styles.pinNumber,
                      !value && styles.placeholderNumber,
                    ]}
                  >
                    {value || "0"}
                  </Text>

                  <View
                    style={[
                      styles.underline,
                      pin.length === index &&
                        styles.activeUnderline,
                    ]}
                  />
                </View>
              );
            })}

            <TextInput
              ref={inputRef}
              value={pin}
              onChangeText={handlePinChange}
              keyboardType="number-pad"
              maxLength={6}
              style={styles.hiddenInput}
              caretHidden
              contextMenuHidden
              textContentType="oneTimeCode"
            />
          </TouchableOpacity>

          {/* Join spil */}
          <TouchableOpacity
            style={[
              styles.button,
              joining && styles.disabledButton,
            ]}
            onPress={handleJoinGame}
            disabled={joining}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>
              {joining ? "Tilslutter..." : "Join spil"}
            </Text>
          </TouchableOpacity>

          {/* Tilbage */}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
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
    paddingBottom: 35,
  },

  header: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
  },

  logo: {
    height: 195,
  },

  mainContent: {
    flex: 1,
    width: "100%",
    minHeight: 420,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingBottom: 55,
  },

  title: {
    color: COLORS.navy,
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 35,
  },

  pinContainer: {
    width: "100%",
    maxWidth: 330,
    height: 100,
    backgroundColor: COLORS.white,
    borderRadius: 35,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingHorizontal: 10,
    marginBottom: 38,

    shadowColor: COLORS.navy,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 3,
  },

  pinBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  pinNumber: {
    fontSize: 38,
    fontWeight: "800",
    color: COLORS.navy,
  },

  placeholderNumber: {
    color: "#b9bec7",
  },

  underline: {
    marginTop: 7,
    width: 34,
    height: 4,
    borderRadius: 3,
    backgroundColor: "#aab5c4",
  },

  activeUnderline: {
    backgroundColor: COLORS.navy,
  },

  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },

  button: {
    width: "100%",
    maxWidth: 320,
    height: 64,
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

  disabledButton: {
    opacity: 0.65,
  },

  buttonText: {
    color: COLORS.white,
    fontSize: 23,
    fontWeight: "800",
    textAlign: "center",
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

export default JoinGame;
