import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Button,
  TextInput,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import { Swipeable } from "react-native-gesture-handler";
import {
  getMoviesFromSharedList,
  addMovieToSharedList,
  removeMovieFromSharedList,
  markMovieAsWatchedInSharedList,
  SharedMovie,
} from "../services/firebaseActions";
import { shareListWithUser } from "../services/firebaseActions"; // <= Importa a nova função
import { auth } from "../services/firebaseConfig";
import { StackScreenProps } from "@react-navigation/stack";

const API_KEY = "157c8aa1011d8ee27cbdbe624298e4a6";

interface SharedListDetailParams {
  listId: string;
  listName: string;
}

type Props = StackScreenProps<
  { SharedListDetail: SharedListDetailParams },
  "SharedListDetail"
>;

interface MovieSearchResult {
  id: number;
  title: string;
  poster_path: string;
}

const SharedListDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { listId, listName } = route.params;
  const user = auth.currentUser;

  const [movies, setMovies] = useState<SharedMovie[]>([]);
  const [movieTitle, setMovieTitle] = useState<string>("");
  const [moviePoster, setMoviePoster] = useState<string>("");
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<MovieSearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Campo para digitar o ID de quem será convidado/compartilhado:
  const [shareUserId, setShareUserId] = useState<string>("");

  // Remove o header nativo
  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Debounce para a busca
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (movieTitle.length > 2) {
        searchMovies(movieTitle);
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [movieTitle]);

  const searchMovies = async (query: string) => {
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
      );
      setSearchResults(response.data.results);
    } catch (error) {
      console.error("Erro ao buscar filme:", error);
    }
  };

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    setLoading(true);
    try {
      const data = await getMoviesFromSharedList(listId);
      setMovies(data);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar os filmes da lista.");
    } finally {
      setLoading(false);
    }
  };

  // Compartilhar a lista com outro usuário
  const handleShareList = async () => {
    if (!shareUserId) {
      Alert.alert("Atenção", "Digite o ID (ou email) do usuário.");
      return;
    }
    try {
      await shareListWithUser(listId, shareUserId);
      Alert.alert("Sucesso", "Lista compartilhada com o usuário: " + shareUserId);
      setShareUserId("");
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível compartilhar a lista.");
    }
  };

  const handleAddMovie = async () => {
    if (!movieTitle) {
      Alert.alert("Atenção", "Digite o título do filme.");
      return;
    }
    if (!user) {
      Alert.alert("Erro", "Você precisa estar logado.");
      return;
    }
    if (!selectedMovieId) {
      Alert.alert("Atenção", "Selecione um filme válido dos resultados.");
      return;
    }
    // Armazena o id do TMDb no campo "tmdbId"
    const movieData = {
      tmdbId: selectedMovieId,
      title: movieTitle,
      poster_path: moviePoster,
    };
    try {
      // Adiciona o filme, definindo `addedBy` como user.uid (feito em addMovieToSharedList)
      await addMovieToSharedList(listId, user.uid, movieData);
      Alert.alert("Sucesso", "Filme adicionado à lista.");
      setMovieTitle("");
      setMoviePoster("");
      setSelectedMovieId(null);
      setSearchResults([]);
      loadMovies();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível adicionar o filme.");
    }
  };

  const confirmDelete = (movieId: string) => {
    Alert.alert(
      "Excluir Filme",
      "Deseja realmente excluir este filme?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => handleDeleteMovie(movieId),
        },
      ],
      { cancelable: true }
    );
  };

  const handleDeleteMovie = async (movieId: string) => {
    try {
      await removeMovieFromSharedList(listId, movieId);
      Alert.alert("Sucesso", "Filme removido da lista.");
      loadMovies();
    } catch (error: any) {
      Alert.alert("Erro", "Não foi possível remover o filme.");
    }
  };

  const confirmWatchedReview = (movieId: string) => {
    Alert.alert(
      "Filme Assistido",
      "Você já assistiu este filme. Deseja deixar um review?",
      [
        {
          text: "Não",
          onPress: () => handleMarkAsWatched(movieId),
          style: "default",
        },
        {
          text: "Sim",
          onPress: () => navigation.navigate("Review", { movieId }),
          style: "default",
        },
      ],
      { cancelable: true }
    );
  };

  const handleMarkAsWatched = async (movieId: string) => {
    try {
      await markMovieAsWatchedInSharedList(listId, movieId);
      Alert.alert("Sucesso", "Filme marcado como assistido.");
      loadMovies();
    } catch (error: any) {
      Alert.alert("Erro", "Não foi possível marcar o filme como assistido.");
    }
  };

  // Renderização do item da lista
  const renderMovieItem = ({ item }: { item: SharedMovie }) => {
    const renderLeftActions = () => (
      <TouchableOpacity style={styles.swipeAction} onPress={() => confirmDelete(item.id)}>
        <Text style={styles.swipeActionText}>Excluir</Text>
      </TouchableOpacity>
    );

    const renderRightActions = () => (
      <TouchableOpacity style={styles.swipeAction} onPress={() => confirmWatchedReview(item.id)}>
        <Text style={styles.swipeActionText}>Assistido</Text>
      </TouchableOpacity>
    );

    // Verifica quem adicionou o filme (item.addedBy é definido no addMovieToSharedList)
    let addedByText = "";
    if (item.addedBy) {
      addedByText = item.addedBy === user?.uid ? "Você" : item.addedBy;
    }

    return (
      <Swipeable
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
        overshootLeft={false}
        overshootRight={false}
      >
        <TouchableOpacity
          style={styles.movieItemContainer}
          onPress={() => navigation.navigate("Detalhes", { movieId: item.tmdbId })}
        >
          {item.poster_path ? (
            <Image
              source={{ uri: `https://image.tmdb.org/t/p/w200${item.poster_path}` }}
              style={styles.poster}
            />
          ) : (
            <View style={[styles.poster, styles.noImage]}>
              <Text style={styles.noImageText}>Sem Imagem</Text>
            </View>
          )}
          <View style={styles.infoContainer}>
            <Text style={styles.movieTitle}>{item.title}</Text>
            {addedByText ? (
              <Text style={styles.addedByText}>Adicionado por: {addedByText}</Text>
            ) : null}
            {item.watched && (
              <View style={styles.watchedBadge}>
                <Text style={styles.watchedBadgeText}>Assistido</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  // Renderiza cada resultado da busca
  const renderSearchResultItem = ({ item }: { item: MovieSearchResult }) => (
    <TouchableOpacity
      style={styles.searchItem}
      onPress={() => {
        setMovieTitle(item.title);
        setMoviePoster(item.poster_path);
        setSelectedMovieId(item.id);
        setSearchResults([]);
      }}
    >
      {item.poster_path ? (
        <Image
          source={{ uri: `https://image.tmdb.org/t/p/w92${item.poster_path}` }}
          style={styles.searchPoster}
        />
      ) : (
        <View style={[styles.searchPoster, styles.noImage]}>
          <Text style={styles.noImageText}>Sem Imagem</Text>
        </View>
      )}
      <Text style={styles.searchTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <View style={styles.container}>
          {/* Header customizado */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>{"< Voltar"}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{listName}</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Campo para digitar o ID/E-mail de quem será convidado + Botão de compartilhar */}
          <View style={styles.shareContainer}>
            <TextInput
              style={styles.shareInput}
              placeholder="ID do usuário para compartilhar"
              placeholderTextColor="#888"
              value={shareUserId}
              onChangeText={setShareUserId}
              keyboardAppearance="dark"
            />
            <Button title="Compartilhar" onPress={handleShareList} color="#007bff" />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#fff" style={{ marginVertical: 20 }} />
          ) : (
            <FlatList
              style={{ flex: 1 }}
              data={movies}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderMovieItem}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Nenhum filme adicionado ainda.</Text>
              }
            />
          )}

          {/* Formulário posicionado abaixo (marginTop: "auto") */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Adicionar Filme</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o nome do filme"
              placeholderTextColor="#888"
              value={movieTitle}
              onChangeText={setMovieTitle}
              keyboardAppearance="dark"
            />
            {searchResults.length > 0 && (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderSearchResultItem}
                style={styles.searchResults}
              />
            )}
            <Button title="Adicionar" onPress={handleAddMovie} color="#007bff" />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#121212",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    justifyContent: "space-between",
  },
  backText: {
    color: "#fff",
    fontSize: 16,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  // Campo de compartilhamento
  shareContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    justifyContent: "space-between",
  },
  shareInput: {
    flex: 1,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 4,
    padding: 10,
    color: "#fff",
    backgroundColor: "#1e1e1e",
  },

  movieItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  poster: {
    width: 50,
    height: 75,
    borderRadius: 4,
    marginRight: 12,
  },
  noImage: {
    backgroundColor: "#555",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    fontSize: 10,
    color: "#fff",
  },
  infoContainer: {
    flex: 1,
  },
  movieTitle: {
    fontSize: 16,
    color: "#fff",
  },
  addedByText: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  watchedBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  watchedBadgeText: {
    fontSize: 10,
    color: "#fff",
  },
  swipeAction: {
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginVertical: 4,
  },
  swipeActionText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  emptyText: {
    textAlign: "center",
    marginVertical: 16,
    color: "#fff",
  },
  form: {
    marginTop: "auto",
    borderTopWidth: 1,
    borderTopColor: "#444",
    paddingTop: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
    color: "#fff",
    backgroundColor: "#1e1e1e",
  },
  searchResults: {
    maxHeight: 200,
    marginBottom: 12,
    backgroundColor: "#1e1e1e",
    borderRadius: 4,
  },
  searchItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  searchPoster: {
    width: 40,
    height: 60,
    borderRadius: 4,
    marginRight: 8,
  },
  searchTitle: {
    fontSize: 14,
    color: "#fff",
  },
});

export default SharedListDetailScreen;
