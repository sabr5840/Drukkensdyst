import React, { useEffect, useState } from "react";
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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [imageChanged, setImageChanged] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await AsyncStorage.getItem("user");

      if (userData) {
        const user = JSON.parse(userData);
        setName(user.name);
        setProfileImage(user.profileImage);
      }
    };

    loadUser();
  }, []);

  const handleImageSelection = () => {
    Alert.alert(
      "Vælg billede",
      "Vil du tage et billede med kameraet eller vælge et billede fra biblioteket?",
      [
        { text: "Kamera", onPress: handleCamera },
        { text: "Billede bibliotek", onPress: handleImagePicker },
        { text: "Annuller", style: "cancel" },
      ]
    );
  };

  const handleCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Adgang til kamera er påkrævet!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setProfileImage(result.assets[0].uri);
      setImageChanged(true);
    }
  };

  const handleImagePicker = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Adgang til billedbiblioteket er påkrævet!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setProfileImage(result.assets[0].uri);
      setImageChanged(true);
    }
  };

  const uploadProfileImage = async (imageUri) => {
    if (!imageUri) return null;

    const formData = new FormData();

    formData.append("image", {
      uri: imageUri,
      name: "profile.jpg",
      type: "image/jpeg",
    });

    const response = await fetch("http://10.0.0.28:3000/upload-profile-image", {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const data = await response.json();
    return data.imageUrl;
  };

  const handleSaveProfile = async () => {
    if (!name.trim() || !profileImage) {
      Alert.alert("Udfyld navn og vælg billede");
      return;
    }

    try {
      const finalImageUrl = imageChanged
        ? await uploadProfileImage(profileImage)
        : profileImage;

      const userData = {
        name: name.trim(),
        profileImage: finalImageUrl,
      };

      await AsyncStorage.setItem("user", JSON.stringify(userData));

      navigation.navigate("Home");
    } catch (err) {
      console.error("Fejl ved opdatering af profil:", err);
      Alert.alert("Noget gik galt. Prøv igen.");
    }
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

        <View style={styles.content}>
          <Text style={styles.subTitle}>Rediger dit navn</Text>

          <TextInput
            style={styles.input}
            placeholder="Dit navn..."
            placeholderTextColor="#137ec56e"
            value={name}
            onChangeText={setName}
            textAlign="center"
          />

          <Text style={styles.subTitle}>Rediger profilbillede</Text>

          <TouchableOpacity onPress={handleImageSelection}>
            <Image
              source={
                profileImage
                  ? { uri: profileImage }
                  : require("../../assets/kamera.png")
              }
              style={styles.profileImage}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleSaveProfile}>
            <Text style={styles.buttonText}>Gem ændringer</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Home")}>
            <Text style={styles.backText}>Tilbage</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditProfileScreen;

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
    paddingTop: 60,
    paddingBottom: 45,
  },
  logo: {
    width: 330,
    height: 180,
    resizeMode: "contain",
    marginBottom: 65,
  },
  content: {
    width: "100%",
    alignItems: "center",
  },
  subTitle: {
    fontSize: 20,
    color: "#137DC5",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    marginTop: -35,
  },
  input: {
    width: "100%",
    maxWidth: 300,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 30,
    backgroundColor: "#e8e5fc",
    fontSize: 20,
    color: "#137ec56e",
    fontWeight: "bold",
    marginBottom: 90,
  },
  profileImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#e8e5fc",
    marginBottom: 45,
  },
  button: {
    width: 250,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: "#137DC5",
    marginBottom: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  backText: {
    color: "#137DC5",
    fontSize: 18,
    fontWeight: "bold",
  },
});