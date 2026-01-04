import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, StatusBar, Image, Platform, Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { auth } from '../services/firebaseConfig';
import { 
  getReviewsByUser, 
  getFriendsLastReviews, 
  getMyFriends, 
  Review 
} from '../services/firebaseActions';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';

const TMDB_API_KEY = "157c8aa1011d8ee27cbdbe624298e4a6";

// --- COMPONENTE INTERNO: CARD DE REVIEW ---
const ReviewCard = ({ review, isFriend }: { review: Review, isFriend: boolean }) => {
  const [movieData, setMovieData] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchMovie() {
      try {
        const res = await axios.get(
          `https://api.themoviedb.org/3/movie/${review.movieId}?api_key=${TMDB_API_KEY}&language=pt-BR`
        );
        if (isMounted) setMovieData(res.data);
      } catch (e) { }
    }
    fetchMovie();
    return () => { isMounted = false };
  }, [review.movieId]);

  if (!movieData) return <View style={styles.cardSkeleton} />;

  return (
    <View style={styles.card}>
        <View style={styles.cardHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1}}>
                {/* Poster */}
                <Image 
                    source={{ uri: `https://image.tmdb.org/t/p/w92${movieData.poster_path}` }} 
                    style={styles.miniPoster} 
                />
                <View style={{flex: 1}}>
                    {/* Header: Nome + Ação */}
                    {isFriend ? (
                        <View style={{flexDirection:'row', alignItems:'center', flexWrap:'wrap'}}>
                             <Text style={styles.userName}>{review.userName || "Amigo"}</Text>
                             <Text style={styles.actionText}> assistiu </Text>
                             <Text style={styles.movieTitle} numberOfLines={1}>{movieData.title}</Text>
                        </View>
                    ) : (
                        <Text style={styles.movieTitle} numberOfLines={1}>{movieData.title}</Text>
                    )}
                    
                    {/* Estrelas */}
                    <View style={styles.ratingRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons 
                                key={star} 
                                name={star <= review.rating ? "star" : "star-outline"} 
                                size={12} 
                                color="#FFD700" 
                            />
                        ))}
                    </View>
                </View>
            </View>
        </View>

        {/* Comentário */}
        {review.comment ? (
            <View style={styles.commentBox}>
                <Text style={styles.commentText}>"{review.comment}"</Text>
            </View>
        ) : null}
    </View>
  );
};

// --- TELA PRINCIPAL ---
type Props = StackScreenProps<RootStackParamList, 'ReviewsHistory'>;

const ReviewsHistoryScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'mine' | 'friends'>('mine');
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [friendsReviews, setFriendsReviews] = useState<Review[]>([]); // Estado separado
  const [loading, setLoading] = useState(true);
  
  const user = auth.currentUser;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Minhas Reviews
      const mine = await getReviewsByUser(user.uid);
      // Ordena por data localmente para garantir
      const sortedMine = mine.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setMyReviews(sortedMine); 

      // 2. Reviews de Amigos
      const friendsList = await getMyFriends(user.uid);
      const friendIds = friendsList.map((f: any) => f.uid);
      
      console.log("Amigos encontrados IDs:", friendIds); // Debug

      if (friendIds.length > 0) {
          // Buscamos reviews desses IDs
          const friendsData = await getFriendsLastReviews(friendIds);
          console.log("Reviews de amigos encontradas:", friendsData.length); // Debug
          setFriendsReviews(friendsData);
      } else {
          setFriendsReviews([]);
      }

    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  const dataToShow = activeTab === 'mine' ? myReviews : friendsReviews;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#141414', '#000000']} style={styles.background}>
        
        {/* Header */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Atividade</Text>
            <View style={{width: 40}} /> 
        </View>

        {/* Tabs Segmentadas */}
        <View style={styles.tabContainer}>
            <View style={styles.tabWrapper}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'mine' && styles.activeTab]} 
                    onPress={() => setActiveTab('mine')}
                >
                    <Text style={[styles.tabText, activeTab === 'mine' && styles.activeTabText]}>Minhas</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'friends' && styles.activeTab]} 
                    onPress={() => setActiveTab('friends')}
                >
                    <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>Amigos</Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* Lista */}
        {loading ? (
            <View style={styles.center}><ActivityIndicator color="#fff" size="large" /></View>
        ) : (
            <FlatList
                data={dataToShow}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <ReviewCard review={item} isFriend={activeTab === 'friends'} />}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="chatbox-ellipses-outline" size={48} color="#333" />
                        <Text style={styles.emptyText}>
                            {activeTab === 'mine' ? "Você ainda não avaliou filmes." : "Seus amigos ainda não avaliaram nada recente."}
                        </Text>
                    </View>
                }
            />
        )}

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
      paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: 20, paddingBottom: 20,
  },
  backBtn: {
      width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)',
      justifyContent: 'center', alignItems: 'center'
  },
  screenTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  // Tabs
  tabContainer: { paddingHorizontal: 20, marginBottom: 20 },
  tabWrapper: { flexDirection: 'row', backgroundColor: '#1c1c1e', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#333' },
  tabText: { color: '#666', fontWeight: '600' },
  activeTabText: { color: '#fff' },

  listContent: { paddingHorizontal: 20, paddingBottom: 40 },

  // Card Styles
  card: {
      backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 15, marginBottom: 12,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  cardSkeleton: { height: 100, backgroundColor: '#1c1c1e', borderRadius: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  
  miniPoster: { width: 40, height: 60, borderRadius: 6, backgroundColor: '#333' },
  
  userName: { color: '#FF512F', fontWeight: 'bold', fontSize: 14 },
  actionText: { color: '#888', fontWeight: 'normal', fontSize: 13 },
  
  movieTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  ratingRow: { flexDirection: 'row', marginTop: 4, gap: 2 },
  
  dateText: { color: '#444', fontSize: 10, fontWeight: '600', marginTop: 4 },

  commentBox: {
      marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)'
  },
  commentText: { color: '#ccc', fontSize: 14, fontStyle: 'italic', lineHeight: 20 },

  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#666', marginTop: 15 },
});

export default ReviewsHistoryScreen;