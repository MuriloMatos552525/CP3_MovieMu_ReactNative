import React, { useState, useEffect, useCallback } from 'react';
import { 
  ScrollView, 
  Image, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Text, 
  View, 
  ActivityIndicator, 
  StatusBar, 
  RefreshControl 
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { useFonts, NanumPenScript_400Regular } from '@expo-google-fonts/nanum-pen-script';
import { Ionicons } from '@expo/vector-icons';

const API_KEY = '157c8aa1011d8ee27cbdbe624298e4a6';

interface Movie {
  id: number;
  poster_path?: string;
  title: string;
}

const TelaInicial: React.FC = () => {
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [nowPlayingMovies, setNowPlayingMovies] = useState<Movie[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [fontsLoaded] = useFonts({ NanumPenScript_400Regular });
  const navigation = useNavigation();

  const fetchMovies = async () => {
    try {
      const [
        popularResponse, 
        topRatedResponse, 
        upcomingResponse, 
        nowPlayingResponse, 
        trendingResponse
      ] = await Promise.all([
        axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`),
        axios.get(`https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}`),
        axios.get(`https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}`),
        axios.get(`https://api.themoviedb.org/3/movie/now_playing?api_key=${API_KEY}`),
        axios.get(`https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`)
      ]);
      setPopularMovies(popularResponse.data.results);
      setTopRatedMovies(topRatedResponse.data.results);
      setUpcomingMovies(upcomingResponse.data.results);
      setNowPlayingMovies(nowPlayingResponse.data.results);
      setTrendingMovies(trendingResponse.data.results);
    } catch (error) {
      console.error('Erro ao buscar filmes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMovies();
    setRefreshing(false);
  }, []);

  const handleMoviePress = useCallback((movieId: number) => {
    navigation.navigate('Detalhes', { movieId });
  }, [navigation]);

  const renderMovieItem = useCallback(({ item }: { item: Movie }) => (
    <TouchableOpacity onPress={() => handleMoviePress(item.id)}>
      <Image 
        source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }} 
        style={styles.poster}
      />
    </TouchableOpacity>
  ), [handleMoviePress]);

  const renderSection = useCallback((title: string, data: Movie[]) => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {data.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {data.map(movie => (
            <View key={movie.id} style={styles.movieItem}>
              {renderMovieItem({ item: movie })}
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.emptyMessage}>Nenhum filme disponível no momento</Text>
      )}
    </View>
  ), [renderMovieItem]);

  const handleLogoPress = () => {
    navigation.navigate('Desenvolvedores');
  };

  // Se as fontes ainda não carregaram, mostra loading
  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLogoPress} style={styles.logoContainer}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} />
          <Text style={styles.appName}>MovieMu</Text>
        </TouchableOpacity>

        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerIconButton} 
            onPress={() => navigation.navigate('Pesquisa')}
          >
            <Ionicons name="search" size={24} color="#fff" />
          </TouchableOpacity>

          {/* ====== BOTÃO DE PERFIL ====== */}
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigation.navigate('Perfil')}
          >
            <Ionicons name="person" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Carregando...</Text>
          </View>
        ) : (
          <>
            {renderSection('Filmes Populares', popularMovies)}
            {renderSection('Filmes Mais Bem Avaliados', topRatedMovies)}
            {renderSection('Próximos Lançamentos', upcomingMovies)}
            {renderSection('Filmes em Exibição Agora', nowPlayingMovies)}
            {renderSection('Filmes em Tendência', trendingMovies)}
            {/* Caso queira remover duplicação, pode apagar a linha abaixo */}
            {renderSection('Filmes que Estão em Breve', upcomingMovies)}
          </>
        )}
      </ScrollView>

      {/* Botão fixo para acesso às listas */}
      <TouchableOpacity 
        style={styles.listsButton} 
        onPress={() => navigation.navigate('SharedLists')}
      >
        <Ionicons name="list" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 5,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'NanumPenScript_400Regular',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    backgroundColor: '#222',
    padding: 10,
    borderRadius: 50,
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
  },
  sectionContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff',
  },
  movieItem: {
    marginRight: 15,
  },
  poster: {
    width: 150,
    height: 225,
    borderRadius: 10,
    marginBottom: 20,
  },
  emptyMessage: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#fff',
  },
  listsButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007bff',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TelaInicial;
