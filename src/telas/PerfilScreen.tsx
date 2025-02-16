// src/telas/PerfilScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
  Button,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../services/firebaseConfig";
import {
  getUserProfile,
  getReviewsByUser,
  getFavoriteMovies,
  getSharedListsByUser,
  getFriendsLastReviews,
  createOrUpdateUserDoc,
} from "../services/firebaseActions";
import { setTop5Movie } from "../services/firebaseActions"; // Nova função do top5
import axios from "axios"; // Para buscar filmes da TMDb

import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../../App"; 

const TMDB_API_KEY = "157c8aa1011d8ee27cbdbe624298e4a6";

type Props = StackScreenProps<RootStackParamList, "Perfil">;

interface UserProfile {
  displayName?: string;
  photoURL?: string;
  friends?: string[];
  bio?: string;
  top5?: {
    [pos: number]: {
      id: number;
      title: string;
      poster_path?: string;
    };
  };
}

interface Review {
  id: string;
  movieId: number;
  rating: number;
  comment: string;

  movieTitle?: string;      // Nome do filme
  poster_path?: string;     // Capa do filme
}

interface FavoriteMovie {
  id: string;
  title: string;
  poster_path?: string;
}

interface SharedList {
  id: string;
  listName: string;
}

const PerfilScreen: React.FC<Props> = ({ navigation }) => {
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [favorites, setFavorites] = useState<FavoriteMovie[]>([]);
  const [sharedLists, setSharedLists] = useState<SharedList[]>([]);
  const [friendsReviews, setFriendsReviews] = useState<Review[]>([]);

  // Estados para edição de perfil
  const [isEditing, setIsEditing] = useState(false);
  const [tempDisplayName, setTempDisplayName] = useState("");
  const [tempPhotoURL, setTempPhotoURL] = useState("");
  const [tempBio, setTempBio] = useState("");

  // Modal e busca para Top 5
  const [showTop5Modal, setShowTop5Modal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]); // array de filmes da TMDb
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      Alert.alert("Atenção", "É preciso estar logado para acessar o perfil.");
      navigation.goBack();
      return;
    }
    loadAllData(user.uid);
  }, [user]);

  const loadAllData = async (uid: string) => {
    try {
      setLoading(true);
      const userData = await getUserProfile(uid);
      setProfile(userData);

      const userReviews = await getReviewsByUser(uid);
      setReviews(userReviews);

      const userFavorites = await getFavoriteMovies(uid);
      const top5 = userFavorites.slice(0, 5);
      setFavorites(top5);

      const lists = await getSharedListsByUser(uid);
      setSharedLists(lists);

      if (userData && userData.friends && userData.friends.length > 0) {
        const friendReviews = await getFriendsLastReviews(userData.friends);
        setFriendsReviews(friendReviews);
      } else {
        setFriendsReviews([]);
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      Alert.alert("Erro", "Não foi possível carregar o perfil.");
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    if (profile) {
      setTempDisplayName(profile.displayName || "");
      setTempPhotoURL(profile.photoURL || "");
      setTempBio(profile.bio || "");
      setIsEditing(true);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      await createOrUpdateUserDoc(user.uid, {
        displayName: tempDisplayName.trim() || user.email,
        photoURL: tempPhotoURL.trim() || "",
        bio: tempBio.trim() || "",
      });
      loadAllData(user.uid);
      setIsEditing(false);
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível salvar o perfil.");
    } finally {
      setLoading(false);
    }
  };

  // Renderização do histórico, usando movieTitle ao invés de movieId
  const renderReviews = () => {
    if (reviews.length === 0) {
      return (
        <Text style={styles.noDataText}>Nenhuma avaliação cadastrada.</Text>
      );
    }
    return reviews.map((rev) => (
      <View key={rev.id} style={styles.reviewItem}>
        {rev.poster_path ? (
          <Image
            source={{ uri: `https://image.tmdb.org/t/p/w200${rev.poster_path}` }}
            style={styles.reviewPoster}
          />
        ) : (
          <View style={[styles.reviewPoster, styles.posterPlaceholder]}>
            <Text style={{ color: "#aaa" }}>Sem imagem</Text>
          </View>
        )}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontWeight: "bold" }}>
            {rev.movieTitle || "Filme desconhecido"}
          </Text>
          <Text style={{ marginTop: 4 }}>Nota: {rev.rating} / 5</Text>
          <Text style={{ marginTop: 4 }}>{rev.comment}</Text>
        </View>
      </View>
    ));
  };

  // Exibir top5 armazenado no profile
  const renderTop5 = () => {
    const slots = [1, 2, 3, 4, 5];
    return slots.map((pos) => {
      let data = undefined;
      if (profile?.top5 && profile.top5[pos]) {
        data = profile.top5[pos];
      }
      return (
        <View key={pos} style={styles.top5Item}>
          <Text style={styles.top5Position}>{pos}</Text>
          {data ? (
            <>
              <Image
                source={{
                  uri: `https://image.tmdb.org/t/p/w200${data.poster_path}`,
                }}
                style={styles.top5Poster}
              />
              <Text style={styles.top5Title} numberOfLines={1}>
                {data.title}
              </Text>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.top5Poster, styles.top5Empty]}
                onPress={() => openTop5Modal(pos)}
              >
                <Ionicons name="add" size={30} color="#888" />
              </TouchableOpacity>
              <Text style={styles.top5Title}>Vazio</Text>
            </>
          )}
        </View>
      );
    });
  };

  // Abrir modal para escolher um filme e gravar no top5
  const openTop5Modal = (position: number) => {
    setSelectedPosition(position);
    setShowTop5Modal(true);
  };

  const closeTop5Modal = () => {
    setShowTop5Modal(false);
    setSearchResults([]);
    setSearchQuery("");
    setSelectedPosition(null);
  };

  // Buscar filmes na TMDb
  const handleSearchMovie = async () => {
    if (!searchQuery.trim()) return;
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
          searchQuery
        )}`
      );
      setSearchResults(response.data.results || []);
    } catch (error) {
      console.error("Erro ao buscar filmes:", error);
      Alert.alert("Erro", "Não foi possível buscar filmes.");
    }
  };

  // Ao clicar num filme, define no top5
  const handleSelectMovieForTop5 = async (movie: any) => {
    if (!selectedPosition || !user) return;
    try {
      await setTop5Movie(user.uid, selectedPosition, {
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
      });
      Alert.alert("Sucesso", `Filme adicionado no slot ${selectedPosition}!`);
      // Recarrega userProfile
      loadAllData(user.uid);
    } catch (error: any) {
      console.error("Erro ao adicionar filme no top5:", error);
      Alert.alert("Erro", error.message || "Não foi possível adicionar.");
    } finally {
      closeTop5Modal();
    }
  };

  // *** Loading ***
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text>Carregando perfil...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text>Perfil não encontrado.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Cabeçalho do Perfil */}
      <View style={styles.header}>
        {!isEditing && (
          <Image
            source={
              profile.photoURL
                ? { uri: profile.photoURL }
                : require("../../assets/logo.png")
            }
            style={styles.avatar}
          />
        )}

        {!isEditing && (
          <Text style={styles.displayName}>
            {profile.displayName || user?.email || "Usuário Sem Nome"}
          </Text>
        )}

        {!isEditing ? (
          <TouchableOpacity style={styles.editButton} onPress={startEditing}>
            <Text style={styles.editButtonText}>Editar Perfil</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ alignItems: "center" }}>
            <Text style={styles.editingTitle}>Editando Perfil</Text>

            <Text style={styles.label}>Nome de Usuário</Text>
            <TextInput
              style={styles.input}
              value={tempDisplayName}
              onChangeText={setTempDisplayName}
              placeholder="Nome de Usuário"
            />

            <Text style={styles.label}>URL da Foto</Text>
            <TextInput
              style={styles.input}
              value={tempPhotoURL}
              onChangeText={setTempPhotoURL}
              placeholder="Link da imagem (https://...)"
            />

            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              value={tempBio}
              onChangeText={setTempBio}
              placeholder="Escreva algo sobre você..."
              multiline
            />

            <View style={styles.rowButtons}>
              <Button title="Salvar" onPress={saveProfile} />
              <Button title="Cancelar" onPress={() => setIsEditing(false)} />
            </View>
          </View>
        )}
      </View>

      {!isEditing && (
        <>
          {profile.bio ? (
            <View style={styles.section}>
              <Text style={styles.bioText}>Bio: {profile.bio}</Text>
            </View>
          ) : null}

          {/* TOP 5 - Dinâmico */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meu Top 5 de Favoritos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {renderTop5()}
            </ScrollView>
          </View>

          {/* Histórico de Avaliações (nome + capa) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Histórico de Avaliações</Text>
            {renderReviews()}
          </View>

          {/* Seção Listas Compartilhadas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Minhas Listas Compartilhadas</Text>
            {sharedLists.length === 0 ? (
              <Text style={styles.noDataText}>
                Não participa de nenhuma lista.
              </Text>
            ) : (
              sharedLists.map((lst) => (
                <TouchableOpacity
                  key={lst.id}
                  style={styles.sharedListItem}
                  onPress={() =>
                    navigation.navigate("SharedListDetail", {
                      listId: lst.id,
                      listName: lst.listName,
                    })
                  }
                >
                  <Ionicons
                    name="list"
                    size={20}
                    color="#555"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ color: "#333", fontWeight: "600" }}>
                    {lst.listName}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Amigos e Novidades de Amigos você pode manter igual */}
        </>
      )}

      {/* MODAL para buscar filmes e setar no top5 */}
      <Modal visible={showTop5Modal} animationType="slide" onRequestClose={closeTop5Modal}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Adicionar Filme ao Slot {selectedPosition}</Text>
          <TextInput
            style={styles.input}
            placeholder="Buscar filme..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Button title="Buscar" onPress={handleSearchMovie} />
          <Button title="Fechar" onPress={closeTop5Modal} color="#aaa" />

          <FlatList
            data={searchResults}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.searchResultItem}
                onPress={() => handleSelectMovieForTop5(item)}
              >
                {item.poster_path ? (
                  <Image
                    source={{ uri: `https://image.tmdb.org/t/p/w92${item.poster_path}` }}
                    style={styles.searchPoster}
                  />
                ) : (
                  <View style={[styles.searchPoster, styles.posterPlaceholder]}>
                    <Text style={{ color: "#aaa" }}>Sem img</Text>
                  </View>
                )}
                <Text style={{ marginLeft: 8, flex: 1 }}>{item.title}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </ScrollView>
  );
};

export default PerfilScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginVertical: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 8,
    backgroundColor: "#ccc",
  },
  displayName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  editButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginTop: 12,
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  editingTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  label: {
    alignSelf: "flex-start",
    fontWeight: "600",
    marginBottom: 4,
    marginTop: 4,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    marginBottom: 12,
    borderRadius: 4,
  },
  rowButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  section: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    paddingTop: 12,
  },
  bioText: {
    fontStyle: "italic",
    color: "#555",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  noDataText: {
    color: "#999",
    fontStyle: "italic",
  },

  // TOP 5
  top5Item: {
    width: 100,
    alignItems: "center",
    marginRight: 12,
  },
  top5Position: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  top5Poster: {
    width: 80,
    height: 120,
    borderRadius: 6,
    backgroundColor: "#ddd",
    marginBottom: 4,
  },
  top5Empty: {
    justifyContent: "center",
    alignItems: "center",
  },
  top5Title: {
    fontSize: 12,
    textAlign: "center",
  },

  // HISTÓRICO
  reviewItem: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
    paddingVertical: 8,
  },
  reviewPoster: {
    width: 60,
    height: 90,
    borderRadius: 4,
    backgroundColor: "#ddd",
  },
  posterPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },

  // LISTAS
  sharedListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },

  // MODAL TOP5
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
  },
  searchPoster: {
    width: 40,
    height: 60,
    borderRadius: 4,
    backgroundColor: "#ddd",
  },
});

