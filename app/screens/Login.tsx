"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native"
import { signInWithEmailAndPassword } from "firebase/auth"
import { db, auth } from "../config/firebaseConfig"
import { doc, getDoc } from "firebase/firestore"
import { useUser } from "../context/UserContext"
import { router } from "expo-router"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"

const { width, height } = Dimensions.get("window")

const Login = () => {
  const { setUser } = useUser()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      setEmailError("El email es requerido")
      return false
    } else if (!emailRegex.test(email)) {
      setEmailError("Ingresa un email válido")
      return false
    }
    setEmailError("")
    return true
  }

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError("La contraseña es requerida")
      return false
    } else if (password.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres")
      return false
    }
    setPasswordError("")
    return true
  }

  const handleLogin = async () => {
    Keyboard.dismiss()

    const isEmailValid = validateEmail(email)
    const isPasswordValid = validatePassword(password)

    if (!isEmailValid || !isPasswordValid) {
      return
    }

    try {
      setLoading(true)
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const userFirebase = userCredential.user

      // Obtener datos del usuario desde Firestore
      const ref = doc(db, "usuarios", userFirebase.uid)
      const snap = await getDoc(ref)
      const data = snap.data()

      if (!data) {
        setLoading(false)
        showError("No se encontró información del usuario")
        return
      }

      // Setear en el contexto
      setUser({
        uid: userFirebase.uid,
        email: userFirebase.email || "",
        nombre: data.nombre || "Anónimo",
        zona: data.zona || "zona_default",
        token_notification: data.token_notification,
      })

      // Redirigir a pantalla principal
      router.replace("../components/ui/BottomNavbar")
    } catch (err) {
      setLoading(false)
      console.error("Error al iniciar sesión", err)
      showError("Correo o contraseña incorrectos.")
    }
  }

  const showError = (message: string) => {
    // En una implementación real, podrías usar un toast o un componente de alerta más sofisticado
    alert(message)
  }


  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="shield-checkmark" size={60} color="#007AFF" />
            </View>
            <Text style={styles.appName}>Mapa del Crimen</Text>
            <Text style={styles.appTagline}>Tu seguridad, nuestra prioridad</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.title}>Iniciar sesión</Text>

            <View style={styles.inputContainer}>
              <View style={styles.iconContainer}>
                <MaterialIcons name="email" size={20} color="#666" />
              </View>
              <TextInput
                placeholder="Email"
                style={styles.input}
                onChangeText={(text) => {
                  setEmail(text)
                  if (emailError) validateEmail(text)
                }}
                value={email}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
            </View>
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

            <View style={styles.inputContainer}>
              <View style={styles.iconContainer}>
                <MaterialIcons name="lock" size={20} color="#666" />
              </View>
              <TextInput
                placeholder="Contraseña"
                style={styles.input}
                secureTextEntry={!showPassword}
                onChangeText={(text) => {
                  setPassword(text)
                  if (passwordError) validatePassword(text)
                }}
                value={password}
                placeholderTextColor="#999"
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#666" />
              </TouchableOpacity>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
              </View>
            ) : (
              <TouchableOpacity style={styles.loginButton} onPress={handleLogin} activeOpacity={0.8}>
                <Text style={styles.loginButtonText}>Iniciar sesión</Text>
              </TouchableOpacity>
            )}

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>O</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => router.push("/screens/Register")}
              activeOpacity={0.8}
            >
              <Text style={styles.registerButtonText}>Crear una cuenta nueva</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  )
}

export default Login

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f8ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 24,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#f9f9f9",
  },
  iconContainer: {
    padding: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: {
    padding: 12,
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 12,
    marginLeft: 12,
    marginBottom: 12,
  },
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: "#007AFF",
    fontSize: 14,
  },
  loadingContainer: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    color: "#999",
    paddingHorizontal: 16,
    fontSize: 14,
  },
  registerButton: {
    borderWidth: 1,
    borderColor: "#007AFF",
    backgroundColor: "transparent",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  registerButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
})
