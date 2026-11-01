
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path } from "react-native-svg";

const COLORS = {
  background: "#f8f3ef",
  navy: "#0b2250",
  lightBlue: "#dbe6f1",
  muted: "#647594",
  white: "#ffffff",
};

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

const Home = () => {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();

  const [profileImage, setProfileImage] = useState(null);
  const [userName, setUserName] = useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadUser = async () => {
        try {
          const userData = await AsyncStorage.getItem("user");

          if (userData && active) {
            const user = JSON.parse(userData);

            setProfileImage(user.profileImage || null);
            setUserName(user.name || "");
          }
        } catch (error) {
          console.error("Kunne ikke hente bruger:", error);
        }
      };

      loadUser();

      return () => {
        active = false;
      };
    }, [])
  );

  const handleCreateGame = () => {
    navigation.navigate("Lobby", {
      isHost: true,
    });
  };

  const handleJoinGame = () => {
    navigation.navigate("JoinGame");
  };

  const handleEditProfile = () => {
    navigation.navigate("EditProfile");
  };

  const imageUri = getProfileImageUri(profileImage);

  return (
    <View style={styles.container}>
      {/* Baggrundsformer */}
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

        {/* Knapper og profil */}
        <View style={styles.mainContent}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleCreateGame}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>
              Opret spil
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={handleJoinGame}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>
              Join spil
            </Text>
          </TouchableOpacity>

          {/* Profil */}
          <TouchableOpacity
            style={styles.profileButton}
            onPress={handleEditProfile}
            activeOpacity={0.85}
          >
            <View style={styles.profileImageContainer}>
              <Image
                source={
                  imageUri
                    ? { uri: imageUri }
                    : require("../../assets/kamera.png")
                }
                style={[
                  styles.profileImage,
                  !imageUri && styles.cameraImage,
                ]}
                resizeMode={imageUri ? "cover" : "contain"}
                onError={(error) => {
                  console.log(
                    "Fejl ved indlæsning af profilbillede:",
                    error.nativeEvent.error
                  );
                }}
              />
            </View>

            <Text style={styles.userName}>
              {userName || "Brugernavn"}
            </Text>

            <Text style={styles.editProfileText}>
              Rediger profil
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
    minHeight: 440,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 35,
    paddingBottom: 30,
  },

  button: {
    width: "100%",
    maxWidth: 320,
    height: 64,
    borderRadius: 35,
    backgroundColor: COLORS.navy,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 22,
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

  profileButton: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
  },

  profileImageContainer: {
    width: 135,
    height: 135,
    borderRadius: 68,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 3,
    borderColor: COLORS.white,
  },

  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 68,
  },

  cameraImage: {
    width: 85,
    height: 85,
  },

  userName: {
    color: COLORS.navy,
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 17,
  },

  editProfileText: {
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
  },
});

export default Home;
