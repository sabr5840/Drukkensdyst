import React, { useState, useRef, useEffect } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import socket from "../../services/socket";

const JoinGame = () => {
  const navigation = useNavigation();
  const [pin, setPin] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    socket.on("joinedGame", ({ gameId }) => {
      navigation.navigate("Lobby", {
        gameId,
        isHost: false,
      });
    });

    socket.on("gameError", (message) => {
      Alert.alert("Fejl", message);
    });

    return () => {
      socket.off("joinedGame");
      socket.off("gameError");
    };
  }, []);

  const handlePinChange = (text) => {
    const onlyNumbers = text.replace(/[^0-9]/g, "");
    setPin(onlyNumbers);
  };

  const handleJoinGame = async () => {
    if (pin.length !== 6) {
      Alert.alert("Fejl", "Indtast en 6-cifret festkode");
      return;
    }

    const userData = await AsyncStorage.getItem("user");
    const user = userData ? JSON.parse(userData) : null;

    if (!user) {
      navigation.navigate("CreateUser");
      return;
    }

    socket.emit("joinGame", {
      gameId: pin,
      name: user.name,
      profileImage: user.profileImage,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Image source={require("../../assets/logo.png")} style={styles.logo} />

        <Text style={styles.title}>Indtast festkode</Text>

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
                    pin.length === index && styles.activeUnderline,
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
            autoFocus
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleJoinGame}>
          <Text style={styles.buttonText}>Join spil</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <Text style={styles.backText}>Tilbage</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: "#e1e0e4",
  },

  container: {
    flexGrow: 1,
    backgroundColor: "#e1e0e4",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: 70,
    paddingBottom: 40,
  },

  logo: {
    width: 300,
    height: 160,
    resizeMode: "contain",
    marginBottom: 70,
  },

  title: {
    fontSize: 28,
    color: "#137DC5",
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    maxWidth: 330,
  },

  pinContainer: {
    width: "100%",
    maxWidth: 330,
    height: 100,
    backgroundColor: "#fff",
    borderRadius: 30,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    marginBottom: 30,
    shadowColor: "#555",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },

  pinBox: {
    alignItems: "center",
    justifyContent: "center",
  },

  pinNumber: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#555",
  },

  placeholderNumber: {
    color: "#bdbdbd",
  },

  underline: {
    marginTop: 8,
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#555",
  },

  activeUnderline: {
    backgroundColor: "#137DC5",
  },

  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },

  button: {
    width: 240,
    backgroundColor: "#137DC5",
    paddingVertical: 15,
    borderRadius: 30,
  },

  buttonText: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },

  backText: {
    marginTop: 28,
    fontSize: 18,
    color: "#137DC5",
    fontWeight: "bold",
  },
});

export default JoinGame;