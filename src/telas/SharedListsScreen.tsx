import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, StatusBar, RefreshControl, Modal, 
  TextInput, Alert, KeyboardAvoidingView, Platform, Dimensions 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../services/firebaseConfig';
import { getSharedListsByUser, joinSharedList, SharedList } from '../services/firebaseActions';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { LinearGradient } from 'expo-linear-gradient';

type Props = StackScreenProps<RootStackParamList, 'SharedLists'>;

const SharedListsScreen: React.FC<Props> = ({ navigation }) => {
  const [lists, setLists] = useState<SharedList[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const user = auth.currentUser;

  const loadLists = async () => {
    if (!user) return;
    try {
      const data = await getSharedListsByUser(user.uid);
      setLists(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadLists();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadLists();
  };

  const handleJoinList = async () => {
    if (!joinCode.trim()) return Alert.alert("Ops", "Cole o código da lista.");
    if (!user) return;

    setJoining(true);
    try {
        await joinSharedList(joinCode.trim(), user.uid);
        Alert.alert("Sucesso", "Você entrou na lista!");
        setJoinModalVisible(false);
        setJoinCode("");
        loadLists();
    } catch (error) {
        Alert.alert("Erro", "Código inválido ou lista inexistente.");
    } finally {
        setJoining(false);
    }
  };

  const ListHeader = () => (
    <View style={styles.headerContainer}>
        {/* Banner Premium */}
        <LinearGradient
            colors={['rgba(255, 81, 47, 0.15)', 'rgba(0,0,0,0)']}
            start={{x: 0, y: 0}} end={{x: 1, y: 1}}
            style={styles.heroBanner}
        >
            <View style={styles.heroIconCircle}>
                <Ionicons name="people" size={24} color="#FF512F" />
            </View>
            <View style={{flex:1}}>
                <Text style={styles.heroTitle}>Cinema com Amigos</Text>
                <Text style={styles.heroSubtitle}>
                    Crie listas colaborativas ou use um código para entrar.
                </Text>
            </View>
        </LinearGradient>
        
        {/* Botão Entrar (Glass) */}
        <TouchableOpacity 
            style={styles.joinButtonBlock} 
            activeOpacity={0.7}
            onPress={() => setJoinModalVisible(true)}
        >
            <Ionicons name="enter-outline" size={20} color="#fff" />
            <Text style={styles.joinButtonText}>Entrar com código</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>SUAS COLEÇÕES</Text>
    </View>
  );

  const renderItem = ({ item }: { item: SharedList }) => (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('SharedListDetail', { listId: item.id, listName: item.listName })}
    >
      <View style={styles.cardLeft}>
          <View style={styles.cardIcon}>
             <Ionicons 
                name={item.isShared !== false ? "film" : "lock-closed"} 
                size={20} 
                color="#fff" 
             />
          </View>
          <View>
            <Text style={styles.listName}>{item.listName}</Text>
            <View style={styles.metaRow}>
                <Text style={styles.participantsText}>
                {item.participants?.length || 1} participante(s)
                </Text>
            </View>
          </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.2)" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
          colors={['#1c1c1e', '#000000']}
          style={styles.background}
      >
        <View style={styles.topBar}>
           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
           </TouchableOpacity>
           <Text style={styles.screenTitle}>Minhas Listas</Text>
           <TouchableOpacity 
              style={styles.addButton}
              onPress={() => navigation.navigate('CreateSharedList')}
           >
              <Ionicons name="add" size={24} color="#000" />
           </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <View style={styles.center}>
             <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : (
          <FlatList
            data={lists}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListHeaderComponent={ListHeader}
            contentContainerStyle={styles.listContent}
            refreshControl={
               <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                  <Ionicons name="albums-outline" size={48} color="#333" />
                  <Text style={styles.emptyText}>Nenhuma lista encontrada.</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('CreateSharedList')}>
                      <Text style={styles.createLink}>Criar nova coleção</Text>
                  </TouchableOpacity>
              </View>
            }
          />
        )}
      </LinearGradient>

      {/* Modal Entrar */}
      <Modal visible={joinModalVisible} transparent animationType="fade" onRequestClose={() => setJoinModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Entrar na Lista</Text>
                    <TouchableOpacity onPress={() => setJoinModalVisible(false)}>
                        <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.modalLabel}>Cole o código compartilhado com você:</Text>
                <TextInput 
                    style={styles.codeInput}
                    placeholder="Ex: 8Xn29s..."
                    placeholderTextColor="#555"
                    value={joinCode}
                    onChangeText={setJoinCode}
                    autoCapitalize="none"
                />
                <TouchableOpacity 
                    style={[styles.modalJoinBtn, (!joinCode || joining) && {opacity: 0.5}]}
                    onPress={handleJoinList}
                    disabled={!joinCode || joining}
                >
                    {joining ? <ActivityIndicator color="#000" /> : <Text style={styles.modalJoinBtnText}>Entrar</Text>}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  background: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Top Bar
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20,
  },
  iconBtn: { width: 40, height: 40, justifyContent:'center' },
  screenTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  addButton: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center'
  },

  listContent: { paddingBottom: 100 },
  
  // Hero Banner
  headerContainer: { paddingHorizontal: 20, marginBottom: 10 },
  heroBanner: {
      flexDirection: 'row', padding: 20, borderRadius: 16, marginBottom: 15,
      alignItems: 'center', gap: 15,
      borderWidth: 1, borderColor: 'rgba(255, 81, 47, 0.1)'
  },
  heroIconCircle: {
      width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255, 81, 47, 0.1)',
      justifyContent: 'center', alignItems: 'center'
  },
  heroTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  heroSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 18 },

  // Join Button
  joinButtonBlock: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.08)', padding: 14, borderRadius: 12, marginBottom: 30,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', gap: 8
  },
  joinButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  sectionTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 15 },

  // Cards
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(28,28,30,0.6)', padding: 16, borderRadius: 16, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  cardIcon: {
      width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)',
      justifyContent: 'center', alignItems: 'center'
  },
  listName: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 2 },
  participantsText: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },

  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#666', marginTop: 15 },
  createLink: { color: '#FF512F', marginTop: 10, fontWeight: 'bold' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1c1c1e', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#333' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalLabel: { color: '#aaa', marginBottom: 12 },
  codeInput: {
      backgroundColor: '#000', color: '#fff', padding: 16, borderRadius: 12,
      borderWidth: 1, borderColor: '#333', fontSize: 16, marginBottom: 20,
      textAlign: 'center', letterSpacing: 3, fontWeight: 'bold'
  },
  modalJoinBtn: { backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center' },
  modalJoinBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 }
});

export default SharedListsScreen;