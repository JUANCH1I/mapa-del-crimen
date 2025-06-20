import AsyncStorage from '@react-native-async-storage/async-storage'

export const checkFirstTime = async () => {
  const yaVisto = await AsyncStorage.getItem('tutorial_mostrado')
  return !yaVisto
}

export const marcarTutorialVisto = async () => {
  await AsyncStorage.setItem('tutorial_mostrado', 'true')
}
