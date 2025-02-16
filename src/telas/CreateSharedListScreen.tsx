import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
} from "react-native";
import { createSharedList } from "../services/firebaseActions";
import { auth } from "../services/firebaseConfig"; // Usando a instância do nosso arquivo
import { StackScreenProps } from "@react-navigation/stack";

type Props = StackScreenProps<{ CreateSharedList: {} }, "CreateSharedList">;

const CreateSharedListScreen: React.FC<Props> = ({ navigation }) => {
  const user = auth.currentUser;
  const [listName, setListName] = useState<string>("");
  const [allowOthersToAdd, setAllowOthersToAdd] = useState<boolean>(false);

  const handleCreateList = async () => {
    if (!listName) {
      Alert.alert("Atenção", "Digite um nome para a lista.");
      return;
    }
    if (!user) {
      Alert.alert("Erro", "Você precisa estar logado.");
      return;
    }
    try {
      const listId = await createSharedList(user.uid, listName, allowOthersToAdd);
      Alert.alert("Sucesso", "Lista criada com sucesso.");
      navigation.navigate("SharedListDetail", { listId, listName });
    } catch (error) {
      Alert.alert("Erro", "Não foi possível criar a lista.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar Nova Lista Compartilhada</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome da lista"
        value={listName}
        onChangeText={setListName}
      />
      <View style={styles.checkboxContainer}>
        <Text>Permitir que outros adicionem filmes?</Text>
        <Button
          title={allowOthersToAdd ? "Sim" : "Não"}
          onPress={() => setAllowOthersToAdd(!allowOthersToAdd)}
        />
      </View>
      <Button title="Criar Lista" onPress={handleCreateList} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    justifyContent: "space-between",
  },
});

export default CreateSharedListScreen;
