import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { getAuth } from 'firebase/auth';
import { addFavoriteMovie } from '../services/firebaseActions';

const API_KEY = '157c8aa1011d8ee27cbdbe624298e4a6';

interface MovieDetails {
  title: string;
  overview: string;
  poster_path: string;
  release_date: string;
}

const DetalhesScreen: React.FC<any> = ({ route }) => {
  const { movieId } = route.params;
  const [movieDetails, setMovieDetails] = useState<MovieDetails | null>(null);
  const [streamingPlatforms, setStreamingPlatforms] = useState<string[]>([]);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    fetchMovieDetails();
    fetchStreamingAvailability();
  }, []);

  const fetchMovieDetails = async () => {
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
    }
  };

  const fetchStreamingAvailability = async () => {
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/${movieId}/watch/providers?api_key=${API_KEY}`
      );
      const streamingData = response.data.results.BR.flatrate;
      const platforms = streamingData ? streamingData.map((platform: any) => platform.provider_name) : [];
      setStreamingPlatforms(platforms);
    } catch (error) {
      console.error('Erro ao buscar a disponibilidade do filme em plataformas de streaming:', error);
    }
  };

  const handleAddToFavorites = async () => {
    if (!user) {
      Alert.alert('Erro', 'Você precisa estar logado para adicionar filmes aos favoritos.');
      return;
    }
    try {
      await addFavoriteMovie(user.uid, movieDetails);
      Alert.alert('Sucesso', 'O filme foi adicionado aos favoritos.');
    } catch (error) {
      console.error('Erro ao adicionar filme aos favoritos:', error);
      Alert.alert('Erro', 'Houve um erro ao adicionar o filme aos favoritos. Por favor, tente novamente mais tarde.');
    }
  };

  if (!movieDetails) {
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image
          source={{ uri: `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}` }}
          style={styles.poster}
        />
        <Text style={styles.title}>{movieDetails.title}</Text>
        <Text style={styles.releaseDate}>Lançamento: {movieDetails.release_date}</Text>
        <Text style={styles.overview}>{movieDetails.overview}</Text>
        <TouchableOpacity style={styles.addToFavoritesButton} onPress={handleAddToFavorites}>
          <Text style={styles.addToFavoritesButtonText}>Adicionar aos Favoritos</Text>
        </TouchableOpacity>
        <Text style={styles.streamingAvailability}>
          Disponível em: {streamingPlatforms.length > 0 ? streamingPlatforms.join(', ') : 'Nenhuma plataforma de streaming'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 10,
    textAlign: 'center',
  },
  releaseDate: {
    fontSize: 16,
    marginBottom: 10,
  },
  overview: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  addToFavoritesButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
    marginBottom: 20,
  },
  addToFavoritesButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  streamingAvailability: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default DetalhesScreen;
