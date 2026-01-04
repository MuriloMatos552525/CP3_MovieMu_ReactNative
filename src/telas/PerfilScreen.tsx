import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  StatusBar,
  Platform,
  Alert,
  Dimensions
} from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../services/firebaseConfig";
import {
  getUserProfile,
  createOrUpdateUserDoc,
  setTop5Movie, 
  getSharedListsByUser,
  checkUsernameExists
} from "../services/firebaseActions";
import axios from "axios";
import { LinearGradient } from 'expo-linear-gradient';
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../../App"; 

const { width } = Dimensions.get('window');
const TMDB_API_KEY = "157c8aa1011d8ee27cbdbe624298e4a6";

type Props = StackScreenProps<RootStackParamList, "Perfil">;

interface UserProfile {
  uid: string;
  fullName?: string;
  displayName?: string; // Compatibilidade
  username?: string;
  email?: string;
  photoURL?: string;
  bio?: string;
  friends?: string[];
  lastUsernameChange?: any; // Timestamp do Firestore
  top5?: {
    [pos: number]: {
      id: number;
      title: string;
      poster_path?: string;
    };
  };
}

const PerfilScreen: React.FC<Props> = ({ navigation }) => {
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [myLists, setMyLists] = useState<any[]>([]);
  
  // Estados de Edição (Modal)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPhoto, setEditPhoto] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Estados Top 5
  const [showTop5Modal, setShowTop5Modal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      loadData(user.uid);
    }, [user])
  );

  const loadData = async (uid: string) => {
    try {
      const userData = await getUserProfile(uid);
      setProfile(userData);
      const lists = await getSharedListsByUser(uid);
      setMyLists(lists);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE EDIÇÃO ---
  const openEditModal = () => {
    if (profile) {
      setEditName(profile.fullName || profile.displayName || "");
      setEditUsername(profile.username || "");
      setEditBio(profile.bio || "");
      setEditPhoto(profile.photoURL || "");
      setShowEditModal(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);

    try {
      // Validação de Username (Regra dos 3 Meses - Simulação Lógica)
      const currentUsername = profile?.username;
      const newUsername = editUsername.trim().toLowerCase();
      
      // Se mudou o username, verifica disponibilidade
      if (currentUsername !== newUsername) {
        // Aqui você verificaria profile.lastUsernameChange no backend
        // Para este exemplo, vamos permitir a mudança mas salvar a data
        const exists = await checkUsernameExists(newUsername);
        if (exists) {
          Alert.alert("Indisponível", "Este nome de usuário já está em uso.");
          setSavingProfile(false);
          return;
        }
      }

      await createOrUpdateUserDoc(user.uid, {
        fullName: editName,
        username: newUsername,
        bio: editBio,
        photoURL: editPhoto,
        // Se mudou o username, atualiza a data
        ...(currentUsername !== newUsername && { lastUsernameChange: new Date() }) 
      });

      await loadData(user.uid);
      setShowEditModal(false);
    } catch (error) {
      Alert.alert("Erro", "Falha ao salvar perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  // --- LÓGICA TOP 5 ---
  const handleSearchMovie = async () => {
    if (!searchQuery.trim()) return;
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(searchQuery)}`
      );
      setSearchResults(response.data.results || []);
    } catch (error) {
      Alert.alert("Erro", "Falha na busca.");
    }
  };

  const handleSelectMovieForTop5 = async (movie: any) => {
    if (!selectedPosition || !user) return;
    try {
      await setTop5Movie(user.uid, selectedPosition, {
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
      });
      loadData(user.uid);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível adicionar.");
    } finally {
      setShowTop5Modal(false);
      setSearchResults([]);
      setSearchQuery("");
    }
  };

  const renderShelf = () => {
    const slots = [1, 2, 3, 4, 5];
    return (
      <View style={styles.shelfContainer}>
        {slots.map((pos) => {
          const movie = profile?.top5?.[pos];
          return (
            <TouchableOpacity 
                key={pos} 
                style={styles.shelfSlot}
                activeOpacity={0.7}
                onPress={() => {
                    setSelectedPosition(pos);
                    setShowTop5Modal(true);
                }}
            >
              {movie ? (
                <Image 
                    source={{ uri: `https://image.tmdb.org/t/p/w342${movie.poster_path}` }} 
                    style={styles.shelfImage}
                />
              ) : (
                <View style={styles.emptySlot}>
                    <Ionicons name="add" size={20} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.emptySlotText}>{pos}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  if (loading && !profile) {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
        </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Premium */}
      <LinearGradient
          colors={['#1a1a1a', '#000000']}
          style={styles.background}
      >
        {/* Topo Fixo com Voltar */}
        <View style={styles.topNav}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            {/* Ícone de Configuração Rápida */}
            <TouchableOpacity onPress={openEditModal} style={styles.navBtn}>
                <Ionicons name="settings-outline" size={20} color="#fff" />
            </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            
            {/* --- CABEÇALHO --- */}
            <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                    <Image
                        source={
                            profile?.photoURL 
                            ? { uri: profile.photoURL }
                            : require("../../assets/logo.png") 
                        }
                        style={styles.avatar}
                    />
                </View>

                <View style={styles.identityContainer}>
                    <Text style={styles.fullName}>{profile?.fullName || profile?.displayName || "Usuário"}</Text>
                    <Text style={styles.username}>@{profile?.username || "usuario"}</Text>
                </View>

                {/* Estatísticas / Social */}
                <View style={styles.statsRow}>
                    <TouchableOpacity onPress={() => navigation.navigate('Friends')} style={styles.statItem}>
                        <Text style={styles.statValue}>{profile?.friends?.length || 0}</Text>
                        <Text style={styles.statLabel}>Amigos</Text>
                    </TouchableOpacity>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{myLists.length}</Text>
                        <Text style={styles.statLabel}>Listas</Text>
                    </View>
                </View>

                {/* Bio */}
                {profile?.bio ? (
                    <Text style={styles.bioText}>{profile.bio}</Text>
                ) : null}

                {/* Botão Editar Principal */}
                <TouchableOpacity style={styles.editProfileBtn} onPress={openEditModal}>
                    <Text style={styles.editProfileText}>Editar Perfil</Text>
                </TouchableOpacity>
            </View>

            {/* --- SEÇÃO TOP 5 --- */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>MEU TOP 5</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 20}}>
                    {renderShelf()}
                </ScrollView>
            </View>

            {/* --- SEÇÃO MENU / CONFIGURAÇÕES (Estilo Ajustes iOS) --- */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>MINHA CONTA</Text>
                <View style={styles.menuList}>
                    
                    {/* Histórico */}
                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ReviewsHistory')}>
                        <View style={styles.menuIconBox}><Ionicons name="time" size={18} color="#FF512F" /></View>
                        <Text style={styles.menuText}>Histórico de Reviews</Text>
                        <Ionicons name="chevron-forward" size={16} color="#333" />
                    </TouchableOpacity>

                    {/* Listas */}
                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SharedLists')}>
                        <View style={styles.menuIconBox}><Ionicons name="layers" size={18} color="#FF512F" /></View>
                        <Text style={styles.menuText}>Minhas Coleções</Text>
                        <Ionicons name="chevron-forward" size={16} color="#333" />
                    </TouchableOpacity>

                    {/* Email (Info Estática) */}
                    <View style={styles.menuItem}>
                        <View style={styles.menuIconBox}><Ionicons name="mail" size={18} color="#666" /></View>
                        <View style={{flex:1}}>
                            <Text style={styles.menuLabel}>Email</Text>
                            <Text style={styles.menuValue}>{user?.email}</Text>
                        </View>
                        <Ionicons name="lock-closed" size={14} color="#333" />
                    </View>

                    {/* Logout */}
                    <TouchableOpacity style={[styles.menuItem, {borderBottomWidth: 0}]} onPress={() => auth.signOut()}>
                        <View style={styles.menuIconBox}><Ionicons name="log-out" size={18} color="#ff4444" /></View>
                        <Text style={[styles.menuText, {color: '#ff4444'}]}>Sair da Conta</Text>
                    </TouchableOpacity>

                </View>
            </View>

            <View style={{height: 50}} />
        </ScrollView>
      </LinearGradient>

      {/* --- MODAL DE EDIÇÃO DE PERFIL --- */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.editModalContainer}>
              <View style={styles.editHeader}>
                  <TouchableOpacity onPress={() => setShowEditModal(false)}>
                      <Text style={{color: '#fff', fontSize: 16}}>Cancelar</Text>
                  </TouchableOpacity>
                  <Text style={styles.editTitle}>Editar Perfil</Text>
                  <TouchableOpacity onPress={handleSaveProfile} disabled={savingProfile}>
                      {savingProfile ? <ActivityIndicator color="#fff" /> : <Text style={{color: '#FF512F', fontSize: 16, fontWeight: 'bold'}}>Salvar</Text>}
                  </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{padding: 20}}>
                  {/* Foto */}
                  <View style={{alignItems: 'center', marginBottom: 30}}>
                      <Image source={editPhoto ? {uri: editPhoto} : require("../../assets/logo.png")} style={styles.editAvatar} />
                      <Text style={{color: '#FF512F', marginTop: 10, fontSize: 13}}>Alterar Foto (URL)</Text>
                      <TextInput 
                          style={styles.urlInput}
                          placeholder="Cole o link da imagem aqui"
                          placeholderTextColor="#444"
                          value={editPhoto}
                          onChangeText={setEditPhoto}
                      />
                  </View>

                  <Text style={styles.inputLabel}>NOME COMPLETO</Text>
                  <TextInput 
                      style={styles.modalInput} 
                      value={editName} 
                      onChangeText={setEditName} 
                      placeholderTextColor="#555"
                  />

                  <Text style={styles.inputLabel}>NOME DE USUÁRIO</Text>
                  <TextInput 
                      style={styles.modalInput} 
                      value={editUsername} 
                      onChangeText={(t) => setEditUsername(t.toLowerCase().trim())} 
                      placeholderTextColor="#555"
                      autoCapitalize="none"
                  />
                  <Text style={styles.helperText}>
                      <Ionicons name="information-circle" /> O nome de usuário só pode ser alterado a cada 90 dias.
                  </Text>

                  <Text style={[styles.inputLabel, {marginTop: 20}]}>BIO</Text>
                  <TextInput 
                      style={[styles.modalInput, {height: 80, textAlignVertical: 'top'}]} 
                      value={editBio} 
                      onChangeText={setEditBio} 
                      multiline
                      maxLength={150}
                      placeholder="Conte um pouco sobre você..."
                      placeholderTextColor="#555"
                  />
              </ScrollView>
          </View>
      </Modal>

      {/* --- MODAL BUSCA FILME (Igual anterior) --- */}
      <Modal visible={showTop5Modal} animationType="fade" transparent onRequestClose={() => setShowTop5Modal(false)}>
          <View style={styles.modalOverlay}>
              <View style={styles.modalPanel}>
                  <View style={styles.dragHandle} />
                  <Text style={styles.modalHeading}>Adicionar ao Top 5</Text>
                  <View style={styles.searchBar}>
                      <Ionicons name="search" size={18} color="#666" />
                      <TextInput 
                          style={styles.searchInput}
                          placeholder="Buscar filme..."
                          placeholderTextColor="#666"
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          autoFocus
                          onSubmitEditing={handleSearchMovie}
                      />
                  </View>
                  <FlatList 
                      data={searchResults}
                      keyExtractor={(item) => String(item.id)}
                      renderItem={({item}) => (
                          <TouchableOpacity style={styles.searchResult} onPress={() => handleSelectMovieForTop5(item)}>
                              <Image source={item.poster_path ? { uri: `https://image.tmdb.org/t/p/w92${item.poster_path}` } : undefined} style={styles.searchPoster} />
                              <View style={{flex:1, justifyContent:'center'}}>
                                  <Text style={styles.searchTitle}>{item.title}</Text>
                                  <Text style={styles.searchYear}>{item.release_date?.split('-')[0]}</Text>
                              </View>
                              <Ionicons name="add-circle-outline" size={24} color="#fff" />
                          </TouchableOpacity>
                      )}
                  />
                  <TouchableOpacity style={styles.closeBtn} onPress={() => setShowTop5Modal(false)}>
                      <Text style={{color:'#fff'}}>Fechar</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#000' },
  background: { flex: 1 },
  
  topNav: {
      flexDirection: 'row', justifyContent: 'space-between', 
      paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: 20, zIndex: 10
  },
  navBtn: {
      width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)',
      justifyContent: 'center', alignItems: 'center'
  },
  content: { paddingTop: 20 },

  // HEADER
  profileHeader: { alignItems: 'center', marginBottom: 30, paddingHorizontal: 20 },
  avatarContainer: { marginBottom: 15 },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#1c1c1e' },
  
  identityContainer: { alignItems: 'center', marginBottom: 15 },
  fullName: { color: '#fff', fontSize: 22, fontWeight: '700' },
  username: { color: '#888', fontSize: 14, fontWeight: '500', marginTop: 2 },

  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 30 },
  statItem: { alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: '#666', fontSize: 12 },
  statDivider: { width: 1, height: 20, backgroundColor: '#333' },

  bioText: { color: '#ccc', textAlign: 'center', marginBottom: 20, fontSize: 14, lineHeight: 20, paddingHorizontal: 20 },

  editProfileBtn: {
      backgroundColor: '#1c1c1e', paddingHorizontal: 25, paddingVertical: 10, borderRadius: 20,
      borderWidth: 1, borderColor: '#333'
  },
  editProfileText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  // SECTIONS
  section: { marginBottom: 35 },
  sectionTitle: { color: '#555', fontSize: 11, fontWeight: '800', letterSpacing: 1, paddingLeft: 20, marginBottom: 15 },

  // SHELF
  shelfContainer: { flexDirection: 'row', gap: 12 },
  shelfSlot: {
    width: 90, height: 135, borderRadius: 8, backgroundColor: '#1c1c1e',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
    borderWidth: 1, borderColor: '#2c2c2e'
  },
  shelfImage: { width: '100%', height: '100%' },
  emptySlot: { alignItems: 'center' },
  emptySlotText: { color: '#444', fontSize: 12, fontWeight: 'bold', marginTop: 5 },

  // MENU LIST (SETTINGS)
  menuList: {
      backgroundColor: '#1c1c1e', borderRadius: 16, marginHorizontal: 20,
      borderWidth: 1, borderColor: '#2c2c2e'
  },
  menuItem: {
      flexDirection: 'row', alignItems: 'center', padding: 16,
      borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', gap: 15
  },
  menuIconBox: { width: 30, alignItems: 'center' },
  menuText: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '500' },
  menuLabel: { color: '#888', fontSize: 12 },
  menuValue: { color: '#fff', fontSize: 15 },

  // EDIT MODAL
  editModalContainer: { flex: 1, backgroundColor: '#141414' },
  editHeader: { 
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
      padding: 20, borderBottomWidth: 1, borderBottomColor: '#222'
  },
  editTitle: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  editAvatar: { width: 80, height: 80, borderRadius: 40 },
  
  inputLabel: { color: '#666', fontSize: 11, fontWeight: 'bold', marginBottom: 8, marginTop: 15 },
  modalInput: { 
      backgroundColor: '#1c1c1e', borderRadius: 10, padding: 15, 
      color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#333'
  },
  urlInput: {
      backgroundColor: '#1c1c1e', borderRadius: 8, padding: 10, marginTop: 10,
      color: '#fff', width: '100%', textAlign: 'center', fontSize: 12
  },
  helperText: { color: '#444', fontSize: 12, marginTop: 8 },

  // SEARCH MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalPanel: { backgroundColor: '#1c1c1e', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '85%', padding: 20 },
  dragHandle: { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeading: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a2a', borderRadius: 10, paddingHorizontal: 12, height: 46, marginBottom: 20 },
  searchInput: { flex: 1, marginLeft: 10, color: '#fff' },
  searchResult: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#333' },
  searchPoster: { width: 30, height: 45, borderRadius: 4, marginRight: 12, backgroundColor: '#222' },
  searchTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  searchYear: { color: '#666', fontSize: 12 },
  closeBtn: { marginTop: 10, alignItems: 'center', padding: 15 },
});

export default PerfilScreen;