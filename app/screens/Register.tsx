"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
} from "react-native"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { db, auth } from "../config/firebaseConfig"
import { doc, setDoc } from "firebase/firestore"
import * as Location from "expo-location"
import { router } from "expo-router"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"

const { width, height } = Dimensions.get("window")
const STATUSBAR_HEIGHT = StatusBar.currentHeight || 0

const Register = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [nombre, setNombre] = useState("")
  const [confirmarContraseña, setConfirmarContraseña] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Estados para validación
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [nombreError, setNombreError] = useState("")
  const [confirmPasswordError, setConfirmPasswordError] = useState("")
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false)

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

  const validateNombre = (nombre: string) => {
    if (!nombre) {
      setNombreError("El nombre es requerido")
      return false
    } else if (nombre.length < 3) {
      setNombreError("El nombre debe tener al menos 3 caracteres")
      return false
    }
    setNombreError("")
    return true
  }

  const validateConfirmPassword = (confirmarContraseña: string) => {
    if (!confirmarContraseña) {
      setConfirmPasswordError("Debes confirmar la contraseña")
      return false
    } else if (confirmarContraseña !== password) {
      setConfirmPasswordError("Las contraseñas no coinciden")
      return false
    }
    setConfirmPasswordError("")
    return true
  }

  const handleRegister = async () => {
    Keyboard.dismiss()

    // Validar todos los campos
    const isEmailValid = validateEmail(email)
    const isPasswordValid = validatePassword(password)
    const isNombreValid = validateNombre(nombre)
    const isConfirmPasswordValid = validateConfirmPassword(confirmarContraseña)

    if (!isEmailValid || !isPasswordValid || !isNombreValid || !isConfirmPasswordValid) {
      return
    }

    setLoading(true)

    try {
      // Obtener ubicación
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        setLocationPermissionDenied(true)
        setLoading(false)
        Alert.alert(
          "Permiso denegado",
          "Se necesita acceso a tu ubicación para asignar una zona. ¿Deseas continuar sin ubicación?",
          [
            {
              text: "Cancelar",
              style: "cancel",
            },
            {
              text: "Continuar sin ubicación",
              onPress: () => handleRegisterWithoutLocation(),
            },
          ],
        )
        return
      }

      await completeRegistration()
    } catch (err) {
      setLoading(false)
      console.error(err)
      Alert.alert("Error al registrar", (err as Error).message || "Intenta de nuevo.")
    }
  }

  const handleRegisterWithoutLocation = async () => {
    setLoading(true)
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password)
      const uid = userCred.user.uid

      await setDoc(doc(db, "usuarios", uid), {
        uid,
        email,
        nombre,
        zona: "No especificada",
        createdAt: new Date(),
      })

      setLoading(false)
      Alert.alert(
        "Registro exitoso",
        "Tu cuenta ha sido creada sin información de ubicación. Puedes actualizarla más tarde en tu perfil.",
        [
          {
            text: "Ir a inicio de sesión",
            onPress: () => router.push("/screens/Login"),
          },
        ],
      )
    } catch (err) {
      setLoading(false)
      console.error(err)
      Alert.alert("Error al registrar", (err as Error).message || "Intenta de nuevo.")
    }
  }

  const completeRegistration = async () => {
    try {
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

      setLoading(false)
      Alert.alert("Registro exitoso", `Tu cuenta ha sido creada correctamente.\nZona asignada: ${zona}`, [
        {
          text: "Ir a inicio de sesión",
          onPress: () => router.push("/screens/Login"),
        },
      ])
    } catch (err) {
      setLoading(false)
      console.error(err)
      Alert.alert("Error al registrar", (err as Error).message || "Intenta de nuevo.")
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.headerContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="shield-checkmark" size={50} color="#007AFF" />
              </View>
              <Text style={styles.appName}>Mapa del Crimen</Text>
              <Text style={styles.appTagline}>Crea tu cuenta para comenzar</Text>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.title}>Registro</Text>

              {/* Nombre completo */}
              <View style={styles.inputContainer}>
                <View style={styles.iconContainer}>
                  <MaterialIcons name="person" size={20} color="#666" />
                </View>
                <TextInput
                  placeholder="Nombre completo"
                  style={styles.input}
                  value={nombre}
                  onChangeText={(text) => {
                    setNombre(text)
                    if (nombreError) validateNombre(text)
                  }}
                  placeholderTextColor="#999"
                />
              </View>
              {nombreError ? <Text style={styles.errorText}>{nombreError}</Text> : null}

              {/* Email */}
              <View style={styles.inputContainer}>
                <View style={styles.iconContainer}>
                  <MaterialIcons name="email" size={20} color="#666" />
                </View>
                <TextInput
                  placeholder="Email"
                  style={styles.input}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text)
                    if (emailError) validateEmail(text)
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
              </View>
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

              {/* Contraseña */}
              <View style={styles.inputContainer}>
                <View style={styles.iconContainer}>
                  <MaterialIcons name="lock" size={20} color="#666" />
                </View>
                <TextInput
                  placeholder="Contraseña"
                  style={styles.input}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text)
                    if (passwordError) validatePassword(text)
                  }}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#666" />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : (
                <Text style={styles.helperText}>La contraseña debe tener al menos 6 caracteres</Text>
              )}

              {/* Confirmar contraseña */}
              <View style={styles.inputContainer}>
                <View style={styles.iconContainer}>
                  <MaterialIcons name="lock" size={20} color="#666" />
                </View>
                <TextInput
                  placeholder="Repetir contraseña"
                  style={styles.input}
                  value={confirmarContraseña}
                  onChangeText={(text) => {
                    setConfirmarContraseña(text)
                    if (confirmPasswordError) validateConfirmPassword(text)
                  }}
                  secureTextEntry={!showConfirmPassword}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#666" />
                </TouchableOpacity>
              </View>
              {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}

              {/* Información de ubicación */}
              <View style={styles.locationInfoContainer}>
                <Ionicons name="location" size={20} color="#666" />
                <Text style={styles.locationInfoText}>
                  Se solicitará acceso a tu ubicación para asignar tu zona de seguridad
                </Text>
              </View>

              {/* Botón de registro */}
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={styles.loadingText}>Creando tu cuenta...</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.registerButton} onPress={handleRegister} activeOpacity={0.8}>
                  <Text style={styles.registerButtonText}>Crear cuenta</Text>
                </TouchableOpacity>
              )}

              {/* Separador */}
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>o</Text>
                <View style={styles.divider} />
              </View>

              {/* Botón de inicio de sesión */}
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => router.push("/screens/Login")}
                activeOpacity={0.8}
              >
                <Text style={styles.loginButtonText}>¿Ya tienes cuenta? Inicia sesión</Text>
              </TouchableOpacity>
            </View>

            {/* Términos y condiciones */}
            <Text style={styles.termsText}>
              Al registrarte, aceptas nuestros <Text style={styles.termsLink}>Términos y Condiciones</Text> y{" "}
              <Text style={styles.termsLink}>Política de Privacidad</Text>
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  )
}

export default Register

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? STATUSBAR_HEIGHT : 0,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  headerContainer: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 30,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
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
    fontSize: 24,
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
    width: "100%",
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
  helperText: {
    color: "#666",
    fontSize: 12,
    marginLeft: 12,
    marginBottom: 12,
  },
  locationInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f8ff",
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
  },
  locationInfoText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    flex: 1,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },
  registerButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  registerButtonText: {
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
  loginButton: {
    borderWidth: 1,
    borderColor: "#007AFF",
    backgroundColor: "transparent",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  termsText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 24,
  },
  termsLink: {
    color: "#007AFF",
    fontWeight: "500",
  },
})
