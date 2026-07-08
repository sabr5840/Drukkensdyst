import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";

const IntroScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Container for image and title */}
      <View style={styles.header}>
        {/* Billede */}
        <Image
          source={require("../../assets/logo.png")}
          style={styles.image}
        />
        {/* Titel */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Velkommen</Text>
          <Text style={styles.title1}>Drukkens Dyst</Text>
        </View>
      </View>

      <Text style={styles.description}>
        <Text style={styles.boldText}>
          Klar til at tage dine fester til næste niveau? {"\n\n"}
        </Text>
        <Text style={styles.boldText}>Drukkens Dyst</Text> er et sjovt, udfordrende og konkurrencepræget drukspil, 
        hvor du og dine venner dyster i vanvittige udfordringer, quizzer og drikkelege! {"\n\n"}
        Spillet kræver mindst 2 spillere og kan max have 15 spillere og spilles med selskabets mobiler. {"\n\n"}
        <Text style={styles.boldText}>
          Lad dysten begynde – er du klar?
        </Text>
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("CreateUser")}
      >
        <Text style={styles.buttonText}>Kom igang</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e1e0e4",
    padding: 20,
  },
  header: {
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 30, 
  },
  image: {
    width: 80, 
    height: 80, 
    marginRight: 5, 
    marginTop: 30,
  },
  titleContainer: {
    justifyContent: 'center', 
    alignItems: 'flex-start', 
  },
  title: {
    fontSize: 35,
    fontWeight: "bold",
    color: "#e8e5fc",
    marginTop: 25,
    marginLeft: 15,
  },
  boldText: {
    fontWeight: "bold",
  },
  title1: {
    fontSize: 35,
    fontWeight: "bold",
    color: "#e8e5fc",
    marginRight: 30,
  },
  description: {
    fontSize: 22,
    color: "#137DC5",
    textAlign: "center",
    marginTop: 50,
  },
  button: {
    backgroundColor: "#e8e5fc",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 100,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#137DC5",
  },
});

export default IntroScreen;
