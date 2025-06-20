
import { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  Linking,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Platform,
  Dimensions,
} from "react-native"
import * as Location from "expo-location"
import { Ionicons, FontAwesome5 } from "@expo/vector-icons"
import { ENLACES_UTILES } from '../constants/enlancesUtiles'
import { NUMEROS_EMERGENCIA } from '../constants/numeroEmergencia'

const { width } = Dimensions.get("window")
const STATUSBAR_HEIGHT = StatusBar.currentHeight || 0

export default function HelpCenterScreen() {
  const [ubicacion, setUbicacion] = useState<null | { lat: number; lng: number }>(null)
  const [cargandoUbicacion, setCargandoUbicacion] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== "granted") {
          Alert.alert("Permiso denegado", "No se pudo acceder a la ubicación.")
          setCargandoUbicacion(false)
          return
        }

        const loc = await Location.getCurrentPositionAsync({})
        setUbicacion({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        })
      } catch (error) {
        console.error("Error al obtener ubicación:", error)
        Alert.alert("Error", "No se pudo obtener tu ubicación actual.")
      } finally {
        setCargandoUbicacion(false)
      }
    })()
  }, [])

  const handleEmergencyCall = (numero: string, nombre: string) => {
    Alert.alert(
      `Llamar a ${nombre}`,
      `¿Estás seguro que deseas llamar al ${numero}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Llamar", onPress: () => Linking.openURL(`tel:${numero}`) },
      ],
      { cancelable: true },
    )
  }

  const handleOpenLink = (url: string, nombre: string) => {
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url)
      } else {
        Alert.alert("Error", `No se puede abrir ${nombre}`)
      }
    })
  }

  const handlePanicButton = () => {
    Alert.alert(
      "¡ALERTA DE EMERGENCIA!",
      "¿Estás en una situación de emergencia? Se llamará inmediatamente al 911.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "SÍ, EMERGENCIA",
          onPress: () => Linking.openURL("tel:911"),
          style: "destructive",
        },
      ],
      { cancelable: true },
    )
  }

  const openMapsForPoliceStations = () => {
    if (ubicacion) {
      Linking.openURL(`https://www.google.com/maps/search/comisaría/@${ubicacion.lat},${ubicacion.lng},14z`)
    } else {
      Alert.alert("Ubicación no disponible", "No se pudo obtener tu ubicación actual.")
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#3498db" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Centro de Ayuda</Text>
        <Ionicons name="help-buoy" size={24} color="#fff" />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <TouchableOpacity style={styles.panicButton} onPress={handlePanicButton} activeOpacity={0.8}>
          <Ionicons name="warning" size={32} color="#fff" />
          <Text style={styles.panicButtonText}>BOTÓN DE PÁNICO</Text>
        </TouchableOpacity>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="call" size={22} color="#3498db" />
            <Text style={styles.sectionTitle}>Números de Emergencia</Text>
          </View>

          <View style={styles.cardsContainer}>
            {NUMEROS_EMERGENCIA.map((item) => (
              <TouchableOpacity
                key={item.numero}
                style={styles.emergencyCard}
                onPress={() => handleEmergencyCall(item.numero, item.nombre)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icono as any} size={24} color="#fff" />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{item.nombre}</Text>
                  <Text style={styles.cardDescription}>{item.descripcion}</Text>
                  <View style={styles.callButton}>
                    <Text style={styles.callButtonText}>Llamar {item.numero}</Text>
                    <Ionicons name="call-outline" size={16} color="#3498db" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={22} color="#3498db" />
            <Text style={styles.sectionTitle}>Comisarías Cercanas</Text>
          </View>

          <TouchableOpacity
            style={styles.mapCard}
            onPress={openMapsForPoliceStations}
            disabled={cargandoUbicacion || !ubicacion}
          >
            {cargandoUbicacion ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3498db" />
                <Text style={styles.loadingText}>Obteniendo tu ubicación...</Text>
              </View>
            ) : ubicacion ? (
              <>
                <View style={styles.mapPreview}>
                  <Ionicons name="map" size={40} color="#3498db" />
                </View>
                <Text style={styles.mapCardTitle}>Ver comisarías cercanas</Text>
                <Text style={styles.mapCardDescription}>
                  Abre Google Maps para encontrar la comisaría más cercana a tu ubicación actual
                </Text>
              </>
            ) : (
              <View style={styles.errorContainer}>
                <Ionicons  size={40} color="#e74c3c" />
                <Text style={styles.errorText}>No se pudo obtener tu ubicación</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="link" size={22} color="#3498db" />
            <Text style={styles.sectionTitle}>Enlaces Útiles</Text>
          </View>

          {ENLACES_UTILES.map((item) => (
            <TouchableOpacity
              key={item.url}
              style={styles.linkCard}
              onPress={() => handleOpenLink(item.url, item.nombre)}
            >
              <View style={styles.linkIconContainer}>
                <FontAwesome5 name={item.icono as any} size={20} color="#3498db" />
              </View>
              <View style={styles.linkContent}>
                <Text style={styles.linkTitle}>{item.nombre}</Text>
                <Text style={styles.linkDescription}>{item.descripcion}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>En caso de emergencia, siempre llama primero al 911</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#3498db",
    paddingTop: Platform.OS === "android" ? STATUSBAR_HEIGHT : 0,
  },
  header: {
    backgroundColor: "#3498db",
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  panicButton: {
    backgroundColor: "#e74c3c",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  panicButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 12,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
    color: "#333",
  },
  cardsContainer: {
    gap: 12,
  },
  emergencyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    color: "#333",
  },
  cardDescription: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  callButtonText: {
    color: "#3498db",
    fontWeight: "600",
    marginRight: 4,
  },
  mapCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  mapPreview: {
    width: "100%",
    height: 120,
    backgroundColor: "#ecf0f1",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  mapCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  mapCardDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
  },
  errorText: {
    marginTop: 12,
    color: "#e74c3c",
  },
  linkCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  linkIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ecf0f1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  linkDescription: {
    fontSize: 13,
    color: "#666",
  },
  footer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: "#ecf0f1",
    borderRadius: 8,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
  },
})
