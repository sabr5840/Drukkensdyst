import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Home = () => {
  const navigation = useNavigation();
  const [profileImage, setProfileImage] = useState(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      const userData = await AsyncStorage.getItem("user");

      if (userData) {
        const user = JSON.parse(userData);
        setProfileImage(user.profileImage);
        setUserName(user.name);
      }
    };

    loadUser();
  }, []);

  const handleCreateGame = () => {
    navigation.navigate("Lobby", {
      isHost: true,
    });
  };

  const handleJoinGame = () => {
    navigation.navigate("JoinGame");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require("../../assets/logo.png")} style={styles.logo} />
      </View>

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.button} onPress={handleCreateGame}>
          <Text style={styles.buttonText}>Opret spil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleJoinGame}>
          <Text style={styles.buttonText}>Join spil</Text>
        </TouchableOpacity>

        {profileImage && (
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        )}

        <Text style={styles.subTitle}>{userName || "Bruger navn"}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e1e0e4",
  },
  header: {
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 40,
    marginBottom: -90,
  },
  logo: {
    width: 350,
    height: 200,
    resizeMode: "contain",
  },
  inputContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    width: 250,
    padding: 15,
    marginVertical: 15,
    borderRadius: 30,
    backgroundColor: "#e8e5fc",
  },
  buttonText: {
    fontSize: 20,
    color: "#137DC5",
    textAlign: "center",
    fontWeight: "bold",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e8e5fc",
    marginVertical: 15,
  },
  subTitle: {
    fontSize: 25,
    color: "#137DC5",
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
  },
});

export default Home;