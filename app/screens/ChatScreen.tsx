import React, { useState, useCallback, useEffect } from 'react'
import { GiftedChat, IMessage, InputToolbar } from 'react-native-gifted-chat'
import { StyleSheet, View } from 'react-native'
import { db } from '../config/firebaseConfig'
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore'
import PanicFAB from '../components/PanicFab'
import { useUser } from '../context/UserContext'
import { useTheme } from '../context/ThemeContext'

const ChatScreen: React.FC = () => {
  const { user } = useUser()
  const { theme, isDark } = useTheme()
  const [messages, setMessages] = useState<IMessage[]>([])
  const zona = user?.zona || 'zona_default' // Cambia esto dinámicamente si querés usar otras zonas
  const currentUser = {
    _id: user?.uid || 'user_123',
    name: user?.nombre || 'Usuario',
  } // Idealmente debería venir del login

  useEffect(() => {
    const q = query(
      collection(db, 'chats', zona, 'mensajes'),
      orderBy('createdAt', 'desc')
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mensajesFirestore = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          _id: doc.id,
          text: data.text,
          createdAt: data.createdAt.toDate(),
          user: data.user,
        }
      })
      setMessages(mensajesFirestore)
    })

    return () => unsubscribe()
  }, [zona])

  const onSend = useCallback(
    async (messagesToSend: IMessage[] = []) => {
      const mensaje = messagesToSend[0]
      await addDoc(collection(db, 'chats', zona, 'mensajes'), {
        ...mensaje,
        createdAt: new Date(), // Firestore necesita una fecha real
      })
    },
    [zona]
  )

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <GiftedChat messages={messages} onSend={onSend} user={currentUser} renderInputToolbar={(props) => (
    <InputToolbar
      {...props}
      containerStyle={{
        backgroundColor: isDark ? '#1e1e1e' : '#f0f0f0',
        borderTopWidth: 1,
        borderTopColor: '#ccc',
      }}
    />
  )}  />
      {user && (
        <PanicFAB zona={user.zona} user={{ id: user.uid, name: user.nombre }} />
      )}
    </View>
  )
}

export default ChatScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
