import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, ImageBackground, TouchableOpacity } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getAuth, GoogleAuthProvider, signInWithPopup, OAuthProvider, signInWithCredential } from '../services/firebaseConfig';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigation.navigate('TelaInicial');
    } catch (error) {
      console.error('Erro ao fazer login via Google:', error);
      setErrorMessage("Algo deu errado. A rebelião falhou. Tente novamente mais tarde.");
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const auth = getAuth();
      const provider = new OAuthProvider('apple.com');
      await signInWithCredential(auth, provider);
      navigation.navigate('TelaInicial');
    } catch (error) {
      console.error('Erro ao fazer login via Apple:', error);
      setErrorMessage("Os Sith estão bloqueando o acesso. Tente novamente mais tarde.");
    }
  };

  const handleEmailSignIn = async () => {
    try {
      const auth = getAuth();
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
          <AntDesign.Button
            name="apple1"
            backgroundColor="transparent"
            onPress={handleAppleSignIn}
            style={styles.iconButton}
          />
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
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
  input: {
    width: '100%',
    height: 40,
    borderColor: '#fff',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
    color: '#fff', // Cor do texto inserido
  },
  errorMessage: {
    color: 'red',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row', // Dispor os botões horizontalmente
    justifyContent: 'center', // Centralizar os botões na horizontal
    marginVertical: 10, // Espaçamento vertical
  }, 
  iconButton: {
    width: 60,
    justifyContent: 'center', // Largura dos botões
  },  
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
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
});

export default LoginScreen;
