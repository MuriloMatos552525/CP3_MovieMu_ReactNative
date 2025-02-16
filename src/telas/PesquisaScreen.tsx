import React, { useState, useEffect, useCallback } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Text,
  View,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
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

const PesquisaScreen: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
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
      const data = response.data.results as Movie[];
      const titles = data.map((movie) => movie.title);
      setSuggestions(titles);
    } catch (error) {
      console.error('Erro ao buscar sugestões de filmes:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      Alert.alert('Atenção', 'Digite um termo de pesquisa.');
      return;
    }
    try {
      const encodedQuery = encodeURIComponent(searchTerm);
      const response = await axios.get(
        `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=${LANGUAGE}&query=${encodedQuery}`
      );
      const data = response.data;
      if (data.results && data.results.length > 0) {
        setSearchResults(data.results);
      } else {
        Alert.alert('Nenhum filme encontrado.');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Erro ao buscar os filmes:', error);
      Alert.alert('Erro', 'Não foi possível buscar os filmes.');
    }
  };

  const handleMoviePress = useCallback((movie: Movie) => {
    navigation.navigate('Detalhes', { movieId: movie.id });
  }, [navigation]);

  const handleBackToHome = () => {
    navigation.goBack();
  };

  const renderMovieItem = useCallback(({ item }: { item: Movie }) => (
    <TouchableOpacity
      onPress={() => handleMoviePress(item)}
      style={styles.movieContainer}
    >
      {item.poster_path ? (
        <Image
          source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }}
          style={styles.poster}
        />
      ) : (
        <View style={[styles.poster, styles.noImage]}>
          <Text style={styles.noImageText}>Sem Imagem</Text>
        </View>
      )}
      <Text style={styles.title}>{item.title}</Text>
    </TouchableOpacity>
  ), [handleMoviePress]);

  const renderSuggestionItem = useCallback((suggestion: string) => (
    <TouchableOpacity
      key={suggestion}
      style={styles.suggestionItem}
      onPress={() => setSearchTerm(suggestion)}
    >
      <Text style={styles.suggestionText}>{suggestion}</Text>
    </TouchableOpacity>
  ), []);

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
  container: { flex: 1, backgroundColor: '#1f1e1e', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { marginRight: 10, flexDirection: 'row', alignItems: 'center' },
  backButtonText: { marginLeft: 5, color: '#555' },
  input: { flex: 1, height: 40, paddingHorizontal: 10, backgroundColor: '#fff', borderRadius: 5 },
  searchButton: { backgroundColor: '#f44336', padding: 10, borderRadius: 5, marginLeft: 10 },
  scrollView: { flex: 1 },
  suggestionsContainer: { marginBottom: 20 },
  suggestionsTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  suggestionItem: { paddingVertical: 5 },
  suggestionText: { fontSize: 14, color: '#fff' },
  resultsContainer: { marginBottom: 20 },
  movieContainer: { marginRight: 15, alignItems: 'center' },
  poster: { width: 150, height: 225, borderRadius: 10, marginBottom: 10 },
  noImage: {
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: { color: '#fff' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
});

export default PesquisaScreen;
