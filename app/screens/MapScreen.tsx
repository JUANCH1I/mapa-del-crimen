import React from "react"
import { View, Text } from "react-native"
import MapView from "react-native-maps"
import { StyleSheet } from "react-native"

const MapScreen = () => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <MapView
      style={styles.map}
      showsUserLocation={true}
      initialRegion={{
        latitude: -0.182998,
        longitude: -78.485378,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
    />

  </View>
)

const styles = {
  map: {
    ...StyleSheet.absoluteFillObject, // Ocupa todo el espacio disponible

  },
}

export default MapScreen

