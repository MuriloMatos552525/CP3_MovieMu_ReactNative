import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Image, ActivityIndicator, StatusBar, Dimensions, Animated, PanResponder, Alert, ScrollView 
} from 'react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../services/firebaseConfig';
import { 
    getMyFriends, 
    createSharedList,
    addFriendsToSharedList,
    getOrCreateMatchSession, 
    getSwipedMovieIds, 
    voteMovie,
    getSharedListsByUser,
    findOrCreateOneOnOneList, // Important: Ensures we reuse lists
    SharedList
} from '../services/firebaseActions';

const { width, height } = Dimensions.get('window');
const TMDB_API_KEY = "157c8aa1011d8ee27cbdbe624298e4a6";

// --- STATIC DATA ---
const GENRES = [
  { id: '28', name: 'Ação' }, { id: '12', name: 'Aventura' }, { id: '35', name: 'Comédia' },
  { id: '18', name: 'Drama' }, { id: '27', name: 'Terror' }, { id: '10749', name: 'Romance' },
  { id: '878', name: 'Sci-Fi' }, { id: '16', name: 'Animação' }, { id: '53', name: 'Suspense' },
  { id: '99', name: 'Doc' },
];

const PROVIDERS = [
  { id: '8', name: 'Netflix', logo: 'https://image.tmdb.org/t/p/original/t2yyOv40HZeVlLjDao9Wl4gGYd.jpg', color: '#E50914' },
  { id: '119', name: 'Prime Video', logo: 'https://image.tmdb.org/t/p/original/emthp39XA2YScoU8t5t7TB38rBD.jpg', color: '#00A8E1' },
  { id: '337', name: 'Disney+', logo: 'https://image.tmdb.org/t/p/original/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg', color: '#113CCF' },
  { id: '1899', name: 'Max', logo: 'https://image.tmdb.org/t/p/original/fksCUZ9QDWZuzjo3VWOHaCO2aeq.jpg', color: '#002BE7' }, 
  { id: '307', name: 'Globoplay', logo: 'https://image.tmdb.org/t/p/original/cDj3L5b2728B5B1lQ0fXwW1YJ8.jpg', color: '#FB6B02' },
  { id: '350', name: 'Apple TV+', logo: 'https://image.tmdb.org/t/p/original/2E03IAfX1VkLWtl20y1dQ0fLIMJ.jpg', color: '#FFFFFF' },
];

const MatchScreen = ({ navigation }: any) => {
  const user = auth.currentUser;

  // --- SCREEN MODES ---
  const [viewMode, setViewMode] = useState<'dashboard' | 'config' | 'swipe'>('dashboard');

  // Data
  const [friends, setFriends] = useState<any[]>([]);
  const [activeLists, setActiveLists] = useState<SharedList[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Configuration
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [targetFriend, setTargetFriend] = useState<any>(null); 
  
  // Active Session
  const [currentListName, setCurrentListName] = useState('');
  const [currentListId, setCurrentListId] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Movies (Ref is crucial for swipe performance/closure issues)
  const [movies, setMovies] = useState<any[]>([]);
  const moviesRef = useRef<any[]>([]);

  useEffect(() => {
    moviesRef.current = movies;
  }, [movies]);

  // --- ANIMATIONS ---
  const position = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 120) forceSwipe('right');
        else if (gesture.dx < -120) forceSwipe('left');
        else resetPosition();
      },
    })
  ).current;

  // --- INITIAL LOAD ---
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      loadDashboardData();
    }, [user])
  );

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [friendsData, listsData] = await Promise.all([
          getMyFriends(user!.uid),
          getSharedListsByUser(user!.uid)
      ]);
      setFriends(friendsData);
      setActiveLists(listsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- CONFIG HANDLERS ---
  const handleStartNewConfig = (friend: any) => {
      setTargetFriend(friend);
      setSelectedGenres([]);
      setSelectedProviders([]);
      setViewMode('config');
  };

  const toggleGenre = (id: string) => {
    if (selectedGenres.includes(id)) setSelectedGenres(prev => prev.filter(g => g !== id));
    else setSelectedGenres(prev => [...prev, id]);
  };

  const toggleProvider = (id: string) => {
    if (selectedProviders.includes(id)) setSelectedProviders(prev => prev.filter(p => p !== id));
    else setSelectedProviders(prev => [...prev, id]);
  };

  // --- GAME START LOGIC ---

  const startNewSession = async () => {
    if (!user || !targetFriend) return;
    
    // Check provider selection
    if (selectedProviders.length === 0) {
        Alert.alert("Aviso", "Sem streaming selecionado, mostraremos todos os filmes.", [
            { text: "Continuar", onPress: () => runGameSetup(null) },
            { text: "Voltar", style: 'cancel' }
        ]);
    } else {
        runGameSetup(null);
    }
  };

  const resumeSession = async (list: SharedList) => {
      runGameSetup(list);
  };

  const runGameSetup = async (existingList: SharedList | null) => {
    setLoading(true);
    try {
        let listId = '';
        let listName = '';

        if (existingList) {
            // Resuming existing
            listId = existingList.id;
            listName = existingList.listName;
        } else {
            // Creating new or finding 1x1 list
            listId = await findOrCreateOneOnOneList(
                user!.uid, 
                targetFriend.uid, 
                targetFriend.displayName, 
                user!.displayName || "User"
            );
            listName = `Match: ${user?.displayName?.split(' ')[0]} & ${targetFriend.displayName?.split(' ')[0]}`;
        }

        setCurrentListId(listId);
        setCurrentListName(listName);

        // Manage Session & Filters
        const genresString = existingList ? undefined : selectedGenres.join('|'); 
        const session = await getOrCreateMatchSession(listId, genresString);
        setSessionId(session.id);

        const activeGenreFilters = session.filters?.genreId || genresString || '';
        const swipedIds = await getSwipedMovieIds(listId, session.id);
        
        // TMDB Query
        let url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&sort_by=popularity.desc&include_adult=false&page=1`;
        
        if (activeGenreFilters) url += `&with_genres=${activeGenreFilters}`;
        
        if (!existingList && selectedProviders.length > 0) {
            url += `&with_watch_providers=${selectedProviders.join('|')}&watch_region=BR`;
        }

        const res = await axios.get(url);
        
        // Filter seen movies
        const newMovies = res.data.results.filter((m: any) => !swipedIds.includes(m.id));
        
        if (newMovies.length === 0) {
            Alert.alert("Tudo Visto!", "Não há mais filmes novos com esses filtros.");
            setLoading(false);
            return;
        }

        setMovies(newMovies);
        setViewMode('swipe');

    } catch (error) {
        Alert.alert("Erro", "Falha ao carregar sessão.");
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  // --- SWIPE LOGIC ---
  const forceSwipe = (direction: 'right' | 'left') => {
    const xValue = direction === 'right' ? width + 100 : -width - 100;
    Animated.timing(position, { toValue: { x: xValue, y: 0 }, duration: 250, useNativeDriver: false }).start(() => onSwipeComplete(direction));
  };

  const onSwipeComplete = (direction: 'right' | 'left') => {
    const currentMovies = moviesRef.current;
    if (currentMovies.length === 0) return;

    const swipedMovie = currentMovies[0];
    const remainingMovies = currentMovies.slice(1);

    // Update state
    setMovies(remainingMovies); 
    position.setValue({ x: 0, y: 0 });

    // Send to DB
    if (currentListId && sessionId && user) {
       voteMovie(currentListId, sessionId, swipedMovie, direction);
    }
  };

  const resetPosition = () => {
    Animated.spring(position, { toValue: { x: 0, y: 0 }, friction: 4, useNativeDriver: false }).start();
  };

  // Interpolation
  const rotate = position.x.interpolate({ inputRange: [-width/2, 0, width/2], outputRange: ['-8deg', '0deg', '8deg'], extrapolate: 'clamp' });
  const likeOpacity = position.x.interpolate({ inputRange: [10, width/4], outputRange: [0, 1], extrapolate: 'clamp' });
  const nopeOpacity = position.x.interpolate({ inputRange: [-width/4, -10], outputRange: [1, 0], extrapolate: 'clamp' });
  const nextCardOpacity = position.x.interpolate({ inputRange: [-width/2, 0, width/2], outputRange: [1, 0.7, 1], extrapolate: 'clamp' });
  const nextCardScale = position.x.interpolate({ inputRange: [-width/2, 0, width/2], outputRange: [1, 0.95, 1], extrapolate: 'clamp' });

  // --- RENDERERS ---

  const renderDashboard = () => (
    <LinearGradient colors={['#141414', '#000000']} style={styles.background}>
        <ScrollView contentContainerStyle={{paddingBottom: 120, paddingTop: 60}}>
            <View style={styles.paddingH}>
                <Text style={styles.headerTitle}>CineMatch 🔥</Text>
                <Text style={styles.headerSub}>Encontre o filme perfeito em grupo.</Text>
            </View>

            <Text style={styles.sectionTitle}>INICIAR NOVO MATCH</Text>
            {friends.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Text style={{color:'#666'}}>Adicione amigos no perfil para jogar.</Text>
                </View>
            ) : (
                <FlatList 
                    horizontal showsHorizontalScrollIndicator={false}
                    data={friends}
                    keyExtractor={item => item.uid}
                    contentContainerStyle={{paddingLeft: 20}}
                    renderItem={({item}) => (
                        <TouchableOpacity style={styles.friendAvatarItem} onPress={() => handleStartNewConfig(item)}>
                            <Image source={item.photoURL ? { uri: item.photoURL } : require('../../assets/logo.png')} style={styles.avatarLarge} />
                            <Text style={styles.friendNameSmall} numberOfLines={1}>{item.displayName?.split(' ')[0]}</Text>
                            <View style={styles.addIconBadge}><Ionicons name="add" size={16} color="#fff" /></View>
                        </TouchableOpacity>
                    )}
                />
            )}

            <Text style={[styles.sectionTitle, {marginTop: 30}]}>CONTINUAR JOGANDO</Text>
            {activeLists.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Ionicons name="albums-outline" size={30} color="#333" />
                    <Text style={{color:'#444', marginTop:5}}>Nenhuma lista ativa encontrada.</Text>
                </View>
            ) : (
                activeLists.map(list => (
                    <TouchableOpacity key={list.id} style={styles.activeListCard} onPress={() => resumeSession(list)}>
                        <View style={styles.listIconBox}>
                            <Ionicons name="play" size={20} color="#000" />
                        </View>
                        <View style={{flex:1}}>
                            <Text style={styles.activeListTitle}>{list.listName}</Text>
                            <Text style={styles.activeListSub}>{list.participants.length} participantes</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#333" />
                    </TouchableOpacity>
                ))
            )}
        </ScrollView>
    </LinearGradient>
  );

  const renderConfig = () => (
    <LinearGradient colors={['#141414', '#000000']} style={styles.background}>
        <View style={styles.configHeader}>
            <TouchableOpacity onPress={() => setViewMode('dashboard')} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.configTitle}>Configurar Sessão</Text>
            <View style={{width: 40}} />
        </View>

        <ScrollView contentContainerStyle={{paddingBottom: 150}}>
            <View style={styles.configSection}>
                <Text style={styles.configLabel}>COM QUEM?</Text>
                <View style={styles.targetFriendCard}>
                    <Image source={targetFriend?.photoURL ? { uri: targetFriend.photoURL } : require('../../assets/logo.png')} style={styles.avatarSmall} />
                    <Text style={styles.targetName}>{targetFriend?.displayName}</Text>
                </View>
            </View>

            <View style={styles.configSection}>
                <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                    <Text style={styles.configLabel}>GÊNEROS</Text>
                    <Text style={{color:'#FF512F', fontSize:12}}>{selectedGenres.length} selecionado(s)</Text>
                </View>
                <View style={styles.genreGrid}>
                    {GENRES.map(g => (
                        <TouchableOpacity 
                            key={g.id} 
                            style={[styles.genrePill, selectedGenres.includes(g.id) && styles.genrePillActive]}
                            onPress={() => toggleGenre(g.id)}
                        >
                            <Text style={[styles.genreText, selectedGenres.includes(g.id) && {color:'#000', fontWeight:'bold'}]}>{g.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.configSection}>
                <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                    <Text style={styles.configLabel}>STREAMING (BRASIL)</Text>
                    <Text style={{color:'#FF512F', fontSize:12}}>{selectedProviders.length} selecionado(s)</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingVertical:10}}>
                    {PROVIDERS.map(p => {
                        const isActive = selectedProviders.includes(p.id);
                        return (
                            <TouchableOpacity 
                                key={p.id} 
                                style={[styles.providerItem, isActive && {borderColor: p.color, transform:[{scale:1.1}]}]}
                                onPress={() => toggleProvider(p.id)}
                            >
                                <Image source={{uri: p.logo}} style={styles.providerImg} />
                                {isActive && <View style={[styles.checkBadge, {backgroundColor: p.color}]}><Ionicons name="checkmark" size={8} color="#fff"/></View>}
                            </TouchableOpacity>
                        )
                    })}
                </ScrollView>
            </View>
        </ScrollView>

        <View style={styles.bottomFloat}>
            <TouchableOpacity style={styles.startBigBtn} onPress={startNewSession}>
                {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.startBigText}>COMEÇAR MATCH</Text>}
            </TouchableOpacity>
        </View>
    </LinearGradient>
  );

  const renderSwipe = () => (
    <View style={styles.container}>
        <StatusBar hidden />
        <View style={styles.gameHeader}>
            <TouchableOpacity onPress={() => setViewMode('dashboard')} style={styles.iconCircle}>
                <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <View>
                <Text style={styles.gameTitle} numberOfLines={1}>{currentListName}</Text>
                <Text style={{color:'#666', textAlign:'center', fontSize:10}}>Deslize para votar</Text>
            </View>
            <View style={{width: 40}} />
        </View>

        <View style={styles.deck}>
            {movies.length === 0 ? (
                <View style={{alignItems:'center'}}>
                    <Ionicons name="film-outline" size={60} color="#333" />
                    <Text style={{color:'#fff', fontSize:20, fontWeight:'bold', marginTop:20}}>Fim da Pilha!</Text>
                    <TouchableOpacity onPress={() => setViewMode('dashboard')} style={styles.backBtn}>
                        <Text style={{color:'#000', fontWeight:'bold'}}>Voltar ao Menu</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                movies.map((item, index) => {
                    if (index === 0) {
                        return (
                            <Animated.View key={item.id} style={[styles.card, { transform: [{translateX:position.x}, {translateY:position.y}, {rotate:rotate}], zIndex:2 }]} {...panResponder.panHandlers}>
                                <Image source={{ uri: `https://image.tmdb.org/t/p/w780${item.poster_path}` }} style={styles.cardImage} />
                                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.95)']} style={styles.cardGradient}>
                                    <Text style={styles.cardTitle}>{item.title}</Text>
                                    <View style={styles.cardMeta}>
                                        <Text style={styles.rating}>⭐ {item.vote_average}</Text>
                                        <Text style={styles.year}>{item.release_date?.split('-')[0]}</Text>
                                    </View>
                                </LinearGradient>
                                <Animated.View style={[styles.label, {left:40, borderColor:'#4ade80', transform:[{rotate:'-15deg'}], opacity:likeOpacity}]}>
                                    <Text style={{color:'#4ade80', fontSize:32, fontWeight:'800'}}>QUERO</Text>
                                </Animated.View>
                                <Animated.View style={[styles.label, {right:40, borderColor:'#FF4444', transform:[{rotate:'15deg'}], opacity:nopeOpacity}]}>
                                    <Text style={{color:'#FF4444', fontSize:32, fontWeight:'800'}}>PASSO</Text>
                                </Animated.View>
                            </Animated.View>
                        )
                    } else if (index === 1) {
                        return (
                            <Animated.View key={item.id} style={[styles.card, {zIndex:1, opacity:nextCardOpacity, transform:[{scale:nextCardScale}]}]}>
                                <Image source={{ uri: `https://image.tmdb.org/t/p/w780${item.poster_path}` }} style={styles.cardImage} />
                                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.95)']} style={styles.cardGradient}>
                                    <Text style={styles.cardTitle}>{item.title}</Text>
                                </LinearGradient>
                            </Animated.View>
                        )
                    }
                    return null;
                }).reverse()
            )}
        </View>

        <View style={styles.controls}>
            <TouchableOpacity style={[styles.controlBtn, {borderColor:'#FF4444'}]} onPress={() => forceSwipe('left')}>
                <Ionicons name="close" size={30} color="#FF4444" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.controlBtn, {borderColor:'#666'}]} onPress={() => Alert.alert("Sinopse", movies[0]?.overview)}>
                <Ionicons name="information" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.controlBtn, {borderColor:'#4ade80'}]} onPress={() => forceSwipe('right')}>
                <Ionicons name="heart" size={30} color="#4ade80" />
            </TouchableOpacity>
        </View>
    </View>
  );

  if (viewMode === 'config') return renderConfig();
  if (viewMode === 'swipe') return renderSwipe();
  return renderDashboard();
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  background: { flex: 1 },
  paddingH: { paddingHorizontal: 20 },
  
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '800' },
  headerSub: { color: '#666', fontSize: 16, marginTop: 5, marginBottom: 30 },
  sectionTitle: { color: '#666', fontSize: 12, fontWeight: 'bold', marginLeft: 20, marginBottom: 15, letterSpacing: 1 },

  friendAvatarItem: { alignItems:'center', marginRight: 20 },
  avatarLarge: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: '#333' },
  friendNameSmall: { color: '#fff', marginTop: 8, fontSize: 12, width: 70, textAlign:'center' },
  addIconBadge: { position:'absolute', bottom: 20, right: 0, backgroundColor:'#FF512F', width:24, height:24, borderRadius:12, justifyContent:'center', alignItems:'center', borderWidth:2, borderColor:'#000' },
  
  activeListCard: { flexDirection:'row', alignItems:'center', backgroundColor:'#1c1c1e', marginHorizontal: 20, padding: 15, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor:'#333' },
  listIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor:'#fff', justifyContent:'center', alignItems:'center', marginRight: 15 },
  activeListTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  activeListSub: { color: '#666', fontSize: 12 },
  emptyCard: { marginHorizontal: 20, padding: 30, backgroundColor: '#1c1c1e', borderRadius: 16, alignItems:'center', borderStyle:'dashed', borderWidth:1, borderColor:'#333' },

  configHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingTop:60, paddingBottom:20 },
  backButton: { width:40, height:40, borderRadius:20, backgroundColor:'#1c1c1e', justifyContent:'center', alignItems:'center' },
  configTitle: { color:'#fff', fontSize:18, fontWeight:'bold' },
  configSection: { marginTop: 30, paddingHorizontal: 20 },
  configLabel: { color:'#fff', fontSize: 14, fontWeight:'bold', marginBottom: 15 },
  
  targetFriendCard: { flexDirection:'row', alignItems:'center', backgroundColor:'#1c1c1e', padding: 15, borderRadius: 12, borderWidth:1, borderColor:'#333' },
  avatarSmall: { width: 40, height: 40, borderRadius: 20, marginRight: 15 },
  targetName: { color:'#fff', fontSize: 16, fontWeight:'bold' },

  genreGrid: { flexDirection:'row', flexWrap:'wrap', gap: 10 },
  genrePill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor:'#1c1c1e', borderWidth:1, borderColor:'#333' },
  genrePillActive: { backgroundColor:'#fff', borderColor:'#fff' },
  genreText: { color:'#888', fontSize: 13 },

  providerItem: { marginRight: 15, borderRadius: 12, borderWidth: 2, borderColor:'transparent' },
  providerImg: { width: 60, height: 60, borderRadius: 12 },
  checkBadge: { position:'absolute', bottom:-5, right:-5, width:18, height:18, borderRadius:9, justifyContent:'center', alignItems:'center', borderWidth:2, borderColor:'#000' },

  bottomFloat: { position:'absolute', bottom: 110, left: 20, right: 20 },
  startBigBtn: { backgroundColor:'#FF512F', paddingVertical: 18, borderRadius: 16, alignItems:'center' },
  startBigText: { color:'#fff', fontSize: 16, fontWeight:'bold', letterSpacing: 1 },

  gameHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingTop: 50, paddingHorizontal: 20 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor:'rgba(255,255,255,0.1)', justifyContent:'center', alignItems:'center' },
  gameTitle: { color:'#fff', fontSize: 16, fontWeight:'bold', maxWidth: 200 },
  deck: { flex:1, alignItems:'center', justifyContent:'center', marginTop: 10 },
  card: { width: width-30, height: height*0.68, borderRadius: 24, position:'absolute', backgroundColor:'#000', overflow:'hidden', borderWidth:1, borderColor:'#333' },
  cardImage: { width:'100%', height:'100%', resizeMode:'cover' },
  cardGradient: { position:'absolute', bottom:0, left:0, right:0, height:150, justifyContent:'flex-end', padding:20 },
  cardTitle: { color:'#fff', fontSize:28, fontWeight:'800', marginBottom: 5, textShadowColor:'rgba(0,0,0,0.8)', textShadowRadius:10 },
  cardSub: { color:'#ddd', fontSize: 14, fontWeight:'600' },
  cardMeta: { flexDirection: 'row', gap: 15 },
  rating: { color: '#FFD700', fontWeight: 'bold', fontSize: 16 },
  year: { color: '#ddd', fontWeight: '600', fontSize: 16 },
  label: { position:'absolute', top: 50, paddingHorizontal:20, paddingVertical:8, borderWidth:4, borderRadius:10, zIndex:10 },
  
  controls: { flexDirection:'row', justifyContent:'center', gap: 30, marginBottom: 100 },
  controlBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor:'#1c1c1e', justifyContent:'center', alignItems:'center', borderWidth:1 },
  
  backBtn: { backgroundColor:'#fff', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25, marginTop: 20 },
  
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#666', marginTop: 15 },
});

export default MatchScreen;