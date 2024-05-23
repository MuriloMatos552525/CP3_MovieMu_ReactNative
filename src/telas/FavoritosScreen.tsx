import React, { useState, useEffect } from 'react';
import { FlatList, Image, StyleSheet, SafeAreaView, TouchableOpacity, Text, View, Alert, TextInput, Button } from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFavoriteMovies, removeFavoriteMovie, updateFavoriteMovie } from '../services/firebaseActions';
import { Ionicons } from '@expo/vector-icons';

interface Movie {
  id: string;
  poster_path?: string;
  title: string;
}

const FavoritosScreen: React.FC = () => {
  const [favoriteMovies, setFavoriteMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const auth = getAuth();
  const user = auth.currentUser;

  const loadFavoriteMovies = async () => {
    if (!user) {
      Alert.alert('Erro', 'Você precisa estar logado para ver seus filmes favoritos.');
      return;
    }
    try {
      const movies = await getFavoriteMovies(user.uid);
      setFavoriteMovies(movies);
    } catch (error) {
      console.error('Erro ao carregar filmes favoritos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os filmes favoritos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavoriteMovie = async (docId: string) => {
    try {
      await removeFavoriteMovie(docId);
      setFavoriteMovies(favoriteMovies.filter((movie) => movie.id !== docId));
      Alert.alert('Sucesso', 'Filme removido dos favoritos.');
    } catch (error) {
      console.error('Erro ao remover filme favorito:', error);
      Alert.alert('Erro', 'Não foi possível remover o filme dos favoritos.');
    }
  };

  const handleUpdateFavoriteMovie = async () => {
    if (!editingMovie) return;

    try {
      await updateFavoriteMovie(editingMovie.id, { title: newTitle });
      setFavoriteMovies((prevMovies) => prevMovies.map((movie) =>
        movie.id === editingMovie.id ? { ...movie, title: newTitle } : movie
      ));
      setEditingMovie(null);
      setNewTitle('');
      Alert.alert('Sucesso', 'Filme atualizado com sucesso.');
    } catch (error) {
      console.error('Erro ao atualizar filme favorito:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o filme.');
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
      <TouchableOpacity onPress={() => {
        setEditingMovie(item);
        setNewTitle(item.title);
      }}>
        <Ionicons name="create" size={24} color="#000" />
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
          keyExtractor={(item) => item.id}
        />
      ) : (
        <View style={styles.emptyMessageContainer}>
          <Text style={styles.emptyMessageText}>Você ainda não tem filmes favoritos.</Text>
        </View>
      )}

      {editingMovie && (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.input}
            value={newTitle}
            onChangeText={setNewTitle}
          />
          <Button title="Atualizar" onPress={handleUpdateFavoriteMovie} />
          <Button title="Cancelar" onPress={() => setEditingMovie(null)} />
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
  editContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
});

export default FavoritosScreen;
