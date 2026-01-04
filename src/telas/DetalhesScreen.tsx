import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  Linking,
  Dimensions,
  Image,
  Platform
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { getReviewsByMovie, Review } from '../services/firebaseActions';
import { StackScreenProps } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedScrollHandler, 
  useSharedValue, 
  useAnimatedStyle, 
  interpolate, 
  Extrapolation 
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const API_KEY = '157c8aa1011d8ee27cbdbe624298e4a6';

type RootStackParamList = {
  Detalhes: { movieId: number };
  Review: { movieId: number; movieTitle: string; moviePoster: string };
};

type Props = StackScreenProps<RootStackParamList, 'Detalhes'>;

interface MovieDetails {
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path?: string;
  release_date: string;
  vote_average?: number;
  genres?: { id: number; name: string }[];
  runtime?: number;
}

interface StreamingProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

const DetalhesScreen: React.FC<Props> = ({ route, navigation }) => {
  const { movieId } = route.params;
  
  const [movieDetails, setMovieDetails] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(true);
  const [streamingProviders, setStreamingProviders] = useState<StreamingProvider[]>([]);
  const [streamingLink, setStreamingLink] = useState<string | null>(null);

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Carrega dados toda vez que a tela ganha foco (para atualizar reviews novas)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchData = useCallback(async () => {
    try {
      // 1. Detalhes do Filme
      if (!movieDetails) { // Só busca detalhes se não tiver ainda
          const detailsRes = await axios.get(
            `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&language=pt-BR`
          );
          setMovieDetails(detailsRes.data);

          const streamRes = await axios.get(
            `https://api.themoviedb.org/3/movie/${movieId}/watch/providers?api_key=${API_KEY}`
          );
          const brData = streamRes.data.results?.BR;
          if (brData) {
            setStreamingLink(brData.link);
            setStreamingProviders(brData.flatrate || brData.buy || []);
          }
      }

      // 2. Reviews (Sempre atualiza)
      setReviewsLoading(true);
      const reviewsData = await getReviewsByMovie(movieId);
      setReviews(reviewsData);
      setReviewsLoading(false);

    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }, [movieId, movieDetails]);

  // Parallax Sóbrio
  const imageAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [-height, 0, height],
      [-height / 2, 0, height * 0.5],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      scrollY.value,
      [-height, 0],
      [1.5, 1], // Zoom suave
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateY }, { scale }],
    };
  });

  const handleOpenReview = () => {
    if (movieDetails) {
      // @ts-ignore
      navigation.navigate('Review', { 
        movieId, 
        movieTitle: movieDetails.title,
        moviePoster: movieDetails.poster_path 
      });
    }
  };

  const handleProviderPress = async (link: string | null) => {
    if (link) Linking.openURL(link);
    else if (streamingLink) Linking.openURL(streamingLink);
    else Alert.alert("Indisponível", "Link não encontrado.");
  };

  if (loading || !movieDetails) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  const heroImage = movieDetails.backdrop_path || movieDetails.poster_path;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Imagem Parallax */}
      <Animated.Image
        source={{ uri: `https://image.tmdb.org/t/p/original${heroImage}` }}
        style={[styles.heroImage, imageAnimatedStyle]}
        resizeMode="cover"
      />
      
      {/* Gradiente Preto para leitura perfeita */}
      <LinearGradient
        colors={['transparent', '#000000']}
        style={styles.heroGradient}
        locations={[0, 0.8]}
      />

      {/* Botão Voltar (Estilo Apple: Círculo Fosco) */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </TouchableOpacity>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Espaço para a imagem aparecer */}
        <View style={{ height: 400 }} />

        {/* Conteúdo Sóbrio */}
        <View style={styles.infoContainer}>
          
          <Text style={styles.title}>{movieDetails.title}</Text>
          
          <View style={styles.metaRow}>
             <View style={styles.matchBadge}>
                <Text style={styles.matchText}>{Math.round((movieDetails.vote_average || 0) * 10)}% Relevância</Text>
             </View>
             <Text style={styles.metaText}>{movieDetails.release_date.split('-')[0]}</Text>
             {movieDetails.runtime && <Text style={styles.metaText}>{Math.floor(movieDetails.runtime / 60)}h {movieDetails.runtime % 60}m</Text>}
             <View style={styles.hdBadge}>
                 <Text style={styles.hdText}>HD</Text>
             </View>
          </View>

          {/* Botão Principal de Ação (Estilo Play/Avaliar) */}
          <TouchableOpacity 
            style={styles.mainActionButton}
            onPress={handleOpenReview}
          >
            <Ionicons name="star" size={20} color="#000" />
            <Text style={styles.mainActionText}>Avaliar Filme</Text>
          </TouchableOpacity>

          <Text style={styles.overviewText}>
            {movieDetails.overview || "Sinopse indisponível."}
          </Text>

          {/* Gêneros Minimalistas */}
          <View style={styles.genresRow}>
            {movieDetails.genres?.map(g => (
              <Text key={g.id} style={styles.genreText}>
                {g.name} <Text style={{color: '#444'}}>•</Text>
              </Text>
            ))}
          </View>

          {/* Onde Assistir */}
          <View style={styles.sectionMargin}>
            <Text style={styles.sectionTitle}>Disponível em</Text>
            {streamingProviders.length > 0 ? (
              <View style={styles.providersRow}>
                {streamingProviders.map((prov) => (
                  <TouchableOpacity 
                    key={prov.provider_id} 
                    onPress={() => handleProviderPress(null)}
                    style={styles.providerItem}
                  >
                    <Image 
                      source={{ uri: `https://image.tmdb.org/t/p/w92${prov.logo_path}` }}
                      style={styles.providerLogo}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>Indisponível para streaming.</Text>
            )}
          </View>

          {/* Reviews (Lista Limpa) */}
          <View style={styles.sectionMargin}>
             <Text style={styles.sectionTitle}>Opinião da Crítica</Text>
             
             {reviewsLoading ? (
                <ActivityIndicator color="#fff" />
             ) : reviews.length === 0 ? (
                <Text style={styles.emptyText}>Seja o primeiro a avaliar.</Text>
             ) : (
                reviews.map((rev) => (
                   <View key={rev.id} style={styles.reviewItem}>
                      <View style={styles.reviewHeader}>
                          {/* MOSTRA O NOME DO USUÁRIO OU "Anônimo" */}
                          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                              <View style={styles.avatarPlaceholder}>
                                  <Text style={styles.avatarInitial}>
                                      {(rev.userName || "U").charAt(0).toUpperCase()}
                                  </Text>
                              </View>
                              <Text style={styles.reviewUser}>
                                  {rev.userName || "Usuário MovieMu"}
                              </Text>
                          </View>
                          
                          <View style={styles.starsRow}>
                              <Ionicons name="star" size={14} color="#FFD700" />
                              <Text style={styles.starText}>{rev.rating}</Text>
                          </View>
                      </View>
                      <Text style={styles.reviewComment}>"{rev.comment}"</Text>
                   </View>
                ))
             )}
          </View>

          <View style={{height: 100}} />
        </View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Fundo Preto Absoluto
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  
  // Imagem
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: 550,
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: 550,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30,30,30,0.7)', // Cinza escuro translúcido
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  scrollContent: {
    paddingBottom: 40,
  },
  infoContainer: {
    paddingHorizontal: 20,
    backgroundColor: '#000', // Conteúdo sobre o preto
    minHeight: 500,
  },

  // Cabeçalho Info
  title: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '800', // Fonte grossa estilo Netflix
    marginBottom: 15,
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  matchBadge: {
    backgroundColor: '#fff', // Badge Branco (Alto contraste)
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  matchText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  metaText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '600',
  },
  hdBadge: {
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  hdText: {
    color: '#ccc',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Ação Principal
  mainActionButton: {
    backgroundColor: '#fff', // Botão Branco estilo Apple TV
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 20,
  },
  mainActionText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },

  overviewText: {
    color: '#ccc', // Cinza claro para leitura
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 15,
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 30,
  },
  genreText: {
    color: '#888',
    fontSize: 13,
    marginRight: 6,
  },

  // Seções
  sectionMargin: {
    marginTop: 20,
    marginBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#222', // Divisor sutil
    paddingTop: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
  },
  
  // Streaming
  providersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  providerItem: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  providerLogo: {
    width: 45,
    height: 45,
  },
  emptyText: {
    color: '#666',
    fontStyle: 'italic',
  },

  // Reviews Sóbrios (Estilo HBO)
  reviewItem: {
    backgroundColor: '#111', // Card muito escuro
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#222'
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarPlaceholder: {
      width: 24, height: 24, borderRadius: 12,
      backgroundColor: '#333', justifyContent: 'center', alignItems: 'center'
  },
  avatarInitial: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  reviewUser: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, gap: 4,
  },
  starText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  reviewComment: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default DetalhesScreen;