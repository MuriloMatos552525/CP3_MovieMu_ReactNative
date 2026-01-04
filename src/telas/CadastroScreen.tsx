import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { createUserInFirestore, checkUsernameExists } from '../services/firebaseActions';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';

type Props = StackScreenProps<RootStackParamList, 'Cadastro'>;

const CadastroScreen: React.FC<Props> = ({ navigation }) => {
  // Estados do Formulário
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  const handleRegister = async () => {
    // 1. Validações Básicas
    if (!fullName || !username || !email || !password || !confirmPassword) {
      return Alert.alert('Atenção', 'Preencha todos os campos.');
    }

    if (password !== confirmPassword) {
      return Alert.alert('Erro', 'As senhas não coincidem.');
    }

    if (password.length < 6) {
      return Alert.alert('Senha fraca', 'A senha deve ter pelo menos 6 caracteres.');
    }

    // 2. Validação de Username (Sem espaços, sem caracteres especiais exceto _ e .)
    const usernameRegex = /^[a-zA-Z0-9_.]+$/;
    if (!usernameRegex.test(username)) {
      return Alert.alert('Usuário inválido', 'Use apenas letras, números, ponto (.) e underline (_).');
    }

    setLoading(true);

    try {
      // 3. Verificar se username já existe no banco (Async)
      const userExists = await checkUsernameExists(username);
      if (userExists) {
        setLoading(false);
        return Alert.alert('Indisponível', `O usuário @${username} já está em uso.`);
      }

      // 4. Criar conta no Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 5. Atualizar perfil básico do Auth (para exibir nome logo de cara)
      await updateProfile(user, { displayName: fullName });

      // 6. Salvar dados completos no Firestore (Usando a nova action)
      await createUserInFirestore(user.uid, {
        email,
        username,
        fullName
      });

      // Sucesso
      Alert.alert("Sucesso", "Conta criada! Bem-vindo ao MovieMu.");
      navigation.replace('MainTab'); // Vai para a Home, removendo o cadastro da pilha

    } catch (error: any) {
      console.error(error);
      let msg = "Não foi possível criar a conta.";
      if (error.code === 'auth/email-already-in-use') msg = "Este e-mail já está cadastrado.";
      if (error.code === 'auth/invalid-email') msg = "E-mail inválido.";
      Alert.alert("Erro", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#1c1c1e', '#000000']} // Tema Noir
        style={styles.background}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={{ flex: 1 }}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
          >
            
            {/* Botão Voltar */}
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.subTitle}>Junte-se ao</Text>
              <Text style={styles.title}>MovieMu</Text>
              <Text style={styles.description}>Crie sua conta para avaliar filmes e compartilhar listas com amigos.</Text>
            </View>

            <View style={styles.form}>
              
              {/* Nome Completo */}
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="Nome Completo"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>

              {/* Username */}
              <View style={styles.inputContainer}>
                <Ionicons name="at-outline" size={20} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="Nome de usuário (ex: joaosilva)"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={username}
                  onChangeText={(t) => setUsername(t.toLowerCase())} // Visualmente minúsculo
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Email */}
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="E-mail"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Senha */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="Senha (mín. 6 caracteres)"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secureText}
                />
                <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                     <Ionicons name={secureText ? "eye-off-outline" : "eye-outline"} size={20} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
              </View>

              {/* Confirmar Senha */}
              <View style={styles.inputContainer}>
                <Ionicons name="shield-checkmark-outline" size={20} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="Confirmar Senha"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={true}
                />
              </View>

              {/* Botão de Ação */}
              <TouchableOpacity 
                activeOpacity={0.8}
                style={styles.button} 
                onPress={handleRegister}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#FF512F', '#DD2476']}
                  start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                  style={styles.gradientButton}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>CRIAR CONTA</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Já tem uma conta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.link}>Fazer Login</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  background: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24, paddingBottom: 50 },
  
  backButton: { 
    marginTop: 40, marginBottom: 20, width: 40, height: 40, 
    justifyContent: 'center', alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 
  },
  
  // Header Text
  header: { marginBottom: 30, marginTop: 10 },
  subTitle: { color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: '500', letterSpacing: 1, textTransform: 'uppercase' },
  title: { fontSize: 42, fontWeight: '800', color: '#fff', marginBottom: 10, letterSpacing: -1 },
  description: { fontSize: 15, color: '#888', lineHeight: 22 },

  // Form
  form: { gap: 16 },
  
  // Inputs (Glass Style)
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)', 
    borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 15, height: 60
  },
  inputIcon: { marginRight: 15 },
  input: {
    flex: 1, color: '#fff', fontSize: 16, height: '100%'
  },

  // Button
  button: {
    marginTop: 20,
    shadowColor: "#FF512F", shadowOffset: {width:0, height:8}, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8
  },
  gradientButton: {
    paddingVertical: 18, borderRadius: 14, alignItems: 'center'
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },

  // Footer
  footer: {
    flexDirection: 'row', justifyContent: 'center', marginTop: 40
  },
  footerText: { color: '#666', fontSize: 15 },
  link: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});

export default CadastroScreen;