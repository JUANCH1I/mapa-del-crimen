// context/UserContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signOut,
} from 'firebase/auth'
import { auth, db } from '../config/firebaseConfig'
import { doc, getDoc, setDoc, onSnapshot, collectionGroup, collection, query, orderBy } from 'firebase/firestore'
import { router } from 'expo-router'
import * as Notifications from 'expo-notifications'

interface UserData {
  uid: string
  email: string
  nombre: string
  zona: string
  token_notification: string
}

interface UserContextProps {
  user: UserData | null
  setUser: React.Dispatch<React.SetStateAction<UserData | null>>
  cargando: boolean
  logout: () => void
}

const UserContext = createContext<UserContextProps | undefined>(undefined)

const obtenerTokenExpo = async () => {
  const { status } = await Notifications.requestPermissionsAsync()
  if (status !== 'granted') {
    alert('No se concedieron permisos de notificación.')
    return null
  }
  const token = (await Notifications.getExpoPushTokenAsync()).data
  return token
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
  if (!user?.zona) return;

  const ref = collection(db, 'chats', user.zona, 'mensajes')
  const q = query(ref, orderBy('createdAt', 'desc'))

  const unsuscribe = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const mensaje = change.doc.data()
      if (change.type === 'added' && mensaje.tipo === 'panico') {
        Notifications.scheduleNotificationAsync({
          content: {
            title: "🚨 Emergencia en tu zona",
            body: mensaje.text || "Nuevo mensaje de emergencia",
            sound: "default",
          },
          trigger: null,
        })
      }
    })
  })

  return () => unsuscribe()
}, [user?.zona])


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (usuarioFirebase) => {
      if (usuarioFirebase) {
        const ref = doc(db, 'usuarios', usuarioFirebase.uid)
        const snap = await getDoc(ref)
        const datos = snap.data()
        const token = await obtenerTokenExpo()

        // (Opcional) Actualizar Firestore con el token
        if (token && datos && datos.token_notification !== token) {
          await setDoc(ref, { token_notification: token }, { merge: true })
        }

        setUser({
          uid: usuarioFirebase.uid,
          email: usuarioFirebase.email || '',
          nombre: datos?.nombre || 'Anónimo',
          zona: datos?.zona || 'zona_default',
          token_notification: token || '',
        })
      } else {
        setUser(null)
      }
      setCargando(false)
    })

    return () => unsubscribe()
  }, [])

  const logout = async () => {
    await signOut(auth)
    setUser(null)
    router.replace('/screens/Login')
  }
  return (
    <UserContext.Provider value={{ user, setUser, cargando, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser debe usarse dentro de <UserProvider>')
  }
  return context
}
