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
    voteMovie 
} from '../services/firebaseActions';

const { width, height } = Dimensions.get('window');
const TMDB_API_KEY = "157c8aa1011d8ee27cbdbe624298e4a6";

// --- DADOS ESTÁTICOS (URLs Corrigidas sem espaços) ---

const GENRES = [
  { id: '28', name: 'Ação' },
  { id: '12', name: 'Aventura' },
  { id: '35', name: 'Comédia' },
  { id: '18', name: 'Drama' },
  { id: '27', name: 'Terror' },
  { id: '10749', name: 'Romance' },
  { id: '878', name: 'Sci-Fi' },
  { id: '16', name: 'Animação' },
  { id: '53', name: 'Suspense' },
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

  // --- ESTADOS ---
  const [step, setStep] = useState<'config' | 'swipe'>('config');
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Configuração
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  
  // Sessão
  const [currentListName, setCurrentListName] = useState('');
  const [currentListId, setCurrentListId] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // FILMES (Estado + Ref para resolver o bug do Swipe)
  const [movies, setMovies] = useState<any[]>([]);
  const moviesRef = useRef<any[]>([]); // <--- O SEGREDO ESTÁ AQUI

  // Sincroniza o Ref sempre que o Estado mudar
  useEffect(() => {
    moviesRef.current = movies;
  }, [movies]);

  // --- ANIMAÇÃO SWIPE ---
  const position = useRef(new Animated.ValueXY()).current;
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 120) {
          forceSwipe('right');
        } else if (gesture.dx < -120) {
          forceSwipe('left');
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  // --- CARREGAR DADOS ---
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      loadFriends();
    }, [user])
  );

  const loadFriends = async () => {
    try {
      const data = await getMyFriends(user!.uid);
      setFriends(data);
    } catch (error) { console.error(error); }
  };

  // --- CONFIGURAÇÃO ---
  const toggleGenre = (id: string) => {
    if (selectedGenres.includes(id)) setSelectedGenres(prev => prev.filter(g => g !== id));
    else setSelectedGenres(prev => [...prev, id]);
  };

  const toggleProvider = (id: string) => {
    if (selectedProviders.includes(id)) setSelectedProviders(prev => prev.filter(p => p !== id));
    else setSelectedProviders(prev => [...prev, id]);
  };

  const startSessionWithFriend = async (friend: any) => {
    if (!user) return;
    
    if (selectedProviders.length === 0) {
        Alert.alert("Dica", "Selecione pelo menos um streaming, ou deixe vazio para ver tudo.", [
            { text: "Ver Tudo", onPress: () => runStart(friend) },
            { text: "Escolher", style: 'cancel' }
        ]);
    } else {
        runStart(friend);
    }
  };

  const runStart = async (friend: any) => {
    setLoading(true);
    try {
        const listName = `Match: ${user?.displayName?.split(' ')[0]} & ${friend.displayName?.split(' ')[0]}`;
        const listId = await createSharedList(user!.uid, listName, true);
        await addFriendsToSharedList(listId, [friend.uid]);

        setCurrentListId(listId);
        setCurrentListName(listName);

        const genresString = selectedGenres.join('|');
        const session = await getOrCreateMatchSession(listId, genresString);
        setSessionId(session.id);

        const swipedIds = await getSwipedMovieIds(listId, session.id);
        
        let url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&sort_by=popularity.desc&include_adult=false&page=1`;
        
        if (selectedGenres.length > 0) url += `&with_genres=${selectedGenres.join('|')}`;
        if (selectedProviders.length > 0) url += `&with_watch_providers=${selectedProviders.join('|')}&watch_region=BR`;

        const res = await axios.get(url);
        const newMovies = res.data.results.filter((m: any) => !swipedIds.includes(m.id));
        
        if (newMovies.length === 0) {
            Alert.alert("Ops", "Nenhum filme novo encontrado com esses filtros.");
            setLoading(false);
            return;
        }

        setMovies(newMovies); // Isso atualiza o State e o Ref
        setStep('swipe');

    } catch (error) {
        Alert.alert("Erro", "Falha ao iniciar.");
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  // --- SWIPE LOGIC (CORRIGIDA COM REF) ---
  const forceSwipe = (direction: 'right' | 'left') => {
    const xValue = direction === 'right' ? width + 100 : -width - 100;
    Animated.timing(position, {
      toValue: { x: xValue, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(() => onSwipeComplete(direction));
  };

  const onSwipeComplete = (direction: 'right' | 'left') => {
    // 1. Usar o REF para garantir que estamos pegando a lista atualizada
    const currentMovies = moviesRef.current;
    
    if (currentMovies.length === 0) return;

    const swipedMovie = currentMovies[0];
    const remainingMovies = currentMovies.slice(1);

    // 2. Atualizar UI
    setMovies(remainingMovies); // O useEffect atualizará o Ref automaticamente
    position.setValue({ x: 0, y: 0 });

    // 3. Enviar ao Firebase
    if (currentListId && sessionId && user) {
       voteMovie(currentListId, sessionId, swipedMovie, direction);
    }
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 4,
      useNativeDriver: false
    }).start();
  };

  const rotate = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-8deg', '0deg', '8deg'],
    extrapolate: 'clamp',
  });
  const likeOpacity = position.x.interpolate({
    inputRange: [10, width / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const nopeOpacity = position.x.interpolate({
    inputRange: [-width / 4, -10],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const nextCardOpacity = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: [1, 0.7, 1],
    extrapolate: 'clamp',
  });
  const nextCardScale = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: [1, 0.95, 1],
    extrapolate: 'clamp',
  });

  // --- RENDER ---

  if (step === 'config') {
      return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#141414', '#000000']} style={styles.background}>
                <View style={styles.header}>
                    <Text style={styles.title}>Movie Match 🔥</Text>
                    <Text style={styles.subtitle}>Configure sua sessão</Text>
                </View>

                {loading ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color="#FF512F" />
                        <Text style={styles.loadingText}>Buscando filmes...</Text>
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={{paddingBottom: 100}} showsVerticalScrollIndicator={false}>
                        
                        <View style={{flexDirection:'row', justifyContent:'space-between', paddingRight:20, alignItems:'center'}}>
                            <Text style={styles.sectionTitle}>1. O QUE VAMOS VER?</Text>
                            <Text style={styles.counterText}>{selectedGenres.length} selecionado(s)</Text>
                        </View>
                        
                        <View style={styles.gridContainer}>
                            {GENRES.map((item) => {
                                const isSelected = selectedGenres.includes(item.id);
                                return (
                                    <TouchableOpacity 
                                        key={item.id}
                                        style={[styles.pill, isSelected && styles.pillActive]}
                                        onPress={() => toggleGenre(item.id)}
                                    >
                                        <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>{item.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <View style={{flexDirection:'row', justifyContent:'space-between', paddingRight:20, alignItems:'center', marginTop: 20}}>
                            <Text style={styles.sectionTitle}>2. ONDE?</Text>
                            <Text style={styles.counterText}>{selectedProviders.length} selecionado(s)</Text>
                        </View>

                        <FlatList 
                            horizontal 
                            data={PROVIDERS}
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.hList}
                            renderItem={({item}) => {
                                const isActive = selectedProviders.includes(item.id);
                                return (
                                    <TouchableOpacity 
                                        style={[
                                            styles.providerCard, 
                                            isActive && { borderColor: item.color || '#FF512F', borderWidth: 2, transform: [{scale: 1.05}] }
                                        ]}
                                        onPress={() => toggleProvider(item.id)}
                                        activeOpacity={0.8}
                                    >
                                        <Image source={{ uri: item.logo }} style={styles.providerLogo} resizeMode="cover" />
                                        {isActive && (
                                            <View style={[styles.checkBadge, {backgroundColor: item.color || '#FF512F'}]}>
                                                <Ionicons name="checkmark" size={10} color="#fff" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            }}
                        />

                        <Text style={[styles.sectionTitle, {marginTop: 25}]}>3. COM QUEM?</Text>
                        <View style={{paddingHorizontal: 20}}>
                            {friends.length === 0 ? (
                                <View style={styles.emptyFriends}>
                                    <Text style={{color:'#666'}}>Adicione amigos para começar.</Text>
                                    <TouchableOpacity onPress={() => navigation.navigate('Friends')}>
                                        <Text style={styles.linkText}>Ir para Amigos</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                friends.map((friend) => (
                                    <TouchableOpacity 
                                        key={friend.uid}
                                        style={styles.friendCard}
                                        onPress={() => startSessionWithFriend(friend)}
                                    >
                                        <Image 
                                            source={friend.photoURL ? { uri: friend.photoURL } : require('../../assets/logo.png')} 
                                            style={styles.friendAvatar} 
                                        />
                                        <View style={{flex:1}}>
                                            <Text style={styles.friendName}>{friend.displayName}</Text>
                                            <Text style={styles.friendUser}>@{friend.username}</Text>
                                        </View>
                                        <View style={styles.startBtn}>
                                            <Text style={styles.startBtnText}>COMEÇAR</Text>
                                            <Ionicons name="play" size={12} color="#000" />
                                        </View>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>

                    </ScrollView>
                )}
            </LinearGradient>
        </View>
      );
  }

  // TELA DO JOGO
  return (
    <View style={styles.container}>
        <StatusBar hidden />
        
        <View style={styles.gameHeader}>
            <TouchableOpacity onPress={() => setStep('config')} style={styles.iconBtn}>
                <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={{alignItems:'center'}}>
                <Text style={styles.gameTitle} numberOfLines={1}>{currentListName}</Text>
                <Text style={styles.gameSub}>Deslize para dar Match</Text>
            </View>
            <View style={{width: 40}} /> 
        </View>

        <View style={styles.deckContainer}>
            {movies.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="film-outline" size={60} color="#333" />
                    <Text style={styles.emptyText}>Fim dos filmes!</Text>
                    <Text style={styles.emptySub}>Acabaram as opções deste filtro.</Text>
                    <TouchableOpacity onPress={() => setStep('config')} style={styles.backBtn}>
                        <Text style={styles.backBtnText}>Voltar</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                movies.map((item, index) => {
                    if (index === 0) {
                        return (
                            <Animated.View
                                key={item.id}
                                style={[styles.card, {
                                    transform: [{ translateX: position.x }, { translateY: position.y }, { rotate: rotate }],
                                    zIndex: 2
                                }]}
                                {...panResponder.panHandlers}
                            >
                                <Image source={{ uri: `https://image.tmdb.org/t/p/w780${item.poster_path}` }} style={styles.cardImage} />
                                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.95)']} style={styles.cardGradient}>
                                    <Text style={styles.cardTitle}>{item.title}</Text>
                                    <View style={styles.cardMeta}>
                                        <Text style={styles.rating}>⭐ {item.vote_average}</Text>
                                        <Text style={styles.year}>{item.release_date?.split('-')[0]}</Text>
                                    </View>
                                </LinearGradient>

                                <Animated.View style={[styles.label, styles.likeLabel, { opacity: likeOpacity }]}>
                                    <Text style={[styles.labelText, {color:'#4ade80'}]}>QUERO</Text>
                                </Animated.View>
                                <Animated.View style={[styles.label, styles.nopeLabel, { opacity: nopeOpacity }]}>
                                    <Text style={[styles.labelText, {color:'#FF4444'}]}>PASSO</Text>
                                </Animated.View>
                            </Animated.View>
                        );
                    } else if (index === 1) {
                        return (
                            <Animated.View
                                key={item.id}
                                style={[styles.card, { 
                                    zIndex: 1, 
                                    opacity: nextCardOpacity, 
                                    transform: [{ scale: nextCardScale }] 
                                }]}
                            >
                                <Image source={{ uri: `https://image.tmdb.org/t/p/w780${item.poster_path}` }} style={styles.cardImage} />
                                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.95)']} style={styles.cardGradient}>
                                    <Text style={styles.cardTitle}>{item.title}</Text>
                                </LinearGradient>
                            </Animated.View>
                        );
                    }
                    return null;
                }).reverse()
            )}
        </View>

        {movies.length > 0 && (
            <View style={styles.controls}>
                <TouchableOpacity style={[styles.controlBtn, styles.nopeControl]} onPress={() => forceSwipe('left')}>
                    <Ionicons name="close" size={32} color="#FF4444" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.controlBtn, styles.infoControl]} onPress={() => Alert.alert("Sinopse", movies[0]?.overview)}>
                    <Ionicons name="information" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.controlBtn, styles.likeControl]} onPress={() => forceSwipe('right')}>
                    <Ionicons name="heart" size={32} color="#4ade80" />
                </TouchableOpacity>
            </View>
        )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  background: { flex: 1 },
  
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  title: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  subtitle: { color: '#888', fontSize: 16, marginTop: 5 },

  sectionTitle: { 
      color: '#666', fontSize: 11, fontWeight: '800', letterSpacing: 1, 
      marginBottom: 15 
  },
  counterText: { color: '#FF512F', fontSize: 11, fontWeight: 'bold' },
  hList: { paddingLeft: 20, paddingRight: 20 },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 10 },
  pill: { 
      paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, 
      backgroundColor: '#1c1c1e', borderWidth: 1, borderColor: '#333'
  },
  pillActive: { backgroundColor: '#fff', borderColor: '#fff' },
  pillText: { color: '#888', fontWeight: '600' },
  pillTextActive: { color: '#000', fontWeight: 'bold' },

  providerCard: { 
      width: 60, height: 60, borderRadius: 16, marginRight: 15, 
      backgroundColor: '#1c1c1e', alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: '#333'
  },
  providerLogo: { width: '100%', height: '100%', borderRadius: 14 },
  checkBadge: { 
      position: 'absolute', bottom: -6, right: -6, width: 22, height: 22, 
      borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#000' 
  },

  friendCard: { 
      flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c1c1e', 
      padding: 12, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  friendAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 15 },
  friendName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  friendUser: { color: '#666', fontSize: 13 },
  startBtn: { 
      flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', 
      paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, gap: 5 
  },
  startBtnText: { color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

  gameHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20 },
  gameTitle: { color: '#fff', fontSize: 16, fontWeight: '700', maxWidth: 200 },
  gameSub: { color: '#FF512F', fontSize: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent:'center', alignItems:'center' },

  deckContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  card: { 
      width: width - 30, height: height * 0.68, borderRadius: 24, 
      position: 'absolute', backgroundColor: '#000', overflow: 'hidden', 
      borderWidth: 1, borderColor: '#333' 
  },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, justifyContent: 'flex-end', padding: 25 },
  cardTitle: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 5, textShadowColor:'rgba(0,0,0,0.8)', textShadowRadius: 10 },
  cardMeta: { flexDirection: 'row', gap: 15 },
  rating: { color: '#FFD700', fontWeight: 'bold', fontSize: 16 },
  year: { color: '#ddd', fontWeight: '600', fontSize: 16 },

  label: { position: 'absolute', top: 50, paddingHorizontal: 20, paddingVertical: 8, borderWidth: 4, borderRadius: 10, zIndex: 10 },
  likeLabel: { left: 40, borderColor: '#4ade80', transform: [{ rotate: '-15deg' }] },
  nopeLabel: { right: 40, borderColor: '#FF4444', transform: [{ rotate: '15deg' }] },
  labelText: { fontSize: 36, fontWeight: '900' },

  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 40, gap: 25 },
  controlBtn: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1c1c1e', borderWidth: 1, borderColor: '#333' },
  nopeControl: { borderColor: '#FF4444', backgroundColor: 'rgba(255, 68, 68, 0.1)' },
  likeControl: { borderColor: '#4ade80', backgroundColor: 'rgba(74, 222, 128, 0.1)' },
  infoControl: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.1)' },

  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#666', marginTop: 15 },
  emptyState: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 20 },
  emptySub: { color: '#666', fontSize: 14, marginTop: 5, marginBottom: 30 },
  backBtn: { backgroundColor: '#fff', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  backBtnText: { color: '#000', fontWeight: 'bold' },
  emptyFriends: { alignItems: 'center', padding: 20 },
  linkText: { color: '#FF512F', marginTop: 10, fontWeight: 'bold' }
});

export default MatchScreen;