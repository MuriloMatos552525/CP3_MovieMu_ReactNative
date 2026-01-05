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
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { db, auth } from "./firebaseConfig";

/** ==========================================
 * DATA TYPES (INTERFACES)
 * ==========================================
 */

// Reviews
export interface Review {
  id: string;
  movieId: number;
  userId: string;
  userName?: string; // Snapshot for display
  userPhoto?: string | null; // Snapshot for display
  rating: number;
  comment: string;
  createdAt?: any;
  updatedAt?: any;
}

// Shared Lists
export interface SharedList {
  id: string;
  creatorId: string;
  listName: string;
  isShared: boolean; // True = Public/Shared via Link, False = Private
  allowOthersToAdd: boolean;
  participants: string[];
  createdAt?: any;
}

// Movies in Shared Lists
export interface SharedMovie {
  id: string; 
  tmdbId?: number;
  title: string;
  poster_path?: string;
  addedBy: string;
  addedAt?: any;
  watched?: boolean;
  watchedAt?: any;
  isMatch?: boolean; // New field to identify Match
}

// Full User Profile
export interface UserProfile {
  uid: string;
  email: string;
  username: string;     // Ex: @joaosilva (Unique)
  fullName: string;     // Ex: João Silva
  displayName?: string; // Compatibility with Auth
  photoURL?: string;
  bio?: string;
  friends?: string[];
  top5?: {
    [pos: number]: {
      id: number;
      title: string;
      poster_path?: string;
    };
  };
  lastUsernameChange?: any;
  createdAt?: any;
  updatedAt?: any;
}

// --- NEW: Match Interfaces ---
export interface MatchSession {
  id: string;
  listId: string;
  isActive: boolean;
  filters?: {
    genreId?: string;
  };
  createdBy: string;
  createdAt?: any;
}

/** ==========================================
 * USER MANAGEMENT (AUTH & PROFILE)
 * ==========================================
 */

// 1. Check if username exists (for registration/update)
export const checkUsernameExists = async (username: string): Promise<boolean> => {
  try {
    const normalized = username.toLowerCase().trim();
    const q = query(collection(db, "users"), where("username", "==", normalized));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error("Error verifying username:", error);
    throw error;
  }
};

// 2. Create User in Firestore (post-Auth registration)
export const createUserInFirestore = async (uid: string, data: {
  email: string;
  username: string;
  fullName: string;
}) => {
  try {
    await setDoc(doc(db, "users", uid), {
      uid,
      email: data.email,
      username: data.username.toLowerCase().trim(),
      fullName: data.fullName,
      displayName: data.fullName,
      photoURL: null,
      bio: "Novo no MovieMu",
      friends: [], 
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error saving user:", error);
    throw error;
  }
};

// 3. Get Full Profile
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw error;
  }
};

// 4. Update Profile (Bio, Photo, Name)
export const createOrUpdateUserDoc = async (userId: string, data: Partial<UserProfile>) => {
  try {
    await setDoc(doc(db, "users", userId), {
        ...data,
        updatedAt: serverTimestamp(),
      }, { merge: true }
    );
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

/** ==========================================
 * FRIEND SYSTEM (REQUESTS & ACCEPTANCE)
 * ==========================================
 */

// 1. Search user by USERNAME (@username)
export const searchUserByUsername = async (queryText: string) => {
  try {
    const term = queryText.toLowerCase().trim();
    const usersRef = collection(db, "users");
    // Exact match for username
    const q = query(usersRef, where("username", "==", term));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return null;
    
    const userDoc = querySnapshot.docs[0];
    return { uid: userDoc.id, ...userDoc.data() };
  } catch (error) {
    console.error("Error searching user by username:", error);
    throw error;
  }
};

// 1b. Search user by EMAIL (Alternative)
export const searchUserByEmail = async (email: string) => {
  try {
    const term = email.toLowerCase().trim();
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", term));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return null;
    
    const userDoc = querySnapshot.docs[0];
    return { uid: userDoc.id, ...userDoc.data() };
  } catch (error) {
    console.error("Error searching by email:", error);
    throw error;
  }
};

// 2. Send Friend Request
export const sendFriendRequest = async (currentUserId: string, currentUserData: any, friendId: string, friendData: any) => {
  try {
    // Save to FRIEND's collection as "received"
    await setDoc(doc(db, "users", friendId, "friendRequests", currentUserId), {
      uid: currentUserId,
      displayName: currentUserData.fullName || currentUserData.displayName,
      username: currentUserData.username,
      photoURL: currentUserData.photoURL || null,
      status: 'received',
      timestamp: serverTimestamp()
    });

    // Save to MY collection as "sent"
    await setDoc(doc(db, "users", currentUserId, "friendRequests", friendId), {
      uid: friendId,
      displayName: friendData.fullName || friendData.displayName,
      username: friendData.username,
      photoURL: friendData.photoURL || null,
      status: 'sent',
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Error sending friend request:", error);
    throw error;
  }
};

// 3. Accept Friend Request
export const acceptFriendRequest = async (currentUserId: string, currentUserData: any, friendId: string, friendData: any) => {
  try {
    // Add to BOTH friends lists (Subcollection)
    // 3a. Add Him to My Friends
    await setDoc(doc(db, "users", currentUserId, "friends", friendId), {
      uid: friendId,
      displayName: friendData.displayName || friendData.fullName || "User",
      username: friendData.username,
      photoURL: friendData.photoURL || null,
      addedAt: serverTimestamp()
    });

    // 3b. Add Me to His Friends
    await setDoc(doc(db, "users", friendId, "friends", currentUserId), {
      uid: currentUserId,
      displayName: currentUserData.displayName || currentUserData.fullName || "User",
      username: currentUserData.username,
      photoURL: currentUserData.photoURL || null,
      addedAt: serverTimestamp()
    });

    // Remove requests
    await deleteDoc(doc(db, "users", currentUserId, "friendRequests", friendId));
    await deleteDoc(doc(db, "users", friendId, "friendRequests", currentUserId));
  } catch (error) {
    console.error("Error accepting friend request:", error);
    throw error;
  }
};

// 4. Reject/Cancel Request
export const rejectFriendRequest = async (currentUserId: string, friendId: string) => {
  try {
    await deleteDoc(doc(db, "users", currentUserId, "friendRequests", friendId));
    await deleteDoc(doc(db, "users", friendId, "friendRequests", currentUserId));
  } catch (error) {
    console.error("Error rejecting request:", error);
    throw error;
  }
};

// 5. Get Friend Requests (Received)
export const getFriendRequests = async (userId: string) => {
  try {
    const q = query(
        collection(db, "users", userId, "friendRequests"),
        where("status", "==", "received")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    throw error;
  }
};

// 6. List My Friends
export const getMyFriends = async (userId: string) => {
  try {
    const q = collection(db, "users", userId, "friends");
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error("Error fetching friends:", error);
    throw error;
  }
};

// 7. Remove Friend
export const removeFriend = async (currentUserId: string, friendId: string) => {
  try {
    await deleteDoc(doc(db, "users", currentUserId, "friends", friendId));
  } catch (error) {
    console.error("Error removing friend:", error);
    throw error;
  }
};

// Legacy function to add directly (for internal use or debug)
export const addFriend = async (currentUserId: string, friendId: string, friendData: any) => {
  try {
    await setDoc(doc(db, "users", currentUserId, "friends", friendId), {
      uid: friendId,
      displayName: friendData.displayName || friendData.fullName || "User",
      username: friendData.username,
      photoURL: friendData.photoURL || null,
      addedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error addFriend:", error);
    throw error;
  }
};

/** ==========================================
 * SHARED & PRIVATE LISTS
 * ==========================================
 */

// 1. Create List
export const createSharedList = async (
  creatorId: string,
  listName: string,
  isShared: boolean = true 
): Promise<string> => {
  try {
    const listRef = await addDoc(collection(db, "sharedLists"), {
      creatorId,
      listName,
      isShared, 
      allowOthersToAdd: isShared, 
      participants: [creatorId],
      createdAt: serverTimestamp(),
    });
    return listRef.id;
  } catch (error) {
    console.error("Error creating list:", error);
    throw error;
  }
};

// 2. Get User Lists (Participant or Creator)
export const getSharedListsByUser = async (userId: string): Promise<SharedList[]> => {
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
    console.error("Error fetching lists:", error);
    throw error;
  }
};

// 3. Join List (by Code/ID)
export const joinSharedList = async (listId: string, userId: string) => {
  try {
    const listRef = doc(db, 'sharedLists', listId);
    
    // Check if exists
    const listSnap = await getDoc(listRef);
    if (!listSnap.exists()) {
      throw new Error("List not found.");
    }
    
    // Add to participants array (without duplication)
    await updateDoc(listRef, {
        participants: arrayUnion(userId)
    });
  } catch (error) {
    console.error("Error joining list:", error);
    throw error;
  }
};

// 3b. Add Multiple Friends to List (New Feature)
export const addFriendsToSharedList = async (listId: string, friendIds: string[]) => {
  try {
    if (!friendIds.length) return;
    const listRef = doc(db, 'sharedLists', listId);
    
    await updateDoc(listRef, {
      participants: arrayUnion(...friendIds)
    });
  } catch (error) {
    console.error("Error adding friends to list:", error);
    throw error;
  }
};

// 4. Add Movie to List
export const addMovieToSharedList = async (
  listId: string,
  userId: string,
  movie: { title: string; poster_path?: string; tmdbId?: number; isMatch?: boolean }
): Promise<string> => {
  try {
    const listRef = doc(db, "sharedLists", listId);
    const listSnap = await getDoc(listRef);
    if (!listSnap.exists()) throw new Error("List does not exist.");
    
    const listData = listSnap.data() as SharedList;
    
    // Permission: Creator OR (Allowed && Participant) OR (If Automatic Match)
    const isParticipant = listData.participants.includes(userId);
    
    if (
      userId === listData.creatorId ||
      (listData.allowOthersToAdd && isParticipant) || 
      movie.isMatch // If it's a match, allow adding
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
      throw new Error("No permission to add movies.");
    }
  } catch (error) {
    console.error("Error adding movie:", error);
    throw error;
  }
};

// 5. Get Movies from List
export const getMoviesFromSharedList = async (listId: string): Promise<SharedMovie[]> => {
  try {
    const listRef = doc(db, "sharedLists", listId);
    const moviesCollectionRef = collection(listRef, "movies");
    const querySnapshot = await getDocs(moviesCollectionRef);
    const movies: SharedMovie[] = [];
    querySnapshot.forEach((docSnap) => {
      movies.push({ id: docSnap.id, ...docSnap.data() } as SharedMovie);
    });
    return movies;
  } catch (error) {
    console.error("Error fetching movies from list:", error);
    throw error;
  }
};

// 6. Remove Movie
export const removeMovieFromSharedList = async (listId: string, movieId: string): Promise<void> => {
  try {
    const moviesCollectionRef = collection(db, "sharedLists", listId, "movies");
    const movieDocRef = doc(moviesCollectionRef, movieId);
    await deleteDoc(movieDocRef);
  } catch (error) {
    console.error("Error removing movie:", error);
    throw error;
  }
};

// 7. Mark as Watched
export const markMovieAsWatchedInSharedList = async (listId: string, movieId: string): Promise<void> => {
  try {
    const moviesCollectionRef = collection(db, "sharedLists", listId, "movies");
    const movieDocRef = doc(moviesCollectionRef, movieId);
    await updateDoc(movieDocRef, {
      watched: true,
      watchedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error marking as watched:", error);
    throw error;
  }
};

/** ==========================================
 * TOP 5 & FAVORITES
 * ==========================================
 */

export const setTop5Movie = async (userId: string, position: number, movie: any) => {
  try {
    // Saves inside a "top5" map in user doc: { 1: movie, 2: movie... }
    await setDoc(doc(db, "users", userId), {
      top5: {
        [position]: movie
      }
    }, { merge: true });
  } catch (error) {
    console.error("Error saving Top 5:", error);
    throw error;
  }
};

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
    console.error("Error adding favorite:", error);
    throw error;
  }
};

export const getFavoriteMovies = async (userId: string) => {
  try {
    const qFavs = query(collection(db, "favorites"), where("userId", "==", userId));
    const querySnapshot = await getDocs(qFavs);
    const movies: any[] = [];
    querySnapshot.forEach((docSnap) => {
      movies.push({ id: docSnap.id, ...docSnap.data() });
    });
    return movies;
  } catch (error) {
    console.error("Error fetching favorites:", error);
    throw error;
  }
};

export const removeFavoriteMovie = async (docId: string) => {
  try {
    await deleteDoc(doc(db, "favorites", docId));
  } catch (error) {
    console.error("Error removing favorite:", error);
    throw error;
  }
};

/** ==========================================
 * REVIEWS (SOCIAL FEED)
 * ==========================================
 */

export const addReview = async (movieId: number, userId: string, rating: number, comment: string): Promise<string> => {
  try {
    // 1. Get current user data to snapshot name/photo
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    const userData = userSnap.exists() ? userSnap.data() : {};
    
    const userName = userData.displayName || userData.fullName || "User";
    const userPhoto = userData.photoURL || null;

    // 2. Save review with user snapshot
    const reviewRef = await addDoc(collection(db, "reviews"), {
      movieId,
      userId,
      userName, 
      userPhoto, 
      rating,
      comment,
      createdAt: serverTimestamp(),
    });
    return reviewRef.id;
  } catch (error) {
    console.error("Error adding review:", error);
    throw error;
  }
};

export const getReviewsByMovie = async (movieId: number): Promise<Review[]> => {
  try {
    const qReviews = query(collection(db, "reviews"), where("movieId", "==", movieId));
    const querySnapshot = await getDocs(qReviews);
    const reviews: Review[] = [];
    querySnapshot.forEach((docSnap) => {
      reviews.push({ id: docSnap.id, ...docSnap.data() } as Review);
    });
    return reviews;
  } catch (error) {
    console.error("Error fetching reviews:", error);
    throw error;
  }
};

export const getReviewsByUser = async (userId: string): Promise<Review[]> => {
  try {
    const q = query(collection(db, "reviews"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const userReviews: Review[] = [];
    querySnapshot.forEach((docSnap) => {
      userReviews.push({ id: docSnap.id, ...docSnap.data() } as Review);
    });
    return userReviews;
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    throw error;
  }
};

export const deleteReview = async (reviewId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "reviews", reviewId));
  } catch (error) {
    console.error("Error deleting review:", error);
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
    console.error("Error updating review:", error);
    throw error;
  }
};

export const getFriendsLastReviews = async (friendIds: string[]): Promise<Review[]> => {
  if (!friendIds || friendIds.length === 0) return [];
  try {
    // Firestore limits 'in' operator to 10 values per query
    // For MVP, we take the first 10. For production, you'd need multiple queries or a feed system.
    const q = query(
      collection(db, "reviews"),
      where("userId", "in", friendIds.slice(0, 10))
    );
    const querySnapshot = await getDocs(q);
    const friendReviews: Review[] = [];
    querySnapshot.forEach((docSnap) => {
      friendReviews.push({ id: docSnap.id, ...docSnap.data() } as Review);
    });

    // Ordenação no Cliente (para evitar erros de índice composto no início)
    return friendReviews.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA; // Mais recente primeiro
    });

  } catch (error) {
    console.error("Error fetching friend reviews:", error);
    return []; // Returns empty to avoid breaking screen
  }
};

/** ==========================================
 * MATCH SYSTEM (LOGIC)
 * ==========================================
 */

// 1. Create or Retrieve Match Session
export const getOrCreateMatchSession = async (listId: string, genreId?: string) => {
  try {
    // Check if there is already an active session for this list
    const q = query(
        collection(db, "sharedLists", listId, "matchSessions"),
        where("isActive", "==", true),
        limit(1)
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
        const docSnap = snap.docs[0];
        return { id: docSnap.id, ...docSnap.data() } as MatchSession;
    }

    // If not, create a new one
    const newSessionRef = await addDoc(collection(db, "sharedLists", listId, "matchSessions"), {
        listId,
        isActive: true,
        filters: genreId ? { genreId } : {},
        createdBy: auth.currentUser?.uid,
        createdAt: serverTimestamp()
    });

    return { id: newSessionRef.id, listId, isActive: true, filters: genreId ? { genreId } : {} };

  } catch (error) {
    console.error("Error managing match session:", error);
    throw error;
  }
};

// 2. Vote on Movie (Swipe) + Check Match
export const voteMovie = async (
    listId: string, 
    sessionId: string, 
    movie: any, 
    direction: 'left' | 'right'
) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
        // A. Save vote in 'swipes' subcollection
        // Use composite ID (movieId_userId) to avoid duplicate votes
        const voteId = `${movie.id}_${userId}`;
        const swipeRef = doc(db, "sharedLists", listId, "matchSessions", sessionId, "swipes", voteId);
        
        await setDoc(swipeRef, {
            movieId: movie.id,
            userId: userId,
            direction: direction,
            title: movie.title, // Backup info
            poster_path: movie.poster_path, // Backup info
            timestamp: serverTimestamp()
        });

        // B. If LIKE ('right'), check for Match
        if (direction === 'right') {
            await checkAndProcessMatch(listId, sessionId, movie);
        }

    } catch (error) {
        console.error("Error voting:", error);
    }
};

// 3. Internal Match Checking Logic
const checkAndProcessMatch = async (listId: string, sessionId: string, movie: any) => {
    try {
        // 1. How many participants in the list?
        const listRef = doc(db, "sharedLists", listId);
        const listSnap = await getDoc(listRef);
        if (!listSnap.exists()) return;
        
        const participants = listSnap.data().participants || [];
        const totalParticipants = participants.length;

        // 2. How many likes for this movie IN THIS SESSION?
        const swipesRef = collection(db, "sharedLists", listId, "matchSessions", sessionId, "swipes");
        const qLikes = query(
            swipesRef, 
            where("movieId", "==", movie.id),
            where("direction", "==", "right")
        );
        const likesSnap = await getDocs(qLikes);
        const totalLikes = likesSnap.size;

        // 3. If Likes >= Participants -> IT'S A MATCH!
        if (totalLikes >= totalParticipants) {
            console.log(`IT'S A MATCH! Movie: ${movie.title}`);
            
            // Automatically add movie to main list with highlight
            await addMovieToSharedList(listId, "SYSTEM_MATCH", {
                title: movie.title,
                poster_path: movie.poster_path,
                tmdbId: movie.id,
                isMatch: true // Special flag
            });

            // (Optional) We could notify users here via Cloud Functions
        }

    } catch (error) {
        console.error("Error checking match:", error);
    }
};

// 4. Get Swiped Movies (to avoid showing again)
export const getSwipedMovieIds = async (listId: string, sessionId: string) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return [];

    try {
        const swipesRef = collection(db, "sharedLists", listId, "matchSessions", sessionId, "swipes");
        const q = query(swipesRef, where("userId", "==", userId));
        const snap = await getDocs(q);
        
        return snap.docs.map(doc => doc.data().movieId);
    } catch (error) {
        return [];
    }
};

/** ==========================================
 * MISSING FUNCTIONS (FROM SHARED LISTS SCREEN)
 * ==========================================
 */

// 1. Sair de uma lista (Remover meu ID dos participantes)
export const leaveSharedList = async (listId: string, userId: string) => {
  try {
    const listRef = doc(db, "sharedLists", listId);
    await updateDoc(listRef, {
      participants: arrayRemove(userId)
    });
  } catch (error) {
    console.error("Error leaving list:", error);
    throw error;
  }
};

// 2. Deletar a lista inteira (Apenas criador)
export const deleteSharedList = async (listId: string) => {
  try {
    // Note: In Firebase, deleting a document does not delete subcollections automatically.
    // Ideally, a Cloud Function should clean up. For MVP, we delete the reference.
    await deleteDoc(doc(db, "sharedLists", listId));
  } catch (error) {
    console.error("Error deleting list:", error);
    throw error;
  }
};

// 3. Find or Create One-on-One List (Avoid Duplicates)
export const findOrCreateOneOnOneList = async (currentUserId: string, friendId: string, friendName: string, myName: string) => {
  try {
    // A. Fetch all my lists
    const myLists = await getSharedListsByUser(currentUserId);

    // B. Filter locally to find a list with ONLY me and the friend
    const existingList = myLists.find(list => 
      list.participants.length === 2 && 
      list.participants.includes(friendId)
    );

    if (existingList) {
      console.log("Existing list found:", existingList.id);
      return existingList.id;
    }

    // C. If not found, create new
    const listName = `Match: ${myName.split(' ')[0]} & ${friendName.split(' ')[0]}`;
    console.log("Creating new list:", listName);
    
    const newListId = await createSharedList(currentUserId, listName, true);
    
    // Add friend immediately
    await addFriendsToSharedList(newListId, [friendId]);
    
    return newListId;

  } catch (error) {
    console.error("Error managing 1x1 list:", error);
    throw error;
  }
};