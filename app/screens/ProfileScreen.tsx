import React from 'react'
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Button,
  Alert,
} from 'react-native'
import { useUser } from '../context/UserContext'
import { useTheme } from '../context/ThemeContext'

const ProfileScreen = () => {
  const { user, cargando, logout } = useUser()
  const { isDark, toggle } = useTheme()

  const handleLogout = async () => {
    try {
      await logout()
      Alert.alert('Sesión cerrada')
    } catch (e) {
      console.error('Error al cerrar sesión', e)
      Alert.alert('Error al cerrar sesión')
    }
  }

  if (cargando) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size='large' color='#007AFF' />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    )
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>⚠️ No estás logueado</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Zona actual:</Text>
      <Text style={styles.value}>{user.zona}</Text>

      <Text style={styles.label}>Nombre:</Text>
      <Text style={styles.value}>{user.nombre}</Text>

      <Text style={styles.label}>Correo:</Text>
      <Text style={styles.value}>{user.email}</Text>
      <View style={styles.themeButton}>
        <Button
          title={`Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`}
          onPress={toggle}
          color={isDark ? '#aaa' : '#333'}
        />
      </View>

      <View style={styles.logoutButton}>
        <Button title='Cerrar sesión' onPress={handleLogout} color='#cc0000' />
      </View>
    </View>
  )
}

export default ProfileScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f4f4f4',
    justifyContent: 'center',
  },
  themeButton: {
    marginTop: 20,
  },  
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    color: '#333',
  },
  value: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    fontSize: 18,
    color: '#cc0000',
    textAlign: 'center',
  },
  logoutButton: {
    marginTop: 30,
  },
})
