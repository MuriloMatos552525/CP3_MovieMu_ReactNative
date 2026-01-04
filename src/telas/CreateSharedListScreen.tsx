import React, { useState } from 'react';
import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar 
} from 'react-native';
import { auth } from '../services/firebaseConfig';
import { createSharedList } from '../services/firebaseActions';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { LinearGradient } from 'expo-linear-gradient';

type Props = StackScreenProps<RootStackParamList, 'CreateSharedList'>;

const CreateSharedListScreen: React.FC<Props> = ({ navigation }) => {
  const [listName, setListName] = useState('');
  const [privacy, setPrivacy] = useState<'private' | 'shared'>('shared');
  const [loading, setLoading] = useState(false);
  const user = auth.currentUser;

  const handleCreate = async () => {
    if (!listName.trim()) return Alert.alert('Ops', 'Sua lista precisa de um nome.');
    if (!user) return;

    setLoading(true);
    try {
      const isShared = privacy === 'shared';
      await createSharedList(user.uid, listName, isShared);
      navigation.goBack();
    } catch (error) { Alert.alert('Erro', 'Tente novamente.'); } 
    finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1c1c1e', '#000000']} style={styles.background}>
        
        {/* Header Modal */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Nova Coleção</Text>
          <TouchableOpacity onPress={handleCreate} disabled={!listName || loading}>
              {loading ? <ActivityIndicator color="#fff" /> : 
              <Text style={[styles.doneText, !listName && {color: '#444'}]}>Criar</Text>}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex:1}}>
            <ScrollView contentContainerStyle={styles.content}>
              
              {/* Ícone Animado/Feedback */}
              <View style={styles.iconContainer}>
                  <View style={[styles.circle, { borderColor: privacy === 'shared' ? '#FF512F' : '#333' }]}>
                      <Ionicons 
                          name={privacy === 'shared' ? "people" : "lock-closed"} 
                          size={40} 
                          color={privacy === 'shared' ? "#FF512F" : "#fff"} 
                      />
                  </View>
              </View>
              
              <Text style={styles.label}>NOME</Text>
              <TextInput
                  style={styles.input}
                  placeholder="Ex: Oscar 2026..."
                  placeholderTextColor="#555"
                  value={listName}
                  onChangeText={setListName}
                  autoFocus
              />

              <Text style={[styles.label, {marginTop: 35}]}>PRIVACIDADE</Text>
              
              <View style={styles.privacyContainer}>
                  {/* Opção Privada */}
                  <TouchableOpacity 
                      activeOpacity={0.7}
                      style={[
                        styles.privacyOption, 
                        privacy === 'private' && styles.privacyActive
                      ]} 
                      onPress={() => setPrivacy('private')}
                  >
                      <View style={styles.optionIcon}>
                         <Ionicons name="lock-closed" size={20} color={privacy === 'private' ? "#fff" : "#666"} />
                      </View>
                      <View style={styles.privacyText}>
                          <Text style={[styles.privacyTitle, privacy === 'private' && {color:'#fff'}]}>Privada</Text>
                          <Text style={styles.privacyDesc}>Apenas você pode visualizar e editar.</Text>
                      </View>
                      {privacy === 'private' && <Ionicons name="checkmark" size={20} color="#fff" />}
                  </TouchableOpacity>

                  {/* Opção Compartilhada */}
                  <TouchableOpacity 
                      activeOpacity={0.7}
                      style={[
                        styles.privacyOption, 
                        privacy === 'shared' && styles.privacyActive
                      ]} 
                      onPress={() => setPrivacy('shared')}
                  >
                       <View style={styles.optionIcon}>
                         <Ionicons name="people" size={20} color={privacy === 'shared' ? "#fff" : "#666"} />
                       </View>
                      <View style={styles.privacyText}>
                          <Text style={[styles.privacyTitle, privacy === 'shared' && {color:'#fff'}]}>Compartilhada</Text>
                          <Text style={styles.privacyDesc}>Gera um código para amigos entrarem.</Text>
                      </View>
                      {privacy === 'shared' && <Ionicons name="checkmark" size={20} color="#FF512F" />}
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
  
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 20, paddingHorizontal: 20, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  title: { color: '#fff', fontSize: 17, fontWeight: '600' },
  cancelText: { color: '#FF4444', fontSize: 16 },
  doneText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  content: { padding: 20 },
  
  iconContainer: { alignItems: 'center', marginVertical: 30 },
  circle: {
      width: 90, height: 90, borderRadius: 45, borderWidth: 2,
      justifyContent: 'center', alignItems: 'center', backgroundColor: '#1c1c1e',
      shadowColor: "#000", shadowOffset: {width:0, height:5}, shadowOpacity: 0.5, shadowRadius: 10
  },

  label: { color: '#666', fontSize: 12, fontWeight: 'bold', marginBottom: 10, paddingLeft: 4, letterSpacing: 0.5 },
  input: {
    backgroundColor: '#1c1c1e', borderRadius: 12, padding: 16,
    color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#333'
  },

  // Seleção de Privacidade
  privacyContainer: { gap: 12 },
  privacyOption: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: 'rgba(28,28,30,0.5)', padding: 16, borderRadius: 14,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  privacyActive: {
      backgroundColor: '#1c1c1e', borderColor: '#FF512F', borderWidth: 1
  },
  optionIcon: { width: 30, alignItems: 'center' },
  privacyText: { flex: 1, marginLeft: 10 },
  privacyTitle: { color: '#888', fontWeight: '600', fontSize: 16, marginBottom: 2 },
  privacyDesc: { color: '#555', fontSize: 13 },
});

export default CreateSharedListScreen;