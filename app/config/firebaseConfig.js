import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { initializeAuth, getReactNativePersistence } from 'firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'

const firebaseConfig = {
  apiKey: 'AIzaSyB2zd58ugVRjQXWr50VJxaCgqpoC2cAA5A',
  authDomain: 'mapa-del-crimen-f52d4.firebaseapp.com',
  databaseURL: 'https://mapa-del-crimen-f52d4-default-rtdb.firebaseio.com',
  projectId: 'mapa-del-crimen-f52d4',
  storageBucket: 'mapa-del-crimen-f52d4.appspot.com',
  messagingSenderId: '205821550360',
  appId: '1:205821550360:web:4ddb00f93c6bad3465c86d',
  measurementId: 'G-4M8V0KDPST',
}

const app = initializeApp(firebaseConfig)

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
})

const db = getFirestore(app)

export { auth, db }
