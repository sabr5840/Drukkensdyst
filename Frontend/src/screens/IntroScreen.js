import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const IntroScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
    <Image
      source={require("../../assets/logo.png")}
      style={styles.logo}
    />
    <Text style={styles.description}>
      Grin, konkurrér og skål jer gennem en aften fyldt med{" "}
      <Text style={styles.highlight}>udfordringer</Text>,{" "}
      <Text style={styles.highlight}>drukspil</Text> og{" "}
      <Text style={styles.highlight}>uventede twists</Text>.

      {"\n\n"}

      Spillet spilles med alles telefoner og kræver mindst{" "}
      <Text style={styles.playerHighlight}>2 spillere</Text>.
      {"\n"}
      Der kan deltage op til{" "}
      <Text style={styles.playerHighlight}>15 spillere</Text>.

      {"\n\n"}

      <Text style={styles.finalText}>
        Kun én kan blive aftenens fuldeste –
        {"\n"}
        er du klar til dysten?
      </Text>
    </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("CreateUser")}
      >
        <Text style={styles.buttonText}>Kom i gang</Text>
      </TouchableOpacity>
    </View>
  );
};

export default IntroScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e1e0e4",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,

  },

  logo: {
    width: 330,
    height: 180,
    resizeMode: "contain",
    marginBottom: 45,
  },

  boldText: {
    fontWeight: "bold",
  },

  button: {
    width: 250,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: "#137DC5",
  },

  buttonText: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },

  description: {
    fontSize: 18,
    color: "#137DC5",
    textAlign: "center",
    lineHeight: 34,
    marginBottom: 25,
    marginTop: -35,
  },

  highlight: {
    color: "#137DC5",
    fontWeight: "bold",
  },

  playerHighlight: {
    color: "#137DC5",
    fontWeight: "bold",
  },

  finalText: {
    color: "#137DC5",
    fontWeight: "bold",
  },
});