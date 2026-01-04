import React, { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  Text, 
  Image, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  StatusBar,
  Alert
} from 'react-native';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { createOrUpdateUserDoc } from '../services/firebaseActions';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '1084439998582-t8gtep17cqi76dfe6hq8idk99lt77ccv.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleLoginSuccess(response.params.id_token);
    }
  }, [response]);

  const handleGoogleLoginSuccess = async (idToken: string) => {
    setGoogleLoading(true);
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      await createOrUpdateUserDoc(user.uid, {
        displayName: user.displayName || 'Usuário Google',
        photoURL: user.photoURL || '',
      });

      // --- MUDANÇA AQUI: Navega para as Abas ---
      navigation.navigate('MainTab'); 
      // -----------------------------------------

    } catch (error: any) {
      console.error('Erro no Login Google:', error);
      Alert.alert("Erro", "Falha ao conectar com Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      setErrorMessage("Preencha email e senha.");
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      // --- MUDANÇA AQUI: Navega para as Abas ---
      navigation.navigate('MainTab');
      // -----------------------------------------

    } catch (error: any) {
      setLoading(false);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        setErrorMessage("Email ou senha incorretos.");
      } else if (error.code === 'auth/invalid-email') {
        setErrorMessage("Formato de email inválido.");
      } else {
        setErrorMessage("Erro ao acessar. Tente novamente.");
      }
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        <LinearGradient
          colors={['#1a1a1a', '#000000']} 
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.6 }}
          style={styles.background}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.contentContainer}
          >
            
            <View style={styles.header}>
              <Image 
                source={require('../../assets/logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
              <View style={styles.titleContainer}>
                <Text style={styles.mainTitle}>MovieMu</Text>
                <Text style={styles.subTitle}>Sua curadoria de cinema.</Text>
              </View>
            </View>

            <View style={styles.form}>
              
              <View style={styles.iosInputContainer}>
                <Ionicons name="mail" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#666"
                  onChangeText={setEmail}
                  value={email}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.iosInputContainer}>
                <Ionicons name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Senha"
                  placeholderTextColor="#666"
                  onChangeText={setPassword}
                  value={password}
                  secureTextEntry
                />
              </View>

              {errorMessage ? (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#ff4444" style={{marginRight: 6}} />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={handleEmailSignIn}
                disabled={loading || googleLoading}
                style={styles.loginButton}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.loginButtonText}>Entrar</Text>
                )}
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.line} />
              </View>

              <TouchableOpacity 
                style={styles.googleButton} 
                onPress={() => {
                   if (request) promptAsync();
                }}
                activeOpacity={0.8}
                disabled={!request || googleLoading}
              >
                {googleLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <FontAwesome name="google" size={18} color="#fff" />
                    <Text style={styles.googleButtonText}>Continuar com Google</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Não tem conta? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
                  <Text style={styles.signupText}>Cadastrar</Text>
                </TouchableOpacity>
              </View>

            </View>
          </KeyboardAvoidingView>
        </LinearGradient>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    flex: 1,
    width: width,
    height: height,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
    borderRadius: 16,
    opacity: 0.9,
  },
  titleContainer: {
    alignItems: 'center',
  },
  mainTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 5,
    letterSpacing: -0.5,
  },
  subTitle: {
    color: '#888',
    fontSize: 16,
    fontWeight: '500',
  },
  form: {
    width: '100%',
  },
  iosInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    marginBottom: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#333',
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    height: '100%',
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#fff', 
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  loginButtonText: {
    color: '#000',
    fontSize: 17,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#666',
    paddingHorizontal: 15,
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    height: 56,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  footerText: {
    color: '#666',
    fontSize: 15,
  },
  signupText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default LoginScreen;