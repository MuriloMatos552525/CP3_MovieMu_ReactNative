import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { addReview, updateReview } from '../services/firebaseActions';
import { auth } from '../services/firebaseConfig';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';

type Props = StackScreenProps<RootStackParamList, 'Review'>;

const ReviewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { movieId, movieTitle, moviePoster } = route.params; // Recebemos dados para exibir bonito
  const user = auth.currentUser;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  // Aqui você poderia buscar se o usuário JÁ avaliou para editar
  // Por enquanto, vamos focar no fluxo de "Adicionar"

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("Erro", "Você precisa estar logado.");
      return;
    }
    if (rating === 0) {
      Alert.alert("Atenção", "Toque nas estrelas para dar uma nota.");
      return;
    }

    setLoading(true);
    try {
      // Como não estamos gerenciando edição aqui (pode ser futuro), usamos addReview
      await addReview(movieId, user.uid, rating, comment);
      
      Alert.alert("Sucesso!", "Sua avaliação foi salva.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar.");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity 
            key={star} 
            onPress={() => setRating(star)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={star <= rating ? "star" : "star-outline"} 
              size={40} 
              color={star <= rating ? "#FFD700" : "#666"} 
              style={styles.starIcon}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <LinearGradient
            colors={['#1c1c1e', '#000000']}
            style={styles.background}
        >
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.content}
            >
                {/* Header Modal */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.cancelText}>Cancelar</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Avaliar Filme</Text>
                    <TouchableOpacity onPress={handleSubmit} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#FF512F" />
                        ) : (
                            <Text style={styles.submitText}>Publicar</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Info do Filme */}
                <View style={styles.movieInfo}>
                    {moviePoster ? (
                        <Image 
                            source={{ uri: `https://image.tmdb.org/t/p/w154${moviePoster}` }} 
                            style={styles.poster} 
                        />
                    ) : (
                        <View style={[styles.poster, {backgroundColor:'#333'}]} />
                    )}
                    <Text style={styles.movieTitle}>{movieTitle || "Filme Desconhecido"}</Text>
                    <Text style={styles.subText}>Toque para classificar</Text>
                </View>

                {/* Estrelas */}
                {renderStars()}

                {/* Campo de Texto */}
                <View style={styles.inputContainer}>
                    <TextInput 
                        style={styles.input}
                        placeholder="Escreva sua opinião (opcional)..."
                        placeholderTextColor="#666"
                        multiline
                        maxLength={500}
                        value={comment}
                        onChangeText={setComment}
                    />
                    <Text style={styles.charCount}>{comment.length}/500</Text>
                </View>

            </KeyboardAvoidingView>
        </LinearGradient>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  background: { flex: 1 },
  content: { flex: 1 },

  header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      padding: 20, paddingTop: Platform.OS === 'ios' ? 20 : 40,
      borderBottomWidth: 1, borderBottomColor: '#1c1c1e'
  },
  cancelText: { color: '#FF4444', fontSize: 16 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  submitText: { color: '#FF512F', fontSize: 16, fontWeight: 'bold' },

  movieInfo: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  poster: { 
      width: 100, height: 150, borderRadius: 8, marginBottom: 15,
      borderWidth: 1, borderColor: '#333'
  },
  movieTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center', maxWidth: '80%' },
  subText: { color: '#666', marginTop: 5, fontSize: 14 },

  starsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30 },
  starIcon: { marginHorizontal: 5 },

  inputContainer: {
      marginHorizontal: 20, backgroundColor: '#1c1c1e', borderRadius: 12, padding: 15,
      borderWidth: 1, borderColor: '#333'
  },
  input: { color: '#fff', fontSize: 16, height: 100, textAlignVertical: 'top' },
  charCount: { color: '#444', textAlign: 'right', fontSize: 12, marginTop: 5 },
});

export default ReviewScreen;