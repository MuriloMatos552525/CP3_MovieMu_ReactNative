// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Importação das telas
import LoginScreen from './src/telas/LoginScreen';
import CadastroScreen from './src/telas/CadastroScreen';
import TelaInicial from './src/telas/TelaInicial';
import PesquisaScreen from './src/telas/PesquisaScreen';
import DetalhesScreen from './src/telas/DetalhesScreen';
import FavoritosScreen from './src/telas/FavoritosScreen';
import DesenvolvedoresScreen from './src/telas/DesenvolvedoresScreen';
import ReviewScreen from './src/telas/ReviewScreen';
import SharedListsScreen from './src/telas/SharedListsScreen';
import CreateSharedListScreen from './src/telas/CreateSharedListScreen';
import SharedListDetailScreen from './src/telas/SharedListDetailScreen';

// Importação da sua nova tela de Perfil
import PerfilScreen from './src/telas/PerfilScreen';

// Definindo os tipos para as rotas
export type RootStackParamList = {
  Login: undefined;
  Cadastro: undefined;
  TelaInicial: undefined;
  Pesquisa: undefined;
  Detalhes: { movieId: number };
  Favoritos: undefined;
  Desenvolvedores: undefined;
  Review: { movieId: number };
  SharedLists: undefined;
  CreateSharedList: undefined;
  SharedListDetail: { listId: string; listName: string };
  Perfil: undefined; // <= Adicione esta rota para o Perfil
};

const Stack = createStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* Tela de login sem cabeçalho */}
        <Stack.Screen 
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Cadastro"
          component={CadastroScreen}
          options={{ title: 'Cadastro' }}
        />
        <Stack.Screen 
          name="TelaInicial"
          component={TelaInicial}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Pesquisa"
          component={PesquisaScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Detalhes"
          component={DetalhesScreen}
          options={{ title: 'Detalhes do Filme' }}
        />
        <Stack.Screen 
          name="Favoritos"
          component={FavoritosScreen}
          options={{ title: 'Filmes Favoritos' }}
        />
        <Stack.Screen 
          name="Desenvolvedores"
          component={DesenvolvedoresScreen}
          options={{ title: 'Desenvolvedores' }}
        />
        {/* Novos fluxos */}
        <Stack.Screen 
          name="Review"
          component={ReviewScreen}
          options={{ title: 'Avaliações' }}
        />
        <Stack.Screen 
          name="SharedLists"
          component={SharedListsScreen}
          options={{ title: 'Listas Compartilhadas' }}
        />
        <Stack.Screen 
          name="CreateSharedList"
          component={CreateSharedListScreen}
          options={{ title: 'Criar Lista Compartilhada' }}
        />
        <Stack.Screen 
          name="SharedListDetail"
          component={SharedListDetailScreen}
          options={{ title: 'Detalhes da Lista' }}
        />

        {/* Rota para a Tela de Perfil */}
        <Stack.Screen
          name="Perfil"
          component={PerfilScreen}
          options={{ title: 'Meu Perfil' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
