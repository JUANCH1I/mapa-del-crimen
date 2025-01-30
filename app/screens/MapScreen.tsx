import React from "react"
import { View, Text } from "react-native"
import MapView from "react-native-maps"

const MapScreen = () => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <MapView
      style={{ width: 300, height: 300 }}
      initialRegion={{
        latitude: 40.416775,
        longitude: -3.703790,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
    />
  </View>
)

export default MapScreen

