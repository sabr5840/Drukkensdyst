
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
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

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();

  const [name, setName] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [imageChanged, setImageChanged] = useState(false);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadUser = async () => {
        try {
          const userData = await AsyncStorage.getItem("user");

          if (userData && active) {
            const user = JSON.parse(userData);

            setName(user.name || "");
            setProfileImage(user.profileImage || null);
            setImageChanged(false);
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

  const handleCamera = async () => {
    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Adgang til kamera er påkrævet");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setProfileImage(result.assets[0].uri);
        setImageChanged(true);
      }
    } catch (error) {
      console.error("Kamerafejl:", error);
      Alert.alert("Kunne ikke åbne kameraet");
    }
  };

  const handleImagePicker = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Adgang til billeder er påkrævet");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setProfileImage(result.assets[0].uri);
        setImageChanged(true);
      }
    } catch (error) {
      console.error("Billedbiblioteksfejl:", error);
      Alert.alert("Kunne ikke åbne billedbiblioteket");
    }
  };

  const handleImageSelection = () => {
    Alert.alert(
      "Vælg profilbillede",
      "Hvordan vil du vælge dit billede?",
      [
        {
          text: "Tag billede",
          onPress: handleCamera,
        },
        {
          text: "Vælg fra bibliotek",
          onPress: handleImagePicker,
        },
        {
          text: "Annuller",
          style: "cancel",
        },
      ]
    );
  };

  const uploadProfileImage = async (imageUri) => {
    if (!imageUri) return null;

    const result = await FileSystem.uploadAsync(
      `${API_URL}/upload-profile-image`,
      imageUri,
      {
        fieldName: "image",
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        mimeType: "image/jpeg",
      }
    );

    if (result.status < 200 || result.status >= 300) {
      throw new Error(`Billedupload fejlede: ${result.status}`);
    }

    const data = JSON.parse(result.body);

    if (!data.imageUrl) {
      throw new Error("Serveren returnerede ingen billedadresse");
    }

    return data.imageUrl;
  };

  const handleSaveProfile = async () => {
    if (saving) return;

    if (!name.trim()) {
      Alert.alert("Du skal indtaste dit navn");
      return;
    }

    if (!profileImage) {
      Alert.alert("Du skal vælge et profilbillede");
      return;
    }

    setSaving(true);

    try {
      const finalImageUrl = imageChanged
        ? await uploadProfileImage(profileImage)
        : profileImage;

      const oldUserData = await AsyncStorage.getItem("user");
      const oldUser = oldUserData ? JSON.parse(oldUserData) : {};

      const updatedUser = {
        ...oldUser,
        name: name.trim(),
        profileImage: finalImageUrl,
      };

      await AsyncStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      setImageChanged(false);
      navigation.navigate("Home");
    } catch (error) {
      console.error("Fejl ved opdatering af profil:", error);

      Alert.alert(
        "Noget gik galt",
        "Profilen kunne ikke gemmes. Prøv igen."
      );
    } finally {
      setSaving(false);
    }
  };

  const imageUri = getProfileImageUri(profileImage);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
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

        {/* Hovedindhold */}
        <View style={styles.mainContent}>
          <Blob
            width={width * 0.98}
            height={width * 1.04}
            rotation={-8}
            style={styles.centerBlob}
          />

          <View style={styles.content}>
            {/* Navn - rykket 20 px ned */}
            <View style={styles.nameSection}>
              <Text style={styles.heading}>
                Rediger dit navn
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Dit navn..."
                placeholderTextColor={COLORS.muted}
                value={name}
                onChangeText={setName}
                textAlign="center"
                autoCapitalize="words"
                maxLength={30}
              />
            </View>

            {/* Profilbillede */}
            <Text style={styles.profileHeading}>
              Rediger profilbillede
            </Text>

            <TouchableOpacity
              style={styles.profileButton}
              onPress={handleImageSelection}
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
                    console.log("Billedadresse:", imageUri);
                  }}
                />
              </View>
            </TouchableOpacity>

            <Text style={styles.profileHint}>
              Tryk for at ændre dit billede
            </Text>

            {/* Gem ændringer */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                saving && styles.disabledButton,
              ]}
              onPress={handleSaveProfile}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.saveButtonText}>
                  Gem ændringer
                </Text>
              )}
            </TouchableOpacity>

            {/* Tilbage */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate("Home")}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Text style={styles.backText}>
                Tilbage
              </Text>
            </TouchableOpacity>
          </View>
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
    minHeight: 485,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 0,
  },

  centerBlob: {
    position: "absolute",
    alignSelf: "center",
    top: "5%",
  },

  content: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 35,
    paddingVertical: 12,
  },

  nameSection: {
    width: "100%",
    alignItems: "center",
    marginTop: 20,
    marginBottom: -20,
  },

  heading: {
    color: COLORS.navy,
    fontSize: 25,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 22,
  },

  input: {
    width: "85%",
    maxWidth: 310,
    height: 62,
    borderRadius: 35,
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    fontSize: 21,
    fontWeight: "700",
    color: COLORS.navy,
    textAlign: "center",
    marginBottom: 48,
    shadowColor: COLORS.navy,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 3,
  },

  profileHeading: {
    color: COLORS.navy,
    fontSize: 25,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 23,
  },

  profileButton: {
    alignItems: "center",
    shadowColor: COLORS.navy,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },

  profileImageContainer: {
    width: 135,
    height: 135,
    borderRadius: 68,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 2,
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

  profileHint: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: "center",
    marginTop: 15,
    marginBottom: 42,
  },

  saveButton: {
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

  disabledButton: {
    opacity: 0.65,
  },

  saveButtonText: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },

  backButton: {
    marginTop: 19,
    padding: 10,
  },

  backText: {
    color: COLORS.navy,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
});

export default EditProfileScreen;
