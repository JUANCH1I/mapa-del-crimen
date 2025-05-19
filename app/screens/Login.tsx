import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { db, auth } from '../config/firebaseConfig'
import { doc, getDoc } from 'firebase/firestore'
import { useUser } from '../context/UserContext'
import { router } from 'expo-router'

const Login = () => {
  const { setUser } = useUser()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    try {
      setLoading(true)
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )
      const userFirebase = userCredential.user

      // Obtener datos del usuario desde Firestore
      const ref = doc(db, 'usuarios', userFirebase.uid)
      const snap = await getDoc(ref)
      const data = snap.data()

      if (!data) {
        alert('No se encontró información del usuario')
        return
      }

      // Setear en el contexto
      setUser({
        uid: userFirebase.uid,
        email: userFirebase.email || '',
        nombre: data.nombre || 'Anónimo',
        zona: data.zona || 'zona_default',
        token_notification: data.token_notification,
      })

      // Redirigir a pantalla principal
      router.replace('../components/ui/BottomNavbar')
    } catch (err) {
      setLoading(false)
      console.error('Error al iniciar sesión', err)
      alert('Correo o contraseña incorrectos.')
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar sesión</Text>
      <TextInput
        placeholder='Email'
        style={styles.input}
        onChangeText={setEmail}
        keyboardType='email-address'
        autoCapitalize='none'
      />
      <TextInput
        placeholder='Contraseña'
        style={styles.input}
        secureTextEntry
        onChangeText={setPassword}
      />
      {loading ? (
        <ActivityIndicator size='large' color='#007AFF' />
      ) : (
        <TouchableOpacity style={styles.boton} onPress={handleLogin}>
          <Text style={styles.botonTexto}>Entrar</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={styles.boton}
        onPress={() => router.push('/screens/Register')}
      >
        <Text style={styles.botonTexto}>Registrarse</Text>
      </TouchableOpacity>
    </View>
  )
}

export default Login

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
    alignContent: 'center',
  },
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
