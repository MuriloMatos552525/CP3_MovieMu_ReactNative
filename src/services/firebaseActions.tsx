// src/services/firebaseActions.ts

import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  orderBy,
  limit,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

/** 
 * Tipos de Dados 
 */

// Avaliações
export interface Review {
  id: string;
  movieId: number;
  userId: string;
  rating: number;
  comment: string;
  createdAt?: any;
  updatedAt?: any;
}

// Listas Compartilhadas
export interface SharedList {
  id: string;
  creatorId: string;
  listName: string;
  allowOthersToAdd: boolean;
  participants: string[];
  createdAt?: any;
}

// Filmes em Listas Compartilhadas
// Agora o TMDb id será armazenado em "tmdbId"
export interface SharedMovie {
  id: string; // Esse será o ID gerado pelo Firestore
  tmdbId?: number;
  title: string;
  poster_path?: string;
  addedBy: string;
  addedAt?: any;
  watched?: boolean;
  watchedAt?: any;
}

// Perfil de Usuário
export interface UserProfile {
  displayName?: string;
  photoURL?: string;
  friends?: string[];
  createdAt?: any;
  updatedAt?: any;
  bio?: string; // <-- novo campo
}


/** 
 * Funções de Avaliações e Comentários 
 */

export const addReview = async (
  movieId: number,
  userId: string,
  rating: number,
  comment: string
): Promise<string> => {
  try {
    const reviewRef = await addDoc(collection(db, "reviews"), {
      movieId,
      userId,
      rating,
      comment,
      createdAt: serverTimestamp(),
    });
    return reviewRef.id;
  } catch (error) {
    console.error("Erro ao adicionar avaliação:", error);
    throw error;
  }
};

export const updateReview = async (
  reviewId: string,
  rating: number,
  comment: string
): Promise<void> => {
  try {
    const reviewRef = doc(db, "reviews", reviewId);
    await updateDoc(reviewRef, {
      rating,
      comment,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erro ao atualizar avaliação:", error);
    throw error;
  }
};

export const deleteReview = async (reviewId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "reviews", reviewId));
  } catch (error) {
    console.error("Erro ao deletar avaliação:", error);
    throw error;
  }
};

export const getReviewsByMovie = async (
  movieId: number
): Promise<Review[]> => {
  try {
    const qReviews = query(
      collection(db, "reviews"),
      where("movieId", "==", movieId)
    );
    const querySnapshot = await getDocs(qReviews);
    const reviews: Review[] = [];
    querySnapshot.forEach((docSnap) => {
      reviews.push({ id: docSnap.id, ...docSnap.data() } as Review);
    });
    return reviews;
  } catch (error) {
    console.error("Erro ao buscar avaliações do filme:", error);
    throw error;
  }
};

/** 
 * Funções de Listas Compartilhadas 
 */

export const createSharedList = async (
  creatorId: string,
  listName: string,
  allowOthersToAdd: boolean = false
): Promise<string> => {
  try {
    const listRef = await addDoc(collection(db, "sharedLists"), {
      creatorId,
      listName,
      allowOthersToAdd,
      participants: [creatorId],
      createdAt: serverTimestamp(),
    });
    return listRef.id;
  } catch (error) {
    console.error("Erro ao criar lista compartilhada:", error);
    throw error;
  }
};

export const getSharedListsByUser = async (
  userId: string
): Promise<SharedList[]> => {
  try {
    const qLists = query(
      collection(db, "sharedLists"),
      where("participants", "array-contains", userId)
    );
    const querySnapshot = await getDocs(qLists);
    const lists: SharedList[] = [];
    querySnapshot.forEach((docSnap) => {
      lists.push({ id: docSnap.id, ...docSnap.data() } as SharedList);
    });
    return lists;
  } catch (error) {
    console.error("Erro ao buscar listas compartilhadas:", error);
    throw error;
  }
};

/**
 * Adiciona um filme à lista compartilhada (verificando permissões).
 * Agora, o TMDb id é armazenado no campo "tmdbId" em vez de "id".
 */
export const addMovieToSharedList = async (
  listId: string,
  userId: string,
  movie: { title: string; poster_path?: string; tmdbId?: number }
): Promise<string> => {
  try {
    const listRef = doc(db, "sharedLists", listId);
    const listSnap = await getDoc(listRef);
    if (!listSnap.exists()) {
      throw new Error("Lista compartilhada não existe.");
    }
    const listData = listSnap.data() as SharedList;
    if (
      userId === listData.creatorId ||
      (listData.allowOthersToAdd && listData.participants.includes(userId))
    ) {
      const moviesCollectionRef = collection(listRef, "movies");
      const movieDoc = await addDoc(moviesCollectionRef, {
        ...movie,
        addedBy: userId,
        addedAt: serverTimestamp(),
        watched: false,
      });
      return movieDoc.id;
    } else {
      throw new Error("Usuário não autorizado a adicionar filmes nessa lista.");
    }
  } catch (error) {
    console.error("Erro ao adicionar filme à lista compartilhada:", error);
    throw error;
  }
};

export const getMoviesFromSharedList = async (
  listId: string
): Promise<SharedMovie[]> => {
  try {
    const listRef = doc(db, "sharedLists", listId);
    const moviesCollectionRef = collection(listRef, "movies");
    const querySnapshot = await getDocs(moviesCollectionRef);
    const movies: SharedMovie[] = [];
    querySnapshot.forEach((docSnap) => {
      // Aqui garantimos que o "id" seja o ID do documento Firestore
      movies.push({ id: docSnap.id, ...docSnap.data() } as SharedMovie);
    });
    return movies;
  } catch (error) {
    console.error("Erro ao buscar filmes da lista compartilhada:", error);
    throw error;
  }
};

/**
 * Remove um filme da lista compartilhada.
 * @param listId - ID da lista compartilhada.
 * @param movieId - ID do documento do filme na subcoleção "movies".
 */
export const removeMovieFromSharedList = async (
  listId: string,
  movieId: string
): Promise<void> => {
  try {
    const moviesCollectionRef = collection(db, "sharedLists", listId, "movies");
    const movieDocRef = doc(moviesCollectionRef, movieId);
    await deleteDoc(movieDocRef);
  } catch (error) {
    console.error("Erro ao remover filme da lista compartilhada:", error);
    throw error;
  }
};

/**
 * Marca um filme como assistido na lista compartilhada.
 * @param listId - ID da lista compartilhada.
 * @param movieId - ID do documento do filme na subcoleção "movies".
 */
export const markMovieAsWatchedInSharedList = async (
  listId: string,
  movieId: string
): Promise<void> => {
  try {
    const moviesCollectionRef = collection(db, "sharedLists", listId, "movies");
    const movieDocRef = doc(moviesCollectionRef, movieId);
    await updateDoc(movieDocRef, {
      watched: true,
      watchedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erro ao marcar filme como assistido na lista compartilhada:", error);
    throw error;
  }
};

/** 
 * Funções de Favoritos 
 */

export const addFavoriteMovie = async (
  userId: string,
  movieDetails: { id?: string; poster_path?: string; title: string }
): Promise<string> => {
  try {
    const favRef = await addDoc(collection(db, "favorites"), {
      userId,
      ...movieDetails,
      createdAt: serverTimestamp(),
    });
    return favRef.id;
  } catch (error) {
    console.error("Erro ao adicionar filme aos favoritos:", error);
    throw error;
  }
};

export const getFavoriteMovies = async (userId: string) => {
  try {
    const qFavs = query(
      collection(db, "favorites"),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(qFavs);
    const movies: any[] = [];
    querySnapshot.forEach((docSnap) => {
      movies.push({ id: docSnap.id, ...docSnap.data() });
    });
    return movies;
  } catch (error) {
    console.error("Erro ao buscar filmes favoritos:", error);
    throw error;
  }
};

export const removeFavoriteMovie = async (docId: string) => {
  try {
    await deleteDoc(doc(db, "favorites", docId));
  } catch (error) {
    console.error("Erro ao remover filme favorito:", error);
    throw error;
  }
};

export const updateFavoriteMovie = async (
  docId: string,
  data: any
): Promise<void> => {
  try {
    const favRef = doc(db, "favorites", docId);
    await updateDoc(favRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erro ao atualizar filme favorito:", error);
    throw error;
  }
};

/** 
 * Funções de Perfil do Usuário 
 */

export const createOrUpdateUserDoc = async (
  userId: string,
  data: Partial<UserProfile>
) => {
  try {
    await setDoc(
      doc(db, "users", userId),
      {
        ...data,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Erro ao criar/atualizar usuário:", error);
    throw error;
  }
};

export const getUserProfile = async (
  userId: string
): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Erro ao buscar perfil do usuário:", error);
    throw error;
  }
};

export const getReviewsByUser = async (
  userId: string
): Promise<Review[]> => {
  try {
    const q = query(collection(db, "reviews"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const userReviews: Review[] = [];
    querySnapshot.forEach((docSnap) => {
      userReviews.push({ id: docSnap.id, ...docSnap.data() } as Review);
    });
    return userReviews;
  } catch (error) {
    console.error("Erro ao buscar reviews do usuário:", error);
    throw error;
  }
};


export const getFriendsLastReviews = async (
  friendIds: string[]
): Promise<Review[]> => {
  if (!friendIds || friendIds.length === 0) return [];
  try {
    const q = query(
      collection(db, "reviews"),
      where("userId", "in", friendIds.slice(0, 10)),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const querySnapshot = await getDocs(q);
    const friendReviews: Review[] = [];
    querySnapshot.forEach((docSnap) => {
      friendReviews.push({ id: docSnap.id, ...docSnap.data() } as Review);
    });
    return friendReviews;
  } catch (error) {
    console.error("Erro ao buscar últimas reviews dos amigos:", error);
    throw error;
  }
  
};
