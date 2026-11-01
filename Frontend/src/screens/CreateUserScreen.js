
import React, { useState } from "react";
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
  useWindowDimensions,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import Svg, { Path } from "react-native-svg";

const COLORS = {
  background: "#fefcf9",
  navy: "#0b2250",
  shape: "#dbe7f2",
  field: "#ffffff",
  white: "#ffffff",
};

// Organisk, deform cirkel
const Blob = ({ width, height, style }) => (
  <View
    pointerEvents="none"
    style={[{ width, height }, style]}
  >
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 400 400"
      preserveAspectRatio="none"
    >
      <Path
        d="
          M 185 20
          C 240 5, 270 52, 320 52
          C 370 50, 380 88, 370 140
          C 360 195, 398 235, 380 280
          C 365 325, 310 328, 275 345
          C 230 370, 205 400, 155 375
          C 110 350, 65 340, 45 295
          C 20 250, 0 220, 25 175
          C 50 130, 55 85, 105 55
          C 135 35, 155 25, 185 20
          Z
        "
        fill={COLORS.shape}
      />
    </Svg>
  </View>
);

const CreateUserScreen = () => {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();

  const [name, setName] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleImageSelection = () => {
    Alert.alert(
      "Vælg billede",
      "Vil du tage et billede eller vælge et fra biblioteket?",
      [
        { text: "Kamera", onPress: handleCamera },
        {
          text: "Billedbibliotek",
          onPress: handleImagePicker,
        },
        { text: "Annuller", style: "cancel" },
      ]
    );
  };

  const handleCamera = async () => {
    const permission =
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Adgang til kamera er påkrævet!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleImagePicker = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Adgang til billedbiblioteket er påkrævet!"
      );
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 1,
      });

    if (!result.canceled && result.assets?.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const uploadProfileImage = async (imageUri) => {
    if (!imageUri) return null;

    const result = await FileSystem.uploadAsync(
      "http://172.20.10.2:3000/upload-profile-image",
      imageUri,
      {
        fieldName: "image",
        httpMethod: "POST",
        uploadType:
          FileSystem.FileSystemUploadType.MULTIPART,
        mimeType: "image/jpeg",
        parameters: {},
      }
    );

    if (result.status < 200 || result.status >= 300) {
      throw new Error(
        "Billedupload fejlede: " + result.status
      );
    }

    const data = JSON.parse(result.body);

    if (!data.imageUrl) {
      throw new Error(
        "Serveren returnerede ingen billedadresse"
      );
    }

    return data.imageUrl;
  };

  const handleCreateUser = async () => {
    if (isSaving) return;

    if (!name.trim() || !profileImage) {
      Alert.alert("Udfyld navn og vælg billede");
      return;
    }

    setIsSaving(true);

    try {
      const uploadedImageUrl =
        await uploadProfileImage(profileImage);

      const userData = {
        name: name.trim(),
        profileImage: uploadedImageUrl,
      };

      await AsyncStorage.setItem(
        "user",
        JSON.stringify(userData)
      );

      navigation.navigate("Home");
    } catch (err) {
      console.error("Fejl ved oprettelse:", err);
      Alert.alert("Noget gik galt. Prøv igen.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={
        Platform.OS === "ios" ? "padding" : "height"
      }
    >
      <StatusBar barStyle="dark-content" />

      <View style={styles.screen}>
        {/* Øverste organiske form */}
        <Blob
          width={width * 0.53}
          height={height * 0.29}
          style={{
            position: "absolute",
            top: height * 0.015,
            right: -width * 0.30,
          }}
        />

        {/* Stor deform cirkel i midten */}
        <Blob
          width={width * 1.02}
          height={height * 0.46}
          style={{
            position: "absolute",
            top: height * 0.265,
            left: -width * 0.01,
          }}
        />

        {/* Nederste organiske form */}
        <Blob
          width={width * 0.45}
          height={height * 0.23}
          style={{
            position: "absolute",
            bottom: -height * 0.07,
            left: -width * 0.18,
          }}
        />

        <ScrollView
          contentContainerStyle={[
            styles.container,
            { minHeight: height },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <Image
            source={require("../../assets/logo-.png")}
            style={[
              styles.logo,
              { width: width * 0.90 },
            ]}
            resizeMode="contain"
          />

          {/* Navn */}
          <View style={styles.nameSection}>
            <Text style={styles.heading}>
              Hvad hedder du?
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Dit navn..."
              placeholderTextColor="#8794a9"
              value={name}
              onChangeText={setName}
              textAlign="center"
              autoCapitalize="words"
              maxLength={30}
              returnKeyType="done"
            />
          </View>

          {/* Profilbillede */}
          <View style={styles.photoSection}>
            <Text style={styles.heading}>
              Tilføj et profilbillede
            </Text>

            <TouchableOpacity
              style={styles.photoButton}
              onPress={handleImageSelection}
              activeOpacity={0.8}
            >
              <Image
                source={
                  profileImage
                    ? { uri: profileImage }
                    : require("../../assets/kamera.png")
                }
                style={[
                  styles.profileImage,
                  profileImage &&
                    styles.selectedProfileImage,
                ]}
                resizeMode={
                  profileImage ? "cover" : "contain"
                }
              />
            </TouchableOpacity>

            <Text style={styles.photoHint}>
              Tryk for at vælge et billede
            </Text>
          </View>

          {/* Kom i gang */}
          <TouchableOpacity
            style={[
              styles.button,
              isSaving && { opacity: 0.7 },
            ]}
            onPress={handleCreateUser}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator
                color={COLORS.white}
              />
            ) : (
              <Text style={styles.buttonText}>
                Kom i gang
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    overflow: "hidden",
  },

  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingTop: 70,
    paddingBottom: 65,
  },

  logo: {
    height: 185,
    marginBottom: 35,
  },

  nameSection: {
    width: "100%",
    alignItems: "center",
    marginBottom: 55,
  },

  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.navy,
    textAlign: "center",
    marginBottom: 20,
  },

  input: {
  width: "85%",
  maxWidth: 290,
    height: 60,
    borderRadius: 32,
    paddingHorizontal: 20,
    backgroundColor: COLORS.field,
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.navy,

    // Diskret skygge
    shadowColor: COLORS.navy,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.13,
    shadowRadius: 12,
    elevation: 5,
  },

  photoSection: {
    width: "100%",
    alignItems: "center",
    marginBottom: 60,
  },

  photoButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.field,
    justifyContent: "center",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "#e8edf3",

    // Skygge omkring profilbillede
    shadowColor: COLORS.navy,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 7,
  },

  profileImage: {
    width: 110,
    height: 110,
  },

  selectedProfileImage: {
    width: 148,
    height: 148,
    borderRadius: 74,
  },

  photoHint: {
    marginTop: 15,
    fontSize: 13,
    color: COLORS.navy,
    opacity: 0.7,
  },

  button: {
    width: "100%",
    maxWidth: 320,
    height: 62,
    borderRadius: 35,
    backgroundColor: COLORS.navy,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.white,
  },
});

export default CreateUserScreen;
