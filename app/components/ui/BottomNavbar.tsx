import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Icon from 'react-native-vector-icons/MaterialIcons'

// Importa tus componentes de pantalla aquí
import MapScreen from '../../screens/MapScreen'
import ChatScreen from '../../screens/ChatScreen'
import ReportScreen from '../../screens/ReportScreen'
import ProfileScreen from '../../screens/ProfileScreen'

const Tab = createBottomTabNavigator()

const BottomNavbar = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = ''

          if (route.name === 'Mapa') {
            iconName = 'map'
          } else if (route.name === 'Chat') {
            iconName = 'chat'
          } else if (route.name === 'Reportar') {
            iconName = 'report'
          } else if (route.name === 'Perfil') {
            iconName = 'person'
          }

          return <Icon name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
        tabBarShowLabel: false, // Oculta las etiquetas de texto
      })}
    >
      <Tab.Screen name='Mapa' component={MapScreen} />
      <Tab.Screen name='Chat' component={ChatScreen} />
      <Tab.Screen name='Reportar' component={ReportScreen} />
      <Tab.Screen name='Perfil' component={ProfileScreen} />
    </Tab.Navigator>
  )
}

export default BottomNavbar
