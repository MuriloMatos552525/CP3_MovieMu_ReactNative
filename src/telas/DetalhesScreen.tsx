import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Linking,
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../services/firebaseConfig';
import { getReviewsByMovie, Review } from '../services/firebaseActions';
import { StackScreenProps } from '@react-navigation/stack';

const API_KEY = '157c8aa1011d8ee27cbdbe624298e4a6';

type DetalhesScreenProps = StackScreenProps<
  { Detalhes: { movieId: number }; Review: { movieId: number } },
  'Detalhes'
>;

interface MovieDetails {
  title: string;
  overview: string;
  poster_path: string;
  release_date: string;
}

interface StreamingProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

const DetalhesScreen: React.FC<DetalhesScreenProps> = ({ route, navigation }) => {
  const { movieId } = route.params;
  const [movieDetails, setMovieDetails] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Estado para armazenar reviews do filme
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(true);

  // Estado para streaming
  const [streamingProviders, setStreamingProviders] = useState<StreamingProvider[]>([]);
  const [streamingLink, setStreamingLink] = useState<string | null>(null);

  // Remove o header nativo
  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Busca detalhes do filme (API TMDb)
  const fetchMovieDetails = useCallback(async () => {
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}`
      );
      const data = response.data;
      const details: MovieDetails = {
        title: data.title,
        overview: data.overview,
        poster_path: data.poster_path,
        release_date: data.release_date,
      };
      setMovieDetails(details);
    } catch (error) {
      console.error('Erro ao buscar os detalhes do filme:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes do filme.');
    }
  }, [movieId]);

  // Busca disponibilidade de streaming (API TMDb)
  const fetchStreamingAvailability = useCallback(async () => {
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/${movieId}/watch/providers?api_key=${API_KEY}`
      );
      const dataBR = response.data.results.BR;
      if (dataBR) {
        setStreamingLink(dataBR.link);
        const providers = dataBR.flatrate || [];
        setStreamingProviders(providers);
      } else {
        setStreamingProviders([]);
        setStreamingLink(null);
      }
    } catch (error) {
      console.error('Erro ao buscar a disponibilidade:', error);
      // Trata o erro de forma silenciosa
    }
  }, [movieId]);

  // Busca reviews do Firestore
  const fetchMovieReviews = useCallback(async () => {
    try {
      setReviewsLoading(true);
      const data = await getReviewsByMovie(movieId);
      setReviews(data);
    } catch (error) {
      console.error('Erro ao buscar reviews do filme:', error);
    } finally {
      setReviewsLoading(false);
    }
  }, [movieId]);

  // Carrega informações do filme, streaming e reviews
  useEffect(() => {
    Promise.all([
      fetchMovieDetails(),
      fetchStreamingAvailability(),
      fetchMovieReviews(),
    ]).finally(() => {
      setLoading(false);
    });
  }, [fetchMovieDetails, fetchStreamingAvailability, fetchMovieReviews]);

  // Navegar para a tela de Review
  const handleOpenReviewScreen = () => {
    navigation.navigate('Review', { movieId });
  };

  // Função para tentar abrir o app nativo do provedor
  const handleProviderPress = async (provider: StreamingProvider) => {
    // Mapeamento dos nomes dos provedores para esquemas de deep link
    const deepLinkMapping: { [key: string]: string } = {
      Netflix: 'nflx://',
      'Amazon Prime Video': 'primevideo://',
      'Disney+': 'disneyplus://',
      'HBO Max': 'hbomax://',
      // Adicione outros mapeamentos conforme necessário
    };

    const deepLink = deepLinkMapping[provider.provider_name];
    if (deepLink) {
      const supported = await Linking.canOpenURL(deepLink);
      if (supported) {
        Linking.openURL(deepLink);
        return;
      }
    }
    // Se não houver deep link ou o app não estiver instalado, abre o link padrão
    if (streamingLink) {
      Linking.openURL(streamingLink);
    } else {
      Alert.alert('Indisponível', 'Link para assistir indisponível');
    }
  };

  if (loading || !movieDetails) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#222" barStyle="light-content" />

      {/* Header customizado com botão de voltar */}
      <View style={styles.customHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image
          source={{ uri: `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}` }}
          style={styles.poster}
        />
        <Text style={styles.title}>{movieDetails.title}</Text>
        <Text style={styles.releaseDate}>
          Lançamento: {movieDetails.release_date}
        </Text>
        <Text style={styles.overview}>{movieDetails.overview}</Text>

        {/* Seção de Streaming */}
        <View style={styles.streamingSection}>
          <Text style={styles.streamingTitle}>Disponível em:</Text>
          {streamingProviders.length > 0 ? (
            <View style={styles.providersContainer}>
              {streamingProviders.map((provider) => (
                <TouchableOpacity
                  key={provider.provider_id}
                  style={styles.providerButton}
                  onPress={() => handleProviderPress(provider)}
                >
                  {provider.logo_path ? (
                    <Image 
                      source={{ uri: `https://image.tmdb.org/t/p/w92${provider.logo_path}` }}
                      style={styles.providerLogo}
                    />
                  ) : (
                    <Text style={styles.providerName}>{provider.provider_name}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.noProvidersText}>Nenhuma plataforma de streaming disponível.</Text>
          )}
        </View>

        {/* Seção de Reviews */}
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Avaliações do Filme</Text>
          {reviewsLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : reviews.length === 0 ? (
            <Text style={styles.noReviewsText}>Nenhuma avaliação cadastrada ainda.</Text>
          ) : (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewItem}>
                <Text style={styles.reviewRating}>Nota: {review.rating} / 5</Text>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Botão fixo para Avaliação */}
      <TouchableOpacity style={styles.reviewButtonFixed} onPress={handleOpenReviewScreen}>
        <Ionicons name="create" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default DetalhesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  customHeader: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    padding: 5,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 100, // Garante que o botão fixo não sobreponha o conteúdo
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
  },
  poster: {
    width: 300,
    height: 450,
    borderRadius: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  releaseDate: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 10,
  },
  overview: {
    fontSize: 16,
    color: '#ddd',
    textAlign: 'center',
    marginBottom: 20,
  },
  streamingSection: {
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
  },
  streamingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  providersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  providerButton: {
    backgroundColor: '#444',
    padding: 10,
    borderRadius: 8,
    margin: 5,
    alignItems: 'center',
  },
  providerLogo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  providerName: {
    color: '#fff',
    fontSize: 14,
  },
  noProvidersText: {
    color: '#aaa',
    fontStyle: 'italic',
  },
  reviewSection: {
    width: '100%',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#555',
    paddingTop: 16,
  },
  reviewSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  noReviewsText: {
    fontStyle: 'italic',
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 10,
  },
  reviewItem: {
    width: '100%',
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#333',
    borderRadius: 6,
  },
  reviewRating: {
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  reviewComment: {
    fontStyle: 'italic',
    color: '#ddd',
  },
  reviewButtonFixed: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#f44336',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
