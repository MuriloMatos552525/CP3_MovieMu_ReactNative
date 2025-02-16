import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert } from "react-native";
import { getReviewsByMovie, addReview, updateReview, deleteReview } from "../services/firebaseActions";
import { auth } from "../services/firebaseConfig";
import { StackScreenProps } from "@react-navigation/stack";

type ReviewScreenProps = StackScreenProps<{ Review: { movieId: number } }, "Review">;

export interface Review {
  id: string;
  movieId: number;
  userId: string;
  rating: number;
  comment: string;
  createdAt?: any;
  updatedAt?: any;
}

const ReviewScreen: React.FC<ReviewScreenProps> = ({ route }) => {
  const { movieId } = route.params;
  const user = auth.currentUser;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    try {
      const data = await getReviewsByMovie(movieId);
      setReviews(data);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar as avaliações.");
    }
  }, [movieId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleAddOrUpdateReview = async () => {
    if (!user) {
      Alert.alert("Erro", "Você precisa estar logado para avaliar.");
      return;
    }
    if (!rating || !comment) {
      Alert.alert("Atenção", "Por favor, preencha todos os campos.");
      return;
    }
    try {
      if (editingReviewId) {
        await updateReview(editingReviewId, Number(rating), comment);
        Alert.alert("Sucesso", "Avaliação atualizada.");
      } else {
        await addReview(movieId, user.uid, Number(rating), comment);
        Alert.alert("Sucesso", "Avaliação adicionada.");
      }
      setRating("");
      setComment("");
      setEditingReviewId(null);
      loadReviews();
    } catch (error) {
      Alert.alert("Erro", "Ocorreu um erro ao salvar a avaliação.");
    }
  };

  const handleEditReview = (review: Review) => {
    setEditingReviewId(review.id);
    setRating(review.rating.toString());
    setComment(review.comment);
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await deleteReview(reviewId);
      Alert.alert("Sucesso", "Avaliação deletada.");
      loadReviews();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível deletar a avaliação.");
    }
  };

  const renderReviewItem = useCallback(({ item }: { item: Review }) => (
    <View style={styles.reviewItem}>
      <Text style={styles.reviewUser}>Usuário: {item.userId}</Text>
      <Text style={styles.reviewRating}>Nota: {item.rating}</Text>
      <Text style={styles.reviewComment}>Comentário: {item.comment}</Text>
      {item.userId === user?.uid && (
        <View style={styles.reviewButtons}>
          <Button title="Editar" onPress={() => handleEditReview(item)} />
          <Button title="Excluir" onPress={() => handleDeleteReview(item.id)} />
        </View>
      )}
    </View>
  ), [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Avaliações do Filme</Text>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={renderReviewItem}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma avaliação ainda.</Text>}
      />
      <View style={styles.form}>
        <Text style={styles.formTitle}>
          {editingReviewId ? "Editar Avaliação" : "Adicionar Avaliação"}
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Nota (1 a 5)"
          keyboardType="numeric"
          value={rating}
          onChangeText={setRating}
        />
        <TextInput
          style={[styles.input, styles.commentInput]}
          placeholder="Comentário"
          value={comment}
          onChangeText={setComment}
          multiline
        />
        <Button
          title={editingReviewId ? "Atualizar Avaliação" : "Enviar Avaliação"}
          onPress={handleAddOrUpdateReview}
        />
        {editingReviewId && (
          <Button
            title="Cancelar"
            onPress={() => {
              setEditingReviewId(null);
              setRating("");
              setComment("");
            }}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  reviewItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  reviewUser: { fontWeight: 'bold' },
  reviewRating: {},
  reviewComment: { marginVertical: 4 },
  reviewButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  emptyText: { textAlign: 'center', marginVertical: 16 },
  form: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingTop: 16,
  },
  formTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
  },
  commentInput: { height: 80 },
});

export default ReviewScreen;
