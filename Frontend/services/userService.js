// services/userService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const savePlayer = async (playerData) => {
  try {
    await AsyncStorage.setItem('player', JSON.stringify(playerData));
  } catch (e) {
    console.error('Kunne ikke gemme spiller:', e);
  }
};

export const getPlayer = async () => {
  try {
    const json = await AsyncStorage.getItem('player');
    return json != null ? JSON.parse(json) : null;
  } catch (e) {
    console.error('Kunne ikke hente spiller:', e);
    return null;
  }
};
