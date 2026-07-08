import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import CreateUserScreen from "./src/screens/CreateUserScreen";
import Home from "./src/screens/home";
import IntroScreen from "./src/screens/IntroScreen";
import JoinGame from "./src/screens/joinGame";
import LobbyScreen from "./src/screens/lobbyScreen";
import GameIntroScreen from "./src/screens/GameIntroScreen";
import GamePlayScreen from "./src/screens/GamePlayScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const userData = await AsyncStorage.getItem("user");
      setInitialRoute(userData ? "Home" : "CreateUser");
    };

    checkUser();
  }, []);

  if (initialRoute === null) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen
          name="CreateUser"
          component={CreateUserScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="Home"
          component={Home}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="Intro"
          component={IntroScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="JoinGame"
          component={JoinGame}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="Lobby"
          component={LobbyScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="GameIntro"
          component={GameIntroScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="GamePlay"
          component={GamePlayScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}