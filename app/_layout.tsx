import { Stack } from 'expo-router'
import { UserProvider } from './context/UserContext'
import { View, StyleSheet } from 'react-native'

export default function RootLayout() {
  return (
    <UserProvider>
        <View style={[styles.root]}>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </View>
    </UserProvider>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
})
