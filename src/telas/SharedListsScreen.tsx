import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Button,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { getSharedListsByUser, SharedList } from "../services/firebaseActions";
import { auth } from "../services/firebaseConfig";
import { StackScreenProps } from "@react-navigation/stack";

type Props = StackScreenProps<{ SharedLists: {} }, "SharedLists">;

const SharedListsScreen: React.FC<Props> = ({ navigation }) => {
  const user = auth.currentUser;
  const [sharedLists, setSharedLists] = useState<SharedList[]>([]);

  useEffect(() => {
    loadSharedLists();
  }, []);

  const loadSharedLists = async () => {
    if (!user) {
      Alert.alert("Erro", "Você precisa estar logado.");
      return;
    }
    try {
      const lists = await getSharedListsByUser(user.uid);
      setSharedLists(lists);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar as listas compartilhadas.");
    }
  };

  const renderListItem = ({ item }: { item: SharedList }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() =>
        navigation.navigate("SharedListDetail", {
          listId: item.id,
          listName: item.listName,
        })
      }
    >
      <Text style={styles.listName}>{item.listName}</Text>
      <Text style={styles.listCreator}>Criador: {item.creatorId}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Minhas Listas Compartilhadas</Text>
      <FlatList
        data={sharedLists}
        keyExtractor={(item) => item.id}
        renderItem={renderListItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhuma lista encontrada.</Text>
        }
      />
      <Button
        title="Criar Nova Lista"
        onPress={() => navigation.navigate("CreateSharedList")}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  listItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  listName: { fontSize: 18, fontWeight: "bold" },
  listCreator: { fontSize: 14, color: "#555" },
  emptyText: { textAlign: "center", marginTop: 20 },
});

export default SharedListsScreen;
