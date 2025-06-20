"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native"
import * as Location from "expo-location"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from "../config/firebaseConfig"
import { CATEGORIAS } from "../constants/categoriasIncidentes"
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons"

const ReportScreen = () => {
  const [descripcion, setDescripcion] = useState("")
  const [categoria, setCategoria] = useState(CATEGORIAS[0])
  const [nombre, setNombre] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [formErrors, setFormErrors] = useState({
    descripcion: "",
  })

  const validateForm = () => {
    let isValid = true
    const errors = { descripcion: "" }

    if (!descripcion.trim()) {
      errors.descripcion = "Por favor ingresa una descripción del incidente"
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const enviarReporte = async () => {
    if (!validateForm()) {
      return
    }

    try {
      setEnviando(true)

      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        Alert.alert(
          "Permiso de ubicación denegado",
          "Necesitamos acceso a tu ubicación para reportar el incidente correctamente.",
          [{ text: "Entendido" }]
        )
        setEnviando(false)
        return
      }

      const ubicacion = await Location.getCurrentPositionAsync({})

      const reporte = {
        categoria,
        descripcion,
        nombre: nombre || "Anónimo",
        coords: {
          latitude: ubicacion.coords.latitude,
          longitude: ubicacion.coords.longitude,
        },
        fecha: serverTimestamp(),
        votos_confirmar: [],
        votos_negar: [],
      }

      // Confirmación
      Alert.alert(
        "Confirmar reporte",
        `¿Deseás reportar "${categoria}"?\n\nUbicación actual será usada.`,
        [
          { 
            text: "Cancelar", 
            style: "cancel", 
            onPress: () => setEnviando(false) 
          },
          {
            text: "Confirmar",
            style: "default",
            onPress: async () => {
              await addDoc(collection(db, "reportes"), reporte)
              Alert.alert(
                "✅ Reporte enviado", 
                "Gracias por tu colaboración. Tu reporte ayudará a mantener la comunidad más segura.",
                [
                  { 
                    text: "Ver en mapa", 
                    onPress: () => {
                      // Aquí podrías navegar al mapa
                      resetFormulario()
                    } 
                  },
                  { 
                    text: "Cerrar", 
                    onPress: () => resetFormulario() 
                  }
                ]
              )
            },
          },
        ]
      )
    } catch (e) {
      console.error("Error al enviar reporte:", e)
      Alert.alert(
        "Error al enviar el reporte",
        "Ha ocurrido un problema al enviar tu reporte. Por favor intenta nuevamente."
      )
    } finally {
      setEnviando(false)
    }
  }

  const resetFormulario = () => {
    setDescripcion("")
    setCategoria(CATEGORIAS[0])
    setNombre("")
    setFormErrors({ descripcion: "" })
  }

  const getCategoriaIcon = (cat) => {
    switch (cat) {
      case "Robo":
        return <MaterialIcons name="security" size={20} color={categoria === cat ? "#fff" : "#555"} />
      case "Asalto":
        return <FontAwesome name="warning" size={20} color={categoria === cat ? "#fff" : "#555"} />
      case "Acoso":
        return <MaterialIcons name="person-pin-circle" size={20} color={categoria === cat ? "#fff" : "#555"} />
      default:
        return <Ionicons name="alert-circle" size={20} color={categoria === cat ? "#fff" : "#555"} />
    }
  }

  const getCategoriaColor = (cat) => {
    switch (cat) {
      case "Robo":
        return categoria === cat ? "#e74c3c" : "#f8d7da"
      case "Asalto":
        return categoria === cat ? "#e67e22" : "#fff3cd"
      case "Acoso":
        return categoria === cat ? "#9b59b6" : "#e8d6f3"
      default:
        return categoria === cat ? "#3498db" : "#d1ecf1"
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea]}>
      <StatusBar />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.container}
        >
          <View style={styles.header}>
            <Ionicons name="warning" size={28} color="#FF3B30" style={styles.headerIcon} />
            <Text style={[styles.title]}>Reportar Incidente</Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label]}>
                <Ionicons name="person-outline" size={16} style={styles.labelIcon} />
                Tu nombre (opcional):
              </Text>
              <TextInput
                placeholder="Ej: Juan Pérez"
                style={[
                  styles.input
                ]}
                value={nombre}
                onChangeText={setNombre}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label]}>
                <Ionicons name="list" size={16}  style={styles.labelIcon} />
                Tipo de incidente:
              </Text>
              <View style={styles.categoriasContainer}>
                {CATEGORIAS.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoriaChip,
                      { backgroundColor: getCategoriaColor(cat) },
                      categoria === cat && styles.categoriaSeleccionada,
                    ]}
                    onPress={() => setCategoria(cat)}
                  >
                    {getCategoriaIcon(cat)}
                    <Text
                      style={[
                        styles.categoriaText,
                        categoria === cat && styles.categoriaTextSeleccionada,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label]}>
                <Ionicons name="document-text-outline" size={16}  style={styles.labelIcon} />
                Descripción del hecho:
              </Text>
              <TextInput
                style={[
                  styles.input, 
                  styles.textArea
                ]}
                placeholder="Detalles del incidente (obligatorio)"
                multiline
                value={descripcion}
                onChangeText={(text) => {
                  setDescripcion(text)
                  if (text.trim()) {
                    setFormErrors({...formErrors, descripcion: ""})
                  }
                }}
              />
              {formErrors.descripcion ? (
                <Text style={styles.errorText}>{formErrors.descripcion}</Text>
              ) : null}
            </View>

            <View style={styles.locationNote}>
              <Ionicons name="location" size={18} color="#FF9500" />
              <Text style={[styles.locationNoteText]}>
                Se utilizará tu ubicación actual para el reporte
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              {enviando ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={[styles.loadingText]}>Enviando reporte...</Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity 
                    style={styles.submitButton}
                    onPress={enviarReporte}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="send" size={18} color="#fff" />
                    <Text style={styles.submitButtonText}>Enviar Reporte</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={resetFormulario}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="refresh" size={18} color="#666" />
                    <Text style={styles.cancelButtonText}>Cancelar / Limpiar</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default ReportScreen

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 20,
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  headerIcon: {
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  formSection: {
    backgroundColor: "transparent",
    borderRadius: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  labelIcon: {
    marginRight: 6,
  },
  input: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  categoriasContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoriaChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  categoriaSeleccionada: {
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  categoriaText: {
    color: "#555",
    fontSize: 14,
    fontWeight: "500",
  },
  categoriaTextSeleccionada: {
    color: "#fff",
    fontWeight: "bold",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  locationNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 149, 0, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  locationNoteText: {
    marginLeft: 8,
    fontSize: 14,
  },
  buttonContainer: {
    gap: 12,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#f1f2f3",
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
})
