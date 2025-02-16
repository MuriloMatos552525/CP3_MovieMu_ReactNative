import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  ImageBackground, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';

// Importe a função que cria/atualiza o doc do usuário
import { createOrUpdateUserDoc } from '../services/firebaseActions';

const CadastroScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSignUp = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Usuário cadastrado com sucesso:', user);

      // === IMPORTANTE ===
      // Cria o documento do usuário no Firestore para não dar erro de "Perfil não encontrado"
      await createOrUpdateUserDoc(user.uid, {
        displayName: '',  // Se quiser usar o email como displayName => user.email || ''
        photoURL: '',
        friends: []
      });

      setSuccessMessage("Conta criada com sucesso! Você está pronto para embarcar nesta aventura. Faça login para começar.");
      setErrorMessage('');
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('Erro ao cadastrar usuário:', error);
      setErrorMessage("Ops! Parece que houve um problema. Tente novamente mais tarde.");
      setSuccessMessage('');
    }
  };

  return (
    <ImageBackground 
      source={require('../../assets/login.png')} 
      style={styles.backgroundImage}
      blurRadius={2} // deixa a imagem levemente desfocada para maior contraste
    >
      {/* Overlay para dar contraste à imagem */}
      <View style={styles.overlay} />

      <View style={styles.container}>
        <Text style={styles.title}>Cadastro</Text>

        {/* Mensagens de erro/sucesso */}
        {errorMessage ? <Text style={styles.errorMessage}>{errorMessage}</Text> : null}
        {successMessage ? <Text style={styles.successMessage}>{successMessage}</Text> : null}

        {/* Campos de entrada */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#ddd"
          onChangeText={(text) => setEmail(text)}
          value={email}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#ddd"
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry
        />

        {/* Botão customizado */}
        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Cadastrar</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

export default CadastroScreen;

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    marginBottom: 30,
    fontWeight: 'bold',
    color: '#fff',
  },
  input: {
    width: '85%',
    height: 48,
    borderColor: '#fff',
    borderWidth: 1,
    borderRadius: 25,
    marginBottom: 15,
    paddingHorizontal: 15,
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  button: {
    width: '85%',
    height: 50,
    backgroundColor: '#f44336',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorMessage: {
    color: '#ffcccc',
    marginBottom: 10,
    textAlign: 'center',
  },
  successMessage: {
    color: '#c8ffc8',
    marginBottom: 10,
    textAlign: 'center',
  },
});
