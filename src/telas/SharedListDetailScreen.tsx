import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Image, ActivityIndicator, Alert, Modal, TextInput, Share, StatusBar, Clipboard 
} from 'react-native';
import axios from 'axios';
import { auth } from '../services/firebaseConfig';
import { 
    getMoviesFromSharedList, 
    addMovieToSharedList, 
    markMovieAsWatchedInSharedList, 
    removeMovieFromSharedList, 
    getMyFriends,
    addFriendsToSharedList,
    SharedMovie 
} from '../services/firebaseActions';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { LinearGradient } from 'expo-linear-gradient';

const TMDB_API_KEY = "157c8aa1011d8ee27cbdbe624298e4a6";
type Props = StackScreenProps<RootStackParamList, 'SharedListDetail'>;

const SharedListDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { listId, listName } = route.params;
  const user = auth.currentUser;

  // Estados da Lista
  const [movies, setMovies] = useState<SharedMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'todo' | 'watched'>('todo');
  
  // Estados de Modais
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Busca Filme
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Adicionar Amigos
  const [myFriends, setMyFriends] = useState<any[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  useEffect(() => { loadMovies(); }, []);

  const loadMovies = async () => {
    try {
      setLoading(true);
      const data = await getMoviesFromSharedList(listId);
      setMovies(data);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  // --- LÓGICA DE CONVITE ---
  const openInviteModal = async () => {
      setShowInviteModal(true);
      if (user) {
          const friends = await getMyFriends(user.uid);
          setMyFriends(friends);
      }
  };

  const toggleFriendSelection = (friendId: string) => {
      if (selectedFriends.includes(friendId)) {
          setSelectedFriends(prev => prev.filter(id => id !== friendId));
      } else {
          setSelectedFriends(prev => [...prev, friendId]);
      }
  };

  const handleAddSelectedFriends = async () => {
      if (selectedFriends.length === 0) return;
      setLoadingFriends(true);
      try {
          await addFriendsToSharedList(listId, selectedFriends);
          Alert.alert("Sucesso", "Amigos adicionados à lista!");
          setShowInviteModal(false);
          setSelectedFriends([]);
      } catch (error) {
          Alert.alert("Erro", "Não foi possível adicionar amigos.");
      } finally {
          setLoadingFriends(false);
      }
  };

  const copyCodeToClipboard = () => {
      Clipboard.setString(listId);
      Alert.alert("Copiado!", "Código da lista copiado.");
  };

  // --- LÓGICA DE FILMES (Igual anterior) ---
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await axios.get(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(searchQuery)}`
      );
      setSearchResults(res.data.results || []);
    } catch (error) {}
  };

  const handleAddMovie = async (movie: any) => {
    if (!user) return;
    try {
      await addMovieToSharedList(listId, user.uid, {
        title: movie.title,
        poster_path: movie.poster_path,
        tmdbId: movie.id
      });
      setShowSearchModal(false);
      setSearchQuery('');
      setSearchResults([]);
      loadMovies();
    } catch (error) { Alert.alert('Erro', 'Não foi possível adicionar.'); }
  };

  const toggleWatched = async (movie: SharedMovie) => {
     if (movie.watched) return;
     try {
         setMovies(prev => prev.map(m => m.id === movie.id ? {...m, watched: true} : m));
         await markMovieAsWatchedInSharedList(listId, movie.id);
     } catch(e) {}
  };

  const handleDelete = (movieId: string) => {
      Alert.alert("Remover", "Tirar da lista?", [
          { text: "Cancelar", style: "cancel" },
          { text: "Remover", style: 'destructive', onPress: async () => {
              setMovies(prev => prev.filter(m => m.id !== movieId));
              await removeMovieFromSharedList(listId, movieId);
          }}
      ]);
  };

  const filteredMovies = movies.filter(m => activeTab === 'todo' ? !m.watched : m.watched);

  // --- RENDER CARD FILME ---
  const renderMovie = ({ item }: { item: SharedMovie }) => (
    <View style={styles.movieCard}>
        <Image 
            source={{ uri: `https://image.tmdb.org/t/p/w154${item.poster_path}` }} 
            style={[styles.poster, item.watched && { opacity: 0.5 }]} 
        />
        <View style={styles.movieInfo}>
            <Text style={styles.movieTitle} numberOfLines={2}>{item.title}</Text>
        </View>
        <View style={styles.actions}>
            {!item.watched ? (
                <TouchableOpacity onPress={() => toggleWatched(item)} style={styles.checkBtn}>
                    <Ionicons name="ellipse-outline" size={28} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>
            ) : (
                <Ionicons name="checkmark-circle" size={28} color="#4ade80" style={{marginRight: 10}} />
            )}
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={20} color="#ff4444" />
            </TouchableOpacity>
        </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1c1c1e', '#000000']} style={styles.background}>
          
          {/* HEADER */}
          <View style={styles.header}>
             <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                <Ionicons name="chevron-back" size={28} color="#fff" />
             </TouchableOpacity>
             
             <View style={{flex:1, alignItems:'center'}}>
                <Text style={styles.headerTitle} numberOfLines={1}>{listName}</Text>
                <Text style={styles.headerSub}>
                    {movies.length} Filmes • {activeTab === 'todo' ? 'A ver' : 'Vistos'}
                </Text>
             </View>

             {/* Botão de Convidar/Membros */}
             <TouchableOpacity onPress={openInviteModal} style={styles.inviteHeaderBtn}>
                <Ionicons name="person-add" size={20} color="#000" />
             </TouchableOpacity>
          </View>

          {/* TABS */}
          <View style={styles.tabContainer}>
              <View style={styles.tabBackground}>
                  <TouchableOpacity 
                     style={[styles.tab, activeTab === 'todo' && styles.activeTab]} 
                     onPress={() => setActiveTab('todo')}
                  >
                      <Text style={[styles.tabText, activeTab === 'todo' && styles.activeTabText]}>A Assistir</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                     style={[styles.tab, activeTab === 'watched' && styles.activeTab]} 
                     onPress={() => setActiveTab('watched')}
                  >
                      <Text style={[styles.tabText, activeTab === 'watched' && styles.activeTabText]}>Já Vistos</Text>
                  </TouchableOpacity>
              </View>
          </View>

          {/* LISTA DE FILMES */}
          {loading ? (
              <View style={styles.center}><ActivityIndicator color="#fff" /></View>
          ) : filteredMovies.length === 0 ? (
              <View style={styles.emptyState}>
                  <Ionicons name={activeTab === 'todo' ? "film-outline" : "checkmark-done-outline"} size={48} color="#333" />
                  <Text style={styles.emptyText}>
                      {activeTab === 'todo' ? "Lista vazia." : "Nenhum filme assistido."}
                  </Text>
                  {activeTab === 'todo' && (
                      <TouchableOpacity onPress={() => setShowSearchModal(true)}>
                          <Text style={styles.addLink}>+ Adicionar Filme</Text>
                      </TouchableOpacity>
                  )}
              </View>
          ) : (
              <FlatList
                 data={filteredMovies}
                 keyExtractor={(item) => item.id}
                 renderItem={renderMovie}
                 contentContainerStyle={{padding: 20, paddingBottom: 100}}
              />
          )}

          {/* FAB ADICIONAR FILME */}
          {activeTab === 'todo' && (
            <TouchableOpacity style={styles.fab} onPress={() => setShowSearchModal(true)} activeOpacity={0.8}>
                <LinearGradient colors={['#FF512F', '#DD2476']} style={styles.fabGradient}>
                    <Ionicons name="add" size={32} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>
          )}

          {/* --- MODAL 1: BUSCA DE FILMES --- */}
          <Modal visible={showSearchModal} animationType="fade" transparent>
              <View style={styles.modalBackdrop}>
                  <View style={styles.modalContent}>
                      <View style={styles.modalHandle} />
                      <Text style={styles.modalTitle}>Adicionar Filme</Text>
                      <View style={styles.searchRow}>
                          <Ionicons name="search" size={20} color="#888" style={{marginRight: 10}} />
                          <TextInput 
                              style={styles.searchInput} 
                              placeholder="Buscar filme..." 
                              placeholderTextColor="#666"
                              value={searchQuery}
                              onChangeText={setSearchQuery}
                              autoFocus
                              returnKeyType="search"
                              onSubmitEditing={handleSearch}
                          />
                      </View>
                      <FlatList 
                          data={searchResults}
                          keyExtractor={(item) => String(item.id)}
                          renderItem={({item}) => (
                              <TouchableOpacity style={styles.resultItem} onPress={() => handleAddMovie(item)}>
                                  {item.poster_path ? (
                                      <Image source={{ uri: `https://image.tmdb.org/t/p/w92${item.poster_path}` }} style={styles.resultPoster} />
                                  ) : <View style={[styles.resultPoster, {backgroundColor: '#333'}]} />}
                                  <View style={{flex:1}}>
                                      <Text style={styles.resultTitle}>{item.title}</Text>
                                      <Text style={{color:'#666', fontSize:12}}>{item.release_date?.split('-')[0]}</Text>
                                  </View>
                                  <Ionicons name="add-circle" size={28} color="#FF512F" />
                              </TouchableOpacity>
                          )}
                      />
                      <TouchableOpacity style={styles.closeBtn} onPress={() => setShowSearchModal(false)}>
                          <Text style={{color:'#fff'}}>Fechar</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </Modal>

          {/* --- MODAL 2: CONVIDAR MEMBROS (AMIGOS + CODIGO) --- */}
          <Modal visible={showInviteModal} animationType="slide" presentationStyle="pageSheet">
              <View style={styles.inviteModalContainer}>
                  <View style={styles.inviteHeader}>
                      <Text style={styles.inviteTitle}>Gerenciar Membros</Text>
                      <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                          <Text style={{color:'#FF512F', fontWeight:'bold'}}>Concluído</Text>
                      </TouchableOpacity>
                  </View>

                  {/* Opção 1: Copiar Código */}
                  <View style={styles.codeSection}>
                      <Text style={styles.sectionLabel}>ENTRAR COM CÓDIGO</Text>
                      <TouchableOpacity style={styles.codeBox} onPress={copyCodeToClipboard}>
                          <Text style={styles.codeText}>{listId}</Text>
                          <Ionicons name="copy-outline" size={20} color="#fff" />
                      </TouchableOpacity>
                      <Text style={styles.helperText}>Toque para copiar e envie para quem não é seu amigo.</Text>
                  </View>

                  {/* Opção 2: Lista de Amigos */}
                  <View style={{flex: 1, paddingHorizontal: 20}}>
                      <Text style={styles.sectionLabel}>ADICIONAR AMIGOS</Text>
                      {myFriends.length === 0 ? (
                          <Text style={styles.emptyFriendsText}>Você ainda não adicionou amigos no app.</Text>
                      ) : (
                          <FlatList 
                              data={myFriends}
                              keyExtractor={(item) => item.uid}
                              renderItem={({item}) => {
                                  const isSelected = selectedFriends.includes(item.uid);
                                  return (
                                      <TouchableOpacity 
                                          style={[styles.friendItem, isSelected && styles.friendItemSelected]}
                                          onPress={() => toggleFriendSelection(item.uid)}
                                      >
                                          <Image 
                                              source={item.photoURL ? { uri: item.photoURL } : require('../../assets/logo.png')} 
                                              style={styles.friendAvatar} 
                                          />
                                          <View style={{flex: 1}}>
                                              <Text style={styles.friendName}>{item.displayName}</Text>
                                              <Text style={styles.friendUser}>@{item.username}</Text>
                                          </View>
                                          <Ionicons 
                                              name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
                                              size={24} 
                                              color={isSelected ? "#FF512F" : "#666"} 
                                          />
                                      </TouchableOpacity>
                                  );
                              }}
                          />
                      )}
                  </View>

                  {selectedFriends.length > 0 && (
                      <View style={styles.inviteFooter}>
                          <TouchableOpacity style={styles.sendInviteBtn} onPress={handleAddSelectedFriends} disabled={loadingFriends}>
                              {loadingFriends ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendInviteText}>Adicionar ({selectedFriends.length})</Text>}
                          </TouchableOpacity>
                      </View>
                  )}
              </View>
          </Modal>

      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  background: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Header
  header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingTop: 60, paddingHorizontal: 15, paddingBottom: 10,
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '600', letterSpacing: 1 },
  iconBtn: { padding: 8 },
  inviteHeaderBtn: { 
      backgroundColor: '#fff', width: 36, height: 36, borderRadius: 18, 
      justifyContent:'center', alignItems:'center' 
  },

  // Tabs
  tabContainer: { paddingHorizontal: 20, marginBottom: 10, marginTop: 10 },
  tabBackground: { flexDirection: 'row', backgroundColor: '#1c1c1e', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#333' },
  tabText: { color: '#666', fontWeight: '600', fontSize: 13 },
  activeTabText: { color: '#fff' },

  // Cards
  movieCard: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 10, borderRadius: 16, padding: 12,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)'
  },
  poster: { width: 50, height: 75, borderRadius: 8, backgroundColor: '#333', marginRight: 15 },
  movieInfo: { flex: 1 },
  movieTitle: { color: '#fff', fontSize: 15, fontWeight: '600', lineHeight: 20 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkBtn: { padding: 5 },
  deleteBtn: { padding: 5, backgroundColor: 'rgba(255, 68, 68, 0.1)', borderRadius: 8 },

  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#666', marginTop: 10 },
  addLink: { color: '#FF512F', marginTop: 15, fontWeight: 'bold' },

  fab: { position: 'absolute', bottom: 30, right: 20 },
  fabGradient: { 
      width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center',
      shadowColor: "#FF512F", shadowOffset: {width:0, height:4}, shadowOpacity: 0.4, shadowRadius: 8
  },

  // Modal Busca
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1c1c1e', height: '85%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#444', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2c2c2e', borderRadius: 12, paddingHorizontal: 15, height: 50, marginBottom: 20 },
  searchInput: { flex: 1, color: '#fff', fontSize: 16 },
  resultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  resultPoster: { width: 40, height: 60, borderRadius: 6, marginRight: 15 },
  resultTitle: { color: '#fff', fontSize:15, fontWeight:'600' },
  closeBtn: { marginTop: 10, padding: 15, backgroundColor: '#333', borderRadius: 12, alignItems: 'center' },

  // --- MODAL INVITE STYLES ---
  inviteModalContainer: { flex: 1, backgroundColor: '#141414' },
  inviteHeader: { 
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
      padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' 
  },
  inviteTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  
  codeSection: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#222', marginBottom: 20 },
  sectionLabel: { color: '#666', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  codeBox: { 
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: '#222', padding: 16, borderRadius: 12, marginBottom: 8 
  },
  codeText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 2 },
  helperText: { color: '#555', fontSize: 12 },

  emptyFriendsText: { color: '#666', fontStyle: 'italic', marginTop: 10 },
  friendItem: { 
      flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: '#222'
  },
  friendItemSelected: { backgroundColor: 'rgba(255, 81, 47, 0.1)', borderRadius: 12, paddingHorizontal: 10 },
  friendAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  friendName: { color: '#fff', fontWeight: '600' },
  friendUser: { color: '#888', fontSize: 12 },

  inviteFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#222' },
  sendInviteBtn: { backgroundColor: '#FF512F', padding: 16, borderRadius: 12, alignItems: 'center' },
  sendInviteText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default SharedListDetailScreen;