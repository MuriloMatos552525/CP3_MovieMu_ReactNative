import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
  StatusBar
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../App'; 

const API_KEY = '157c8aa1011d8ee27cbdbe624298e4a6';
const { width } = Dimensions.get('window');

type Props = StackScreenProps<RootStackParamList, 'Pesquisa'>;

interface Movie {
  id: number;
  poster_path?: string;
  title: string;
  vote_average?: number;
}

// Lista expandida de gêneros para ser mais útil
const GENRES = [
  { id: 28, name: 'Ação' },
  { id: 12, name: 'Aventura' },
  { id: 35, name: 'Comédia' },
  { id: 18, name: 'Drama' },
  { id: 27, name: 'Terror' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Ficção' },
  { id: 53, name: 'Suspense' },
  { id: 16, name: 'Animação' },
  { id: 99, name: 'Documentário' },
];

const PesquisaScreen: React.FC<Props> = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [trending, setTrending] = useState<Movie[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [activeGenre, setActiveGenre] = useState<string | null>(null); // Para saber se estamos vendo um gênero
  
  const searchInputRef = useRef<TextInput>(null);

  // Carregar tendências iniciais
  useEffect(() => {
    fetchTrending();
  }, []);

  // Lógica de Debounce para busca de texto
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchText.trim().length > 0) {
        // Se tem texto, buscamos por texto e limpamos o gênero ativo
        setActiveGenre(null);
        performTextSearch(searchText);
      } else if (searchText.trim().length === 0 && !activeGenre) {
        // Se limpou o texto e não tem gênero selecionado, limpa resultados
        setMovies([]);
      }
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [searchText]);

  const fetchTrending = async () => {
    try {
      const res = await axios.get(
        `https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}&language=pt-BR`
      );
      setTrending(res.data.results || []);
    } catch (error) {
      console.error(error);
    }
  };

  const performTextSearch = async (query: string) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&include_adult=false`
      );
      setMovies(res.data.results || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenrePress = async (genreId: number, genreName: string) => {
    Keyboard.dismiss();
    setSearchText(''); // Limpa o texto para não conflitar
    setActiveGenre(genreName); // Define qual gênero estamos vendo
    setLoading(true);
    
    try {
      const res = await axios.get(
        `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=pt-BR&sort_by=popularity.desc&with_genres=${genreId}`
      );
      setMovies(res.data.results || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setSearchText('');
    setActiveGenre(null);
    setMovies([]);
    Keyboard.dismiss();
  };

  // Renderiza um cartaz de filme (Grid)
  const renderMovieItem = ({ item }: { item: Movie }) => (
    <TouchableOpacity 
      style={styles.movieCard} 
      onPress={() => navigation.navigate('Detalhes', { movieId: item.id })}
      activeOpacity={0.7}
    >
      {item.poster_path ? (
        <Image 
          source={{ uri: `https://image.tmdb.org/t/p/w342${item.poster_path}` }} 
          style={styles.poster} 
        />
      ) : (
        <View style={[styles.poster, styles.noImage]}>
          <Ionicons name="image-outline" size={30} color="#333" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* HEADER DE BUSCA (Estilo iOS/Apple) */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={28} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color="#8e8e93" />
                <TextInput 
                    ref={searchInputRef}
                    style={styles.input}
                    placeholder="Filmes, personagens, elenco..."
                    placeholderTextColor="#8e8e93"
                    value={searchText}
                    onChangeText={setSearchText}
                    returnKeyType="search"
                />
                {(searchText.length > 0 || activeGenre) && (
                    <TouchableOpacity onPress={clearAll}>
                        <Ionicons name="close-circle" size={18} color="#8e8e93" />
                    </TouchableOpacity>
                )}
            </View>
        </View>

        {/* LOADING */}
        {loading ? (
            <View style={styles.centerContent}>
                <ActivityIndicator size="large" color="#fff" />
            </View>
        ) : (
            <>
                {/* ESTADO 1: EXIBINDO RESULTADOS (Texto ou Gênero) */}
                {(movies.length > 0 || activeGenre) ? (
                    <View style={{flex: 1}}>
                        <View style={styles.resultsHeader}>
                             <Text style={styles.resultsTitle}>
                                 {activeGenre ? `Gênero: ${activeGenre}` : `Resultados para "${searchText}"`}
                             </Text>
                        </View>
                        
                        {movies.length === 0 ? (
                            <View style={styles.centerContent}>
                                <Text style={styles.emptyText}>Nenhum filme encontrado.</Text>
                            </View>
                        ) : (
                            <FlatList 
                                data={movies}
                                keyExtractor={(item) => String(item.id)}
                                renderItem={renderMovieItem}
                                numColumns={3}
                                contentContainerStyle={styles.listContent}
                                columnWrapperStyle={{ gap: 12 }}
                                showsVerticalScrollIndicator={false}
                            />
                        )}
                    </View>
                ) : (
                    // ESTADO 2: DASHBOARD INICIAL (Categorias + Trending)
                    <View style={{flex: 1}}>
                         <Text style={styles.sectionTitle}>Explorar por Gênero</Text>
                         
                         <View style={styles.genresContainer}>
                             {GENRES.map((genre) => (
                                 <TouchableOpacity 
                                    key={genre.id} 
                                    style={styles.genrePill}
                                    onPress={() => handleGenrePress(genre.id, genre.name)}
                                 >
                                     <Text style={styles.genreText}>{genre.name}</Text>
                                 </TouchableOpacity>
                             ))}
                         </View>

                         <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Buscas Populares</Text>
                         <FlatList 
                             data={trending}
                             keyExtractor={(item) => String(item.id)}
                             horizontal
                             showsHorizontalScrollIndicator={false}
                             contentContainerStyle={{ paddingHorizontal: 20 }}
                             renderItem={({item}) => (
                                 <TouchableOpacity 
                                    style={styles.trendingCard}
                                    onPress={() => navigation.navigate('Detalhes', { movieId: item.id })}
                                 >
                                     <Image 
                                        source={{ uri: `https://image.tmdb.org/t/p/w342${item.poster_path}` }} 
                                        style={styles.trendingImage}
                                     />
                                     <Text style={styles.trendingRank} numberOfLines={1}>{item.title}</Text>
                                 </TouchableOpacity>
                             )}
                         />
                    </View>
                )}
            </>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Preto Sóbrio
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1e', // Divisor sutil
  },
  backButton: {
    marginRight: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e', // Cinza escuro (estilo input iOS)
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
  },
  input: {
    flex: 1,
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    height: '100%',
  },

  // Conteúdo Centralizado
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },

  // Resultados
  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  resultsTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  movieCard: {
    flex: 1/3, // Grid de 3
    aspectRatio: 0.67, // Formato poster
    marginBottom: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#1c1c1e',
  },
  poster: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Dashboard (Categorias)
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 20,
    marginBottom: 15,
    marginTop: 20,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
  },
  genrePill: {
    backgroundColor: '#1c1c1e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  genreText: {
    color: '#ddd',
    fontSize: 14,
    fontWeight: '500',
  },

  // Trending Horizontal
  trendingCard: {
    width: 120,
    marginRight: 12,
  },
  trendingImage: {
    width: 120,
    height: 180,
    borderRadius: 8,
    backgroundColor: '#1c1c1e',
    marginBottom: 5,
  },
  trendingRank: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default PesquisaScreen;