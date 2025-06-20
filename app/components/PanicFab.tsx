// components/PanicFAB.tsx
import React from 'react'
import { TouchableOpacity, StyleSheet, Text } from 'react-native'
import { router } from 'expo-router'

const PanicFAB = ({
  zona,
  user,
}: {
  zona: string
  user: { id: string; name: string }
}) => {
  const handlePress = () => {
    router.push({
      pathname: '/screens/PanicScreen',
      params: {
        zona,
        user: JSON.stringify(user),
      },
    })
  }

  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={handlePress}
      accessibilityLabel='Botón de pánico'
      accessibilityHint='Toca dos veces para enviar una alerta de emergencia con tu ubicación'
      accessibilityRole='button'
    >
      <Text style={styles.text}>SOS</Text>
    </TouchableOpacity>
  )
}

export default PanicFAB

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: 'red',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    zIndex: 99,
  },
  text: {
    color: 'white',
    fontSize: 30,
  },
})
