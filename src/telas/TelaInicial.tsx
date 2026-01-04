import React, { useState, useEffect, useCallback } from 'react';
import { 
  ScrollView, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  View, 
  ActivityIndicator, 
  StatusBar, 
  RefreshControl,
  Dimensions
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../services/firebaseConfig';
import { getMyFriends, getFriendsLastReviews, getUserProfile } from '../services/firebaseActions';

const API_KEY = '157c8aa1011d8ee27cbdbe624298e4a6';
const { width, height } = Dimensions.get('window');

interface Movie {
  id: number;
  poster_path?: string;
  backdrop_path?: string;
  title: string;
  vote_average?: number;
  overview?: string;
  release_date?: string;
}

const HomeScreen: React.FC = () => {
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  
  const [heroMovie, setHeroMovie] = useState<Movie | null>(null);
  
  // Dados Sociais
  const [friendsActivity, setFriendsActivity] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const navigation = useNavigation<any>();
  const user = auth.currentUser;

  const fetchData = async () => {
    try {
      const [pop, top, up, trend] = await Promise.all([
        axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=pt-BR`),
        axios.get(`https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}&language=pt-BR`),
        axios.get(`https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}&language=pt-BR`),
        axios.get(`https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}&language=pt-BR`)
      ]);
      
      setPopularMovies(pop.data.results);
      setHeroMovie(trend.data.results[0]); 
      setTopRatedMovies(top.data.results);
      setUpcomingMovies(up.data.results);
      setTrendingMovies(trend.data.results);

      if (user) {
          const friends = await getMyFriends(user.uid);
          const friendIds = friends.map((f: any) => f.uid);
          
          if (friendIds.length > 0) {
              const activities = await getFriendsLastReviews(friendIds);
              const enrichedActivities = await Promise.all(
                  activities.slice(0, 5).map(async (review) => {
                      try {
                          const movieRes = await axios.get(`https://api.themoviedb.org/3/movie/${review.movieId}?api_key=${API_KEY}`);
                          return { ...review, movieData: movieRes.data };
                      } catch { return review; }
                  })
              );
              setFriendsActivity(enrichedActivities);
          }
      }

    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const renderActivityCard = ({ item }: { item: any }) => {
      if (!item.movieData) return null;
      return (
          <TouchableOpacity 
              style={styles.activityCard}
              onPress={() => navigation.navigate('Detalhes', { movieId: item.movieId })}
          >
              <View style={styles.activityHeader}>
                  <View style={styles.avatarSmall}>
                      <Text style={styles.avatarText}>{(item.userName || "A").charAt(0)}</Text>
                  </View>
                  <Text style={styles.activityText} numberOfLines={1}>
                      <Text style={{fontWeight:'bold', color:'#fff'}}>{item.userName}</Text>
                  </Text>
              </View>
              
              <Image 
                  source={{ uri: `https://image.tmdb.org/t/p/w154${item.movieData.poster_path}` }} 
                  style={styles.activityPoster} 
              />
              
              <View style={styles.activityRating}>
                  <Ionicons name="star" size={10} color="#000" />
                  <Text style={styles.activityRatingText}>{item.rating}</Text>
              </View>
          </TouchableOpacity>
      );
  };

  const renderMovieItem = useCallback(({ item, isWide = false }: { item: Movie, isWide?: boolean }) => (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => navigation.navigate('Detalhes', { movieId: item.id })}
      style={[styles.cardContainer, isWide ? styles.cardWide : styles.cardPoster]}
    >
      <Image 
        source={{ uri: `https://image.tmdb.org/t/p/w500${isWide && item.backdrop_path ? item.backdrop_path : item.poster_path}` }} 
        style={styles.image}
      />
      {isWide && (
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.9)']}
            style={styles.cardGradient}
          >
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          </LinearGradient>
      )}
    </TouchableOpacity>
  ), [navigation]);

  const renderSection = useCallback((title: string, data: Movie[], isWide = false) => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 20, paddingRight: 20 }}
      >
        {data.map(movie => (
          <View key={movie.id} style={styles.movieItem}>
            {renderMovieItem({ item: movie, isWide })}
          </View>
        ))}
      </ScrollView>
    </View>
  ), [renderMovieItem]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        style={{flex: 1}}
      >
        {/* HERO SECTION */}
        {heroMovie && (
          <View style={styles.heroContainer}>
            <Image 
              source={{ uri: `https://image.tmdb.org/t/p/original${heroMovie.poster_path}` }} 
              style={styles.heroImage}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)', '#000000']} 
              locations={[0, 0.5, 1]}
              style={styles.heroGradient}
            >
              <View style={styles.heroContent}>
                <View style={styles.heroTag}><Text style={styles.heroTagText}>EM DESTAQUE</Text></View>
                <Text style={styles.heroTitle}>{heroMovie.title}</Text>
                
                <View style={styles.metaRow}>
                   <Text style={styles.metaText}>{heroMovie.release_date?.split('-')[0]}</Text>
                   <Text style={styles.metaDot}>•</Text>
                   <Text style={styles.ratingText}>IMDb {heroMovie.vote_average?.toFixed(1)}</Text>
                </View>

                <Text style={styles.heroOverview} numberOfLines={2}>
                    {heroMovie.overview}
                </Text>

                <View style={styles.heroButtons}>
                  <TouchableOpacity 
                    style={styles.playButton}
                    onPress={() => navigation.navigate('Detalhes', { movieId: heroMovie.id })}
                  >
                    <Ionicons name="play" size={20} color="#000" />
                    <Text style={styles.playButtonText}>Assistir</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.infoButton} 
                    onPress={() => navigation.navigate('Detalhes', { movieId: heroMovie.id })}
                  >
                    <Ionicons name="add" size={24} color="#fff" />
                    <Text style={styles.infoButtonText}>Minha Lista</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* FEED DE ATIVIDADE */}
        {friendsActivity.length > 0 && (
            <View style={styles.feedSection}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Atividade de Amigos</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('ReviewsHistory')}>
                        <Text style={styles.seeAllText}>Ver tudo</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingLeft: 20}}>
                    {friendsActivity.map((activity, index) => (
                        <View key={index} style={{marginRight: 15}}>
                            {renderActivityCard({item: activity})}
                        </View>
                    ))}
                </ScrollView>
            </View>
        )}

        {/* LISTAS TRADICIONAIS */}
        <View style={styles.listsContainer}>
          {renderSection('Em Alta na Semana', trendingMovies, true)}
          {renderSection('Populares no Brasil', popularMovies)}
          {renderSection('Aclamados pela Crítica', topRatedMovies)}
          {renderSection('Em Breve nos Cinemas', upcomingMovies)}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },

  // HERO
  heroContainer: { width: width, height: height * 0.75 },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroGradient: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', paddingHorizontal: 20, paddingBottom: 40 },
  heroContent: { alignItems: 'flex-start' },
  heroTag: { backgroundColor: '#FF512F', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginBottom: 10 },
  heroTagText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  heroTitle: { color: '#fff', fontSize: 40, fontWeight: '900', letterSpacing: -1, marginBottom: 8, textShadowColor:'rgba(0,0,0,0.5)', textShadowRadius: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  metaText: { color: '#ddd', fontSize: 13, fontWeight: '600' },
  metaDot: { color: '#666', marginHorizontal: 8, fontSize: 6 },
  ratingText: { color: '#FFD700', fontSize: 13, fontWeight: 'bold' },
  heroOverview: { color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 20, marginBottom: 25, maxWidth: '90%' },
  heroButtons: { flexDirection: 'row', gap: 15 },
  playButton: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8 },
  playButtonText: { color: '#000', fontWeight: 'bold', fontSize: 15, marginLeft: 5 },
  infoButton: { backgroundColor: 'rgba(255,255,255,0.2)', flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8 },
  infoButtonText: { color: '#fff', fontWeight: '600', fontSize: 15, marginLeft: 8 },

  // FEED DE ATIVIDADE
  feedSection: { marginBottom: 30, marginTop: -20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20, marginBottom: 15 },
  seeAllText: { color: '#FF512F', fontSize: 12, fontWeight: 'bold' },
  activityCard: { width: 110, marginRight: 5 },
  activityHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  avatarSmall: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FF512F', justifyContent:'center', alignItems:'center' },
  avatarText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  activityText: { color: '#aaa', fontSize: 10, flex: 1 },
  activityPoster: { width: 110, height: 160, borderRadius: 8, backgroundColor: '#1a1a1a' },
  activityRating: { 
      position: 'absolute', bottom: 5, right: 5, 
      backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', 
      paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 2 
  },
  activityRatingText: { color: '#000', fontSize: 10, fontWeight: 'bold' },

  // LISTAS
  listsContainer: { paddingBottom: 40 },
  sectionContainer: { marginBottom: 40 },
  sectionTitle: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 15, marginLeft: 20, letterSpacing: 0.5 },
  movieItem: { marginRight: 15 },
  cardContainer: { borderRadius: 8, overflow: 'hidden', backgroundColor: '#1a1a1a' },
  cardPoster: { width: 130, height: 195 },
  cardWide: { width: 260, height: 146 },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardGradient: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 10 },
  cardTitle: { color: '#fff', fontSize: 13, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,1)', textShadowRadius: 4 },
});

export default HomeScreen;