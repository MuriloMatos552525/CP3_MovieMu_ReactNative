import React, { useState, useEffect } from 'react';
import { ScrollView, Image, StyleSheet, SafeAreaView, TouchableOpacity, Text, TextInput, View, FlatList, Alert } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const API_KEY = '157c8aa1011d8ee27cbdbe624298e4a6';
const LANGUAGE = 'pt-BR';

interface Movie {
  id: number;
  poster_path?: string;
  title: string;
}

interface MovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  release_date: string;
}

interface StreamingProvider {
  provider_name: string;
}

const PesquisaScreen: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const navigation = useNavigation();

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=${LANGUAGE}`
      );
      const data = response.data.results;
      const titles = data.map((movie: Movie) => movie.title);
      setSuggestions(titles);
    } catch (error) {
      console.error('Erro ao buscar sugestões de filmes:', error);
    }
  };

  const fetchMovieDetailsById = async (movieId: number): Promise<MovieDetails | null> => {
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&language=${LANGUAGE}`
      );
      const data = response.data;
      return {
        id: data.id,
        title: data.title,
        overview: data.overview,
        poster_path: data.poster_path,
        release_date: data.release_date,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.error('Filme não encontrado.');
        Alert.alert('Erro', 'Filme não encontrado.');
      } else {
        console.error('Erro ao buscar os detalhes do filme:', error);
        Alert.alert('Erro', 'Não foi possível buscar os detalhes do filme.');
      }
      return null;
    }
  };

  const fetchStreamingAvailability = async (movieId: number): Promise<StreamingProvider[]> => {
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/${movieId}/watch/providers?api_key=${API_KEY}`
      );
      const streamingData = response.data.results.BR?.flatrate;
      if (streamingData) {
        return streamingData.map((provider: any) => ({
          provider_name: provider.provider_name,
        }));
      } else {
        return [];
      }
    } catch (error) {
      console.error('Erro ao buscar a disponibilidade do filme em plataformas de streaming:', error);
      return [];
    }
  };

  const handleSearch = async () => {
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=${LANGUAGE}&query=${searchTerm}`
      );
      const data = response.data;
      setSearchResults(data.results);
    } catch (error) {
      console.error('Erro ao buscar os filmes:', error);
      Alert.alert('Erro', 'Não foi possível buscar os filmes.');
    }
  };

  const handleMoviePress = async (movie: Movie) => {
    const movieDetails = await fetchMovieDetailsById(movie.id);
    if (movieDetails) {
      const streamingProviders = await fetchStreamingAvailability(movie.id);
      navigation.navigate('Detalhes', { movieDetails, streamingProviders });
    }
  };

  const handleBackToHome = () => {
    navigation.goBack();
  };

  const renderMovieItem = ({ item }: { item: Movie }) => (
    <TouchableOpacity onPress={() => handleMoviePress(item)} style={styles.movieContainer}>
      {item.poster_path && (
        <Image
          source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }}
          style={styles.poster}
        />
      )}
      <Text style={styles.title}>{item.title}</Text>
    </TouchableOpacity>
  );

  const renderSuggestionItem = (suggestion: string) => (
    <TouchableOpacity
      key={suggestion}
      style={styles.suggestionItem}
      onPress={() => setSearchTerm(suggestion)}
    >
      <Text style={styles.suggestionText}>{suggestion}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackToHome}>
          <Ionicons name="arrow-back" size={24} color="#555" />
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Digite o termo de pesquisa"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollView}>
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Sugestões de Filmes:</Text>
          {suggestions.map(renderSuggestionItem)}
        </View>
        <View style={styles.resultsContainer}>
          <FlatList
            data={searchResults}
            renderItem={renderMovieItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1f1e1e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    marginLeft: 5,
    color: '#555',
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  searchButton: {
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  scrollView: {
    flex: 1,
  },
  suggestionsContainer: {
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  suggestionItem: {
    paddingVertical: 5,
  },
  suggestionText: {
    fontSize: 14,
    color: '#fff',
  },
  resultsContainer: {
    marginBottom: 20,
  },
  movieContainer: {
    marginRight: 15,
  },
  poster: {
    width: 150,
    height: 225,
    borderRadius: 10,
  },
  title: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default PesquisaScreen;
