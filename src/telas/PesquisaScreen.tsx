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
  StatusBar,
  ImageBackground
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../App'; 
import { LinearGradient } from 'expo-linear-gradient';

const API_KEY = '157c8aa1011d8ee27cbdbe624298e4a6';
const { width } = Dimensions.get('window');

type Props = StackScreenProps<RootStackParamList, 'Pesquisa'>;

interface Movie {
  id: number;
  poster_path?: string;
  title: string;
  vote_average?: number;
}

// Gêneros com Imagens de Fundo (Estilo Apple TV)
// Nota: Em produção, o ideal é ter essas imagens nos assets locais para carregar instantaneamente.
// Aqui estou usando URLs representativas.
const GENRES = [
  { id: 28, name: 'Ação', image: 'https://image.tmdb.org/t/p/w500/1E5baAaEse26fej7uHcjOgEE2t2.jpg' }, 
  { id: 12, name: 'Aventura', image: 'https://image.tmdb.org/t/p/w500/8RpDja60oLJnyK65Pv9n14Dq7sw.jpg' },
  { id: 35, name: 'Comédia', image: 'https://image.tmdb.org/t/p/w500/gKkl37BQuKTanygYQG1pyYgLVgf.jpg' },
  { id: 18, name: 'Drama', image: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg' },
  { id: 27, name: 'Terror', image: 'https://image.tmdb.org/t/p/w500/u1wHUA0R48FH4WV3sGqjwx3aNZm.jpg' },
  { id: 10749, name: 'Romance', image: 'https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg' },
  { id: 878, name: 'Sci-Fi', image: 'https://image.tmdb.org/t/p/w500/9HT9982bzgN5on1sLRmc1GMn6ZC.jpg' },
  { id: 53, name: 'Suspense', image: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg' },
  { id: 16, name: 'Animação', image: 'https://image.tmdb.org/t/p/w500/qhb1qOilapbapxWQn9jtRCMwXJF.jpg' },
  { id: 99, name: 'Doc', image: 'https://image.tmdb.org/t/p/w500/sImO9X1353MvQ52Xyn6Xo8geFkR.jpg' },
];

const PesquisaScreen: React.FC<Props> = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [trending, setTrending] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    fetchTrending();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchText.trim().length > 0) {
        setActiveGenre(null);
        performTextSearch(searchText);
      } else if (searchText.trim().length === 0 && !activeGenre) {
        setMovies([]);
      }
    }, 600);
    return () => clearTimeout(delayDebounce);
  }, [searchText]);

  const fetchTrending = async () => {
    try {
      const res = await axios.get(`https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}&language=pt-BR`);
      setTrending(res.data.results || []);
    } catch (error) { console.error(error); }
  };

  const performTextSearch = async (query: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&include_adult=false`);
      setMovies(res.data.results || []);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const handleGenrePress = async (genreId: number, genreName: string) => {
    Keyboard.dismiss();
    setSearchText('');
    setActiveGenre(genreName);
    setLoading(true);
    try {
      const res = await axios.get(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=pt-BR&sort_by=popularity.desc&with_genres=${genreId}`);
      setMovies(res.data.results || []);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const clearAll = () => {
    setSearchText('');
    setActiveGenre(null);
    setMovies([]);
    Keyboard.dismiss();
  };

  const renderMovieItem = ({ item }: { item: Movie }) => (
    <TouchableOpacity 
      style={styles.movieCard} 
      onPress={() => navigation.navigate('Detalhes', { movieId: item.id })}
      activeOpacity={0.7}
    >
      {item.poster_path ? (
        <Image source={{ uri: `https://image.tmdb.org/t/p/w342${item.poster_path}` }} style={styles.poster} />
      ) : (
        <View style={[styles.poster, styles.noImage]}><Ionicons name="image-outline" size={30} color="#333" /></View>
      )}
    </TouchableOpacity>
  );

  // Renderiza o Card de Gênero Estilo Apple TV
  const renderGenreCard = ({ item }: { item: typeof GENRES[0] }) => (
    <TouchableOpacity 
      style={styles.genreCard}
      activeOpacity={0.8}
      onPress={() => handleGenrePress(item.id, item.name)}
    >
        <ImageBackground 
            source={{ uri: item.image }} 
            style={styles.genreBackground}
            imageStyle={{ borderRadius: 12 }}
        >
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
                style={styles.genreGradient}
            >
                <Text style={styles.genreTitle}>{item.name}</Text>
            </LinearGradient>
        </ImageBackground>
    </TouchableOpacity>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* HEADER */}
        <View style={styles.header}>
            <Text style={styles.pageTitle}>Buscar</Text>
            <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color="#8e8e93" />
                <TextInput 
                    ref={searchInputRef}
                    style={styles.input}
                    placeholder="Programas, Filmes e Mais"
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

        {loading ? (
            <View style={styles.centerContent}><ActivityIndicator size="large" color="#fff" /></View>
        ) : (
            <>
                {(movies.length > 0 || activeGenre) ? (
                    <View style={{flex: 1}}>
                        <View style={styles.resultsHeader}>
                             <Text style={styles.resultsTitle}>
                                 {activeGenre ? `Gênero: ${activeGenre}` : `Resultados para "${searchText}"`}
                             </Text>
                        </View>
                        
                        {movies.length === 0 ? (
                            <View style={styles.centerContent}><Text style={styles.emptyText}>Nenhum filme encontrado.</Text></View>
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
                    // DASHBOARD INICIAL
                    <FlatList
                        data={[]} // Lista principal vazia, usamos ListHeaderComponent
                        renderItem={null}
                        ListHeaderComponent={
                            <View>
                                {/* GRID DE GÊNEROS */}
                                <View style={styles.genresGrid}>
                                    {GENRES.map((genre) => (
                                        <View key={genre.id} style={styles.genreWrapper}>
                                            {renderGenreCard({ item: genre })}
                                        </View>
                                    ))}
                                </View>

                                {/* EM ALTA (Opcional, pode remover se quiser só categorias) */}
                                <Text style={styles.sectionTitle}>Em Alta na Semana</Text>
                                <FlatList 
                                    data={trending}
                                    keyExtractor={(item) => String(item.id)}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ paddingHorizontal: 16 }}
                                    renderItem={({item}) => (
                                        <TouchableOpacity 
                                            style={styles.trendingCard}
                                            onPress={() => navigation.navigate('Detalhes', { movieId: item.id })}
                                        >
                                            <Image source={{ uri: `https://image.tmdb.org/t/p/w342${item.poster_path}` }} style={styles.trendingImage} />
                                        </TouchableOpacity>
                                    )}
                                />
                            </View>
                        }
                        contentContainerStyle={{ paddingBottom: 120 }}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  pageTitle: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 15 }, // Estilo Apple Title
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c1c1e',
    borderRadius: 12, paddingHorizontal: 12, height: 40,
  },
  input: { flex: 1, color: '#fff', marginLeft: 10, fontSize: 16, height: '100%' },

  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#666', fontSize: 16 },

  resultsHeader: { paddingHorizontal: 16, paddingVertical: 15 },
  resultsTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingBottom: 120 },
  movieCard: {
    flex: 1/3, aspectRatio: 0.67, marginBottom: 12, borderRadius: 8,
    overflow: 'hidden', backgroundColor: '#1c1c1e',
  },
  poster: { width: '100%', height: '100%', resizeMode: 'cover' },
  noImage: { justifyContent: 'center', alignItems: 'center' },

  // Gêneros Grid (2 colunas)
  genresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between', // Espaço entre colunas
  },
  genreWrapper: {
    width: (width - 44) / 2, // Calcula largura exata para 2 colunas com margem
    marginBottom: 12,
  },
  genreCard: {
    height: 100, // Altura do card
    borderRadius: 12,
    overflow: 'hidden',
  },
  genreBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  genreGradient: {
    height: '60%', // Gradiente apenas na parte inferior
    justifyContent: 'flex-end',
    padding: 10,
  },
  genreTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 4,
  },

  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginLeft: 16, marginBottom: 15, marginTop: 30 },
  trendingCard: { width: 120, marginRight: 12 },
  trendingImage: { width: 120, height: 180, borderRadius: 8, backgroundColor: '#1c1c1e' },
});

export default PesquisaScreen;