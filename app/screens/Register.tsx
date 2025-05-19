import React, { useState } from "react"
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from "react-native"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { db, auth } from "../config/firebaseConfig"
import { doc, setDoc } from "firebase/firestore"
import * as Location from "expo-location"
import { router } from "expo-router"

const Register = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [nombre, setNombre] = useState("")
  const [confirmarContraseña, setConfirmarContraseña] = useState("")

  const handleRegister = async () => {
    if (password !== confirmarContraseña) {
      Alert.alert('Contraseñas no coinciden')
      return
    }
    try {
      // ✅ Obtener ubicación
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Se necesita ubicación para asignar una zona.")
        return
      }

      const location = await Location.getCurrentPositionAsync({})
      const geo = await Location.reverseGeocodeAsync(location.coords)
      const ciudad = geo[0]?.city || "ciudad_desconocida"
      const barrio = geo[0]?.district || "zona_desconocida"
      const zona = `${ciudad} - ${barrio}`

      const userCred = await createUserWithEmailAndPassword(auth, email, password)
      const uid = userCred.user.uid

      await setDoc(doc(db, "usuarios", uid), {
        uid,
        email,
        nombre,
        zona,
        latitud: location.coords.latitude,
        longitud: location.coords.longitude,
        createdAt: new Date(),
      })

      Alert.alert("Registro exitoso", `Zona asignada: ${zona}`)
    } catch (err) {
      console.error(err)
      Alert.alert("Error al registrar", (err as Error).message || "Intenta de nuevo.")
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro</Text>
      <TextInput placeholder="Nombre completo" style={styles.input} onChangeText={setNombre} />
      <TextInput placeholder="Email" style={styles.input} onChangeText={setEmail} keyboardType="email-address" />
      <TextInput placeholder="Contraseña" style={styles.input} secureTextEntry onChangeText={setPassword} />
      <TextInput placeholder="Repetir contraseña" style={styles.input} secureTextEntry onChangeText={setConfirmarContraseña} />
      <TouchableOpacity style={styles.boton} onPress={handleRegister}>
        <Text style={styles.botonTexto}>Registrarse</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.boton} onPress={() => router.push('/screens/Login')}>
        <Text style={styles.botonTexto}>Iniciar sesión</Text>
      </TouchableOpacity>
    </View>
  )
}

export default Register

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, justifyContent: 'center', alignContent: 'center' },
  title: { fontSize: 22, marginBottom: 16 },
  input: { borderBottomWidth: 1, marginBottom: 12, padding: 8 },
  boton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  botonTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
})
