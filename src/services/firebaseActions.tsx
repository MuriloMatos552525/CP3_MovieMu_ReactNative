import { collection, addDoc, deleteDoc, doc, getDocs, updateDoc, query, where } from "firebase/firestore";
import { db } from '../services/firebaseConfig';



// Função para adicionar filme aos favoritos com ranking
export const addFavoriteMovie = async (userId, movie, ranking) => {
  try {
    const docRef = await addDoc(collection(db, 'favoriteMovies'), { ...movie, userId, ranking });
    console.log("Filme adicionado aos favoritos com ID: ", docRef.id);
  } catch (e) {
    console.error("Erro ao adicionar filme aos favoritos: ", e);
  }
};

// Função para remover filme dos favoritos
export const removeFavoriteMovie = async (docId) => {
  try {
    await deleteDoc(doc(db, 'favoriteMovies', docId));
    console.log("Filme removido dos favoritos com ID: ", docId);
  } catch (e) {
    console.error("Erro ao remover filme dos favoritos: ", e);
  }
};

// Função para listar filmes favoritos de um usuário
export const getFavoriteMovies = async (userId) => {
  const q = query(collection(db, 'favoriteMovies'), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  const favoriteMovies = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return favoriteMovies;
};

// Função para atualizar dados de um filme favorito, incluindo ranking
export const updateFavoriteMovie = async (docId, updatedData) => {
  try {
    const docRef = doc(db, 'favoriteMovies', docId);
    await updateDoc(docRef, updatedData);
    console.log("Filme favorito atualizado com ID: ", docId);
  } catch (e) {
    console.error("Erro ao atualizar filme favorito: ", e);
  }
};
