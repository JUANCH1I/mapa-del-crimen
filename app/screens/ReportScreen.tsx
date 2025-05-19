import React, { useState } from "react"
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native"
import * as Location from "expo-location"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from "../config/firebaseConfig"
import { CATEGORIAS } from "../constants/categoriasIncidentes"
import { useTheme } from "../context/ThemeContext"

const ReportScreen = () => {
  const { theme } = useTheme()
  const [descripcion, setDescripcion] = useState("")
  const [categoria, setCategoria] = useState(CATEGORIAS[0])
  const [nombre, setNombre] = useState("")
  const [enviando, setEnviando] = useState(false)

  const enviarReporte = async () => {
    try {
      setEnviando(true)

      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permiso de ubicación denegado")
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
      }

      // Confirmación
      Alert.alert(
        "Confirmar reporte",
        `¿Deseás reportar "${categoria}"?\n\nUbicación actual será usada.`,
        [
          { text: "Cancelar", style: "cancel", onPress: () => setEnviando(false) },
          {
            text: "Confirmar",
            onPress: async () => {
              await addDoc(collection(db, "reportes"), reporte)
              Alert.alert("✅ Reporte enviado", "Gracias por tu colaboración")
              resetFormulario()
            },
          },
        ]
      )
    } catch (e) {
      console.error("Error al enviar reporte:", e)
      Alert.alert("Error al enviar el reporte")
    } finally {
      setEnviando(false)
    }
  }

  const resetFormulario = () => {
    setDescripcion("")
    setCategoria(CATEGORIAS[0])
    setNombre("")
  }

  return (
    <ScrollView contentContainerStyle={styles.container } style={{ backgroundColor: theme.background }}>
      <Text style={[styles.title, { color: theme.text }]}>Reportar incidente</Text>

      <Text style={styles.label}>Tu nombre (opcional):</Text>
      <TextInput
        placeholder="Ej: Juan Pérez"
        style={styles.input}
        value={nombre}
        onChangeText={setNombre}
      />

      <Text style={styles.label}>Tipo de incidente:</Text>
      <View style={[styles.categoriasContainer, { backgroundColor: theme.background }]}>
        {CATEGORIAS.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoriaChip,
              categoria === cat && styles.categoriaSeleccionada,
            ]}
            onPress={() => setCategoria(cat)}
          >
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

      <Text style={styles.label}>Descripción del hecho:</Text>
      <TextInput
        style={[styles.input, { minHeight: 80 }]}
        placeholder="Detalles del incidente"
        multiline
        value={descripcion}
        onChangeText={setDescripcion}
      />

      {enviando ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      ) : (
        <>
          <Button title="Enviar Reporte" onPress={enviarReporte} />
          <View style={{ marginTop: 10 }}>
            <Button title="Cancelar / Limpiar" color="#999" onPress={resetFormulario} />
          </View>
        </>
      )}
    </ScrollView>
  )
}

export default ReportScreen

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 6,
  },
  categoriasContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoriaChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#eee",
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  categoriaSeleccionada: {
    backgroundColor: "#007AFF",
  },
  categoriaText: {
    color: "#555",
    fontSize: 14,
  },
  categoriaTextSeleccionada: {
    color: "#fff",
    fontWeight: "bold",
  },
})
