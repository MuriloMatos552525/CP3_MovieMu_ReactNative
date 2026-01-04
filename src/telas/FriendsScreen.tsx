import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity, 
  TextInput, Alert, Modal, ActivityIndicator, StatusBar, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../services/firebaseConfig';
import { 
    searchUserByUsername, 
    sendFriendRequest, 
    acceptFriendRequest,
    rejectFriendRequest,
    getFriendRequests,
    getMyFriends, 
    removeFriend,
    getUserProfile 
} from '../services/firebaseActions';

const FriendsScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal Adicionar
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);

  const user = auth.currentUser;

  useFocusEffect(
    useCallback(() => {
        loadData();
    }, [])
  );

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
        const friendsData = await getMyFriends(user.uid);
        const requestsData = await getFriendRequests(user.uid);
        setFriends(friendsData);
        setRequests(requestsData);
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  // --- LÓGICA DE BUSCA E ENVIO ---
  const handleSearchUser = async () => {
      if (!searchQuery.trim()) return;
      setSearchLoading(true);
      setSearchResult(null);
      try {
          const cleanUsername = searchQuery.replace('@', '').toLowerCase().trim();
          
          if (cleanUsername === "") return;

          const foundUser = await searchUserByUsername(cleanUsername);
          
          if (!foundUser) {
              Alert.alert("Ops", "Usuário não encontrado.");
          } else if (foundUser.uid === user?.uid) {
              Alert.alert("Ops", "Você não pode se adicionar.");
          } else {
              // Verifica se já é amigo
              const isAlreadyFriend = friends.some(f => f.uid === foundUser.uid);
              if (isAlreadyFriend) {
                  Alert.alert("Aviso", "Vocês já são amigos.");
              } else {
                  setSearchResult(foundUser);
              }
          }
      } catch (error) {
          Alert.alert("Erro", "Falha na busca.");
      } finally {
          setSearchLoading(false);
      }
  };

  const handleSendRequest = async () => {
      if (!user || !searchResult) return;
      try {
          setSearchLoading(true);
          const myProfile = await getUserProfile(user.uid);
          
          await sendFriendRequest(user.uid, myProfile, searchResult.uid, searchResult);
          
          Alert.alert("Sucesso", `Solicitação enviada para @${searchResult.username}`);
          setModalVisible(false);
          setSearchResult(null);
          setSearchQuery('');
      } catch (error) {
          Alert.alert("Erro", "Não foi possível enviar a solicitação.");
      } finally {
          setSearchLoading(false);
      }
  };

  // --- LÓGICA DE ACEITAR/RECUSAR ---
  const handleAccept = async (request: any) => {
      if (!user) return;
      try {
          const myProfile = await getUserProfile(user.uid);
          await acceptFriendRequest(user.uid, myProfile, request.uid, request);
          loadData(); // Atualiza a lista
      } catch(e) { console.error(e); }
  };

  const handleReject = async (request: any) => {
      if (!user) return;
      try {
          await rejectFriendRequest(user.uid, request.uid);
          loadData();
      } catch(e) { console.error(e); }
  };

  const handleRemoveFriend = (friendId: string) => {
    Alert.alert("Desfazer Amizade", "Tem certeza?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Remover", style: 'destructive', onPress: async () => {
          if(!user) return;
          await removeFriend(user.uid, friendId);
          loadData();
      }}
    ]);
  };

  // --- RENDERIZADORES ---
  const renderFriend = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Image 
        source={item.photoURL ? { uri: item.photoURL } : require('../../assets/logo.png')} 
        style={styles.avatar} 
      />
      <View style={styles.info}>
        <Text style={styles.name}>{item.displayName}</Text>
        <Text style={styles.username}>@{item.username}</Text>
      </View>
      <TouchableOpacity onPress={() => handleRemoveFriend(item.uid)} style={styles.iconBtn}>
         <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );

  const renderRequest = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Image 
        source={item.photoURL ? { uri: item.photoURL } : require('../../assets/logo.png')} 
        style={styles.avatar} 
      />
      <View style={styles.info}>
        <Text style={styles.name}>{item.displayName}</Text>
        <Text style={styles.username}>@{item.username}</Text>
        <Text style={styles.statusText}>Quer ser seu amigo</Text>
      </View>
      <View style={styles.actionsRow}>
          <TouchableOpacity onPress={() => handleReject(item)} style={[styles.actionBtn, styles.rejectBtn]}>
              <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleAccept(item)} style={[styles.actionBtn, styles.acceptBtn]}>
              <Ionicons name="checkmark" size={20} color="#fff" />
          </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1c1c1e', '#000000']} style={styles.background}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Social</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
                <Ionicons name="person-add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Abas */}
          <View style={styles.tabContainer}>
              <TouchableOpacity 
                  style={[styles.tab, activeTab === 'friends' && styles.activeTab]} 
                  onPress={() => setActiveTab('friends')}
              >
                  <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
                      Amigos ({friends.length})
                  </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                  style={[styles.tab, activeTab === 'requests' && styles.activeTab]} 
                  onPress={() => setActiveTab('requests')}
              >
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                      <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>Solicitações</Text>
                      {requests.length > 0 && (
                          <View style={styles.badge}>
                              <Text style={styles.badgeText}>{requests.length}</Text>
                          </View>
                      )}
                  </View>
              </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color="#fff" style={{marginTop: 50}} />
          ) : (
            <FlatList
              data={activeTab === 'friends' ? friends : requests}
              keyExtractor={(item) => item.uid}
              renderItem={activeTab === 'friends' ? renderFriend : renderRequest}
              contentContainerStyle={{padding: 20}}
              ListEmptyComponent={
                <View style={styles.empty}>
                    <Ionicons name={activeTab === 'friends' ? "people-outline" : "notifications-off-outline"} size={48} color="#333" />
                    <Text style={styles.emptyText}>
                        {activeTab === 'friends' ? "Você ainda não tem amigos." : "Nenhuma solicitação pendente."}
                    </Text>
                </View>
              }
            />
          )}

          {/* Modal de Busca */}
          <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Adicionar Amigo</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>
                    
                    <Text style={styles.modalSub}>Digite o nome de usuário (ex: joaosilva):</Text>
                    
                    <View style={styles.searchRow}>
                        <TextInput 
                            style={styles.input}
                            placeholder="@usuario"
                            placeholderTextColor="#666"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TouchableOpacity onPress={handleSearchUser} style={styles.searchBtn}>
                            {searchLoading && !searchResult ? <ActivityIndicator color="#fff" /> : <Ionicons name="search" size={20} color="#fff" />}
                        </TouchableOpacity>
                    </View>

                    {/* Resultado da Busca */}
                    {searchResult && (
                        <View style={styles.resultCard}>
                            <Image 
                                source={searchResult.photoURL ? { uri: searchResult.photoURL } : require('../../assets/logo.png')} 
                                style={styles.resultAvatar} 
                            />
                            <View style={{flex: 1}}>
                                <Text style={styles.resultName}>{searchResult.fullName || searchResult.displayName}</Text>
                                <Text style={styles.resultUser}>@{searchResult.username}</Text>
                            </View>
                            <TouchableOpacity onPress={handleSendRequest} style={styles.sendBtn}>
                                <Text style={styles.sendBtnText}>Enviar</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
          </Modal>

      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  background: { flex: 1 },
  
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: 20, paddingBottom: 20,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent:'center', alignItems:'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FF512F', justifyContent: 'center', alignItems: 'center' },

  // Tabs
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10 },
  tab: { marginRight: 20, paddingBottom: 10 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#fff' },
  tabText: { color: '#666', fontSize: 16, fontWeight: '600' },
  activeTabText: { color: '#fff' },
  badge: { backgroundColor: '#ff4444', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  // List Item
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 16, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#333' },
  info: { flex: 1, marginLeft: 15 },
  name: { color: '#fff', fontSize: 16, fontWeight: '600' },
  username: { color: '#888', fontSize: 13 },
  statusText: { color: '#FF512F', fontSize: 12, marginTop: 2 },
  
  iconBtn: { padding: 10 },

  // Ações de Solicitação
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  rejectBtn: { backgroundColor: 'rgba(255,255,255,0.1)' },
  acceptBtn: { backgroundColor: '#4ade80' },

  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#666', marginTop: 15 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1c1c1e', padding: 24, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  modalSub: { color: '#aaa', marginBottom: 15 },
  
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  input: { 
      flex: 1, backgroundColor: '#000', color: '#fff', padding: 15, borderRadius: 12, 
      borderWidth: 1, borderColor: '#333', fontSize: 16 
  },
  searchBtn: { width: 50, backgroundColor: '#333', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  // Resultado
  resultCard: { 
      flexDirection: 'row', alignItems: 'center', backgroundColor: '#2c2c2e', 
      padding: 12, borderRadius: 12, marginTop: 10 
  },
  resultAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  resultName: { color: '#fff', fontWeight: 'bold' },
  resultUser: { color: '#aaa', fontSize: 12 },
  sendBtn: { backgroundColor: '#FF512F', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  sendBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 }
});

export default FriendsScreen;