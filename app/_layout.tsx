import { Stack } from 'expo-router'
import { UserProvider } from './context/UserContext'
import { ThemeProvider } from './context/ThemeContext'
import { View, StyleSheet } from 'react-native'
import { useTheme } from './context/ThemeContext'

export default function RootLayout() {
  const { theme } = useTheme()
  console.log(theme)
  return (
    <UserProvider>
      <ThemeProvider>
        <View style={[styles.root, { backgroundColor: theme.background }]}>
          <Stack
            screenOptions={{
              headerShown: false,
              headerStyle: { backgroundColor: theme.background },
            }}
          />
        </View>
      </ThemeProvider>
    </UserProvider>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
})
