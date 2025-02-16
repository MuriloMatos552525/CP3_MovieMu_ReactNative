import React, { useEffect } from 'react';
import { View, Button, StyleSheet, Text } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';

const GoogleLoginScreen = ({ navigation }) => {
  // Configuração do request usando expo-auth-session para obter o id_token do Google
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '1084439998582-t8gtep17cqi76dfe6hq8idk99lt77ccv.apps.googleusercontent.com', // Substitua pelo seu clientId do Firebase
  });

  // Quando o response for bem-sucedido, cria a credencial e efetua o login no Firebase
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(() => {
          navigation.navigate('TelaInicial');
        })
        .catch((error) => {
          console.error('Erro ao fazer login via Google:', error);
        });
    }
  }, [response]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login com Google</Text>
      <Button
        disabled={!request}
        title="Entrar com Google"
        onPress={() => promptAsync()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f0f0'
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});

export default GoogleLoginScreen;
