import React, { useState, useEffect } from 'react';
import { FlatList, Image, StyleSheet, SafeAreaView, TouchableOpacity, Text, View, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import { Ionicons } from '@expo/vector-icons';

interface Movie {
  id: number;
  poster_path?: string; 
  title: string;
}

const FavoritosScreen: React.FC = () => {
  const [favoriteMovies, setFavoriteMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true); 

  const loadFavoriteMovies = async () => {
    try {
      const data = await AsyncStorage.getItem('favoriteMovies');
      if (data !== null) {
        const parsedData = JSON.parse(data); 
        setFavoriteMovies(parsedData);
      }
    } catch (error) {
      console.error('Erro ao carregar filmes favoritos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os filmes favoritos.');
    } finally {
      setIsLoading(false); 
    }
  };

  const saveFavoriteMovies = async (movies: Movie[]) => {
    try {
      const stringifiedData = JSON.stringify(movies);
      await AsyncStorage.setItem('favoriteMovies', stringifiedData);
    } catch (error) {
      console.error('Erro ao salvar filmes favoritos:', error);
      Alert.alert('Erro', 'Não foi possível salvar os filmes favoritos.');
    }
  };

  const handleAddFavoriteMovie = (movie: Movie) => {
    const updatedFavorites = [...favoriteMovies, movie];
    setFavoriteMovies(updatedFavorites);
    saveFavoriteMovies(updatedFavorites);
  };

  const handleRemoveFavoriteMovie = async (movieId: number) => {
    try {
      const updatedFavorites = favoriteMovies.filter((movie) => movie.id !== movieId);
      setFavoriteMovies(updatedFavorites);
      await saveFavoriteMovies(updatedFavorites); 
    } catch (error) {
      console.error('Erro ao remover filme favorito:', error);
      Alert.alert('Erro', 'Não foi possível remover o filme dos favoritos.');
    }
  };

  const renderItem = ({ item }: { item: Movie }) => (
    <TouchableOpacity style={styles.movieContainer}>
      {item?.poster_path && (
        <Image
          source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }}
          style={styles.posterImage}
        />
      )}
      <Text style={styles.title}>{item.title}</Text>
      <TouchableOpacity onPress={() => handleRemoveFavoriteMovie(item.id)}>
        <Ionicons name="heart-dislike" size={24} color="#f44336" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  useEffect(() => {
    loadFavoriteMovies(); 
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <Text style={styles.loadingText}>Carregando filmes favoritos...</Text>
      ) : favoriteMovies.length > 0 ? (
        <FlatList
          data={favoriteMovies}
          renderItem={renderItem}
          keyExtractor={(item) => item?.id?.toString() ?? uuid.v4()}
        />
      ) : (
        <View style={styles.emptyMessageContainer}>
          <Text style={styles.emptyMessageText}>Você ainda não tem filmes favoritos.</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  movieContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  posterImage: {
    width: 100,
    height: 150,
    resizeMode: 'cover',
    marginRight: 16,
  },
  title: {
    flex: 1,
    fontSize: 18,
    color: '#333',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    color: '#333',
  },
  emptyMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMessageText: {
    fontSize: 16,
    color: 'gray',
  },
});

export default FavoritosScreen;
