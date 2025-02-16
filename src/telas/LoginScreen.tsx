import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Text, ImageBackground, TouchableOpacity } from 'react-native';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import * as Google from 'expo-auth-session/providers/google';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Configuração do fluxo de autenticação com Google via expo-auth-session
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '1084439998582-t8gtep17cqi76dfe6hq8idk99lt77ccv.apps.googleusercontent.com', // Substitua pelo seu clientId do Firebase Web
  });

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
          setErrorMessage("Algo deu errado. A rebelião falhou. Tente novamente mais tarde.");
        });
    }
  }, [response]);

  const handleEmailSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigation.navigate('TelaInicial');
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      if (error.code === 'auth/user-not-found') {
        setErrorMessage("Você não está na lista, Padawan. Vamos te registrar e te ensinar os caminhos da Força.");
      } else if (error.code === 'auth/wrong-password') {
        setErrorMessage("Senha incorreta! Você não pode passar... até inserir a senha correta.");
      } else {
        setErrorMessage("O sistema está fora de serviço. Tente novamente mais tarde.");
      }
    }
  };

  // Inicia o fluxo de autenticação via Google
  const handleGoogleSignIn = async () => {
    promptAsync();
  };

  return (
    <ImageBackground source={require('../../assets/login.png')} style={styles.backgroundImage}>
      <View style={styles.container}>
        <Text style={styles.title}>Login</Text>
        {errorMessage ? <Text style={styles.errorMessage}>{errorMessage}</Text> : null}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="rgba(255, 255, 255, 0.768)"
          onChangeText={(text) => setEmail(text)}
          value={email}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="rgba(255, 255, 255, 0.768)"
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry
        />

        <TouchableOpacity style={styles.customButton} onPress={handleEmailSignIn}>
          <Text style={styles.customButtonText}>Entrar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.customButton} onPress={() => navigation.navigate('Cadastro')}>
          <Text style={styles.customButtonText}>Cadastre-se</Text>
        </TouchableOpacity>

        <View style={styles.buttonContainer}>
          <FontAwesome.Button
            name="google"
            backgroundColor="transparent"
            onPress={handleGoogleSignIn}
            style={styles.iconButton}
          />
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  errorMessage: {
    color: 'red',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#fff',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
    color: '#fff',
  },
  customButton: {
    width: '100%',
    backgroundColor: 'transparent',
    paddingVertical: 15,
    borderRadius: 5,
    marginTop: 2,
    alignItems: 'center',
  },
  customButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fffefe',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  iconButton: {
    width: 60,
    justifyContent: 'center',
  },
});

export default LoginScreen;
