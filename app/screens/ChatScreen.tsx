import React, { useState, useCallback, useEffect } from 'react';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { StyleSheet, View } from 'react-native';

const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<IMessage[]>([]);

  // Al montar el componente, podemos inicializar mensajes de prueba
  useEffect(() => {
    setMessages([
      {
        _id: 1,
        text: '¡Bienvenido al chat!',
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'React Native Bot',
        },
      },
    ]);
  }, []);

  // Función para manejar el envío de nuevos mensajes
  const onSend = useCallback((messagesToSend: IMessage[] = []) => {
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, messagesToSend)
    );
  }, []);

  return (
    <View style={styles.container}>
      <GiftedChat
        messages={messages}
        onSend={(messagesToSend) => onSend(messagesToSend)}
        user={{
          _id: 1, // Identificador del usuario actual
        }}
      />
    </View>
  );
};

export default ChatScreen;

// Ejemplo de estilos (puedes modificarlo a tu gusto)
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
