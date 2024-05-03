import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, ImageBackground } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { getAuth } from '../services/firebaseConfig';

const CadastroScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSignUp = async () => {
    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Usuário cadastrado com sucesso:', user);
      setSuccessMessage("Conta criada com sucesso! Você está pronto para embarcar nesta aventura. Faça login para começar.");
      setErrorMessage('');
    } catch (error) {
      console.error('Erro ao cadastrar usuário:', error);
      setErrorMessage("Ops! Parece que houve um problema. Tente novamente mais tarde.");
      setSuccessMessage('');
    }
  };

  return (
    <ImageBackground source={require('../../assets/login.png')} style={styles.backgroundImage}>
      <View style={styles.container}>
        <Text style={styles.title}>Cadastro</Text>
        {errorMessage ? <Text style={styles.errorMessage}>{errorMessage}</Text> : null}
        {successMessage ? <Text style={styles.successMessage}>{successMessage}</Text> : null}
        <TextInput
          style={styles.input}
          placeholder="Email"
          onChangeText={(text) => setEmail(text)}
          value={email}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry
        />
        <Button title="Cadastrar" onPress={handleSignUp} />
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
    color: '#fff', // Cor do texto do título
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#fff',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
    color: '#fff', // Cor do texto dos campos de entrada
  },
  errorMessage: {
    color: 'red',
    marginBottom: 10,
  },
  successMessage: {
    color: 'green',
    marginBottom: 10,
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
});

export default CadastroScreen;
