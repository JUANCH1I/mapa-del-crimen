import React from "react"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import Icon from "react-native-vector-icons/MaterialIcons"

// Importa tus componentes de pantalla aquí
import MapScreen from "../../screens/MapScreen"
import ChatScreen from "../../screens/ChatScreen"
import PanicScreen from "../../screens/PanicScreen"
import ReportScreen from "../../screens/ReportScreen"
import ProfileScreen from "../../screens/ProfileScreen"
import RegisterScreen from "../../screens/Register"

const Tab = createBottomTabNavigator()

const BottomNavbar = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = ""

          if (route.name === "Mapa") {
            iconName = "map"
          } else if (route.name === "Chat") {
            iconName = "chat"
          } else if (route.name === "Pánico") {
            iconName = "warning"
          } else if (route.name === "Reportar") {
            iconName = "report"
          } else if (route.name === "Profile") {
            iconName = "person"
          }

          return <Icon name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: "tomato",
        tabBarInactiveTintColor: "gray",
        tabBarShowLabel: false, // Oculta las etiquetas de texto
      })}
    >
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Pánico" component={PanicScreen} />
      <Tab.Screen name="Mapa" component={MapScreen} />
      <Tab.Screen name="Registro" component={RegisterScreen} />
      <Tab.Screen name="Reportar" component={ReportScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

export default BottomNavbar

