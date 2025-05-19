import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import * as Location from 'expo-location'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '../config/firebaseConfig' // Asegurate de que este path sea correcto
import { useLocalSearchParams } from 'expo-router'

const PanicScreen = () => {
  const params = useLocalSearchParams()
  const zona = typeof params.zona === 'string' ? params.zona : 'zona_default'
  const userParsed =
    typeof params.user === 'string' ? JSON.parse(params.user) : null

  const [enviado, setEnviado] = useState(false)
  const [cargando, setCargando] = useState(false)

  const activarAlerta = async () => {
    try {
      setCargando(true)

      // Obtener ubicación
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        alert('Permiso de ubicación denegado')
        return
      }

      const location = await Location.getCurrentPositionAsync({})
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`

      // Enviar mensaje al chat
      await addDoc(collection(db, 'chats', zona, 'mensajes'), {
        _id: Date.now().toString(),
        text: `🚨 ¡ALERTA DE PÁNICO! 🚨
      Ubicación: (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})
      Usuario: ${userParsed.name}
      📍 Google Maps: ${mapsUrl}`, // ✅ Esto sí es clickeable
        createdAt: new Date(),
        user: {
          _id: userParsed.id,
          name: userParsed.name,
        },
        tipo: 'panico',
        location: coords,
      })

      setEnviado(true)
    } catch (err) {
      console.error('Error al enviar alerta:', err)
      alert('Ocurrió un error al enviar la alerta.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <View style={styles.container}>
      {enviado ? (
        <>
          <Text style={styles.alerta}>🚨 Alerta enviada 🚨</Text>
          <Text style={styles.sub}>
            Tu ubicación fue compartida con tu zona.
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.text}>¿Deseás activar el botón de pánico?</Text>
          <TouchableOpacity
            style={styles.boton}
            onPress={activarAlerta}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color='white' />
            ) : (
              <Text style={styles.botonText}>Sí, activar alerta</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  )
}

export default PanicScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffe5e5',
    padding: 20,
  },
  text: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    color: '#990000',
  },
  alerta: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'red',
    textAlign: 'center',
  },
  sub: {
    fontSize: 16,
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
  },
  boton: {
    backgroundColor: 'red',
    padding: 16,
    borderRadius: 10,
    marginTop: 10,
  },
  botonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
})
