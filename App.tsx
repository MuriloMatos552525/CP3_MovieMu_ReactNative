import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { 
  createStackNavigator, 
  CardStyleInterpolators, 
  TransitionSpecs 
} from '@react-navigation/stack';

// --- IMPORTAÇÃO DAS TELAS ---

// Autenticação
import LoginScreen from './src/telas/LoginScreen';
import CadastroScreen from './src/telas/CadastroScreen';

// Navegador Principal (Barra de Abas)
import MainTabNavigator from './src/navigation/MainTabNavigator';

// Telas Secundárias
import PesquisaScreen from './src/telas/PesquisaScreen';
import DetalhesScreen from './src/telas/DetalhesScreen';
import FavoritosScreen from './src/telas/FavoritosScreen';
import DesenvolvedoresScreen from './src/telas/DesenvolvedoresScreen';
import ReviewScreen from './src/telas/ReviewScreen';

// --- TELAS DE SOCIAL E LISTAS ---
import SharedListsScreen from './src/telas/SharedListsScreen';
import CreateSharedListScreen from './src/telas/CreateSharedListScreen';
import SharedListDetailScreen from './src/telas/SharedListDetailScreen';
import FriendsScreen from './src/telas/FriendsScreen';
import ReviewsHistoryScreen from './src/telas/ReviewsHistoryScreen'; // <--- NOVA IMPORTAÇÃO

// --- TIPAGEM DAS ROTAS ---
export type RootStackParamList = {
  // Fluxo de Auth
  Login: undefined;
  Cadastro: undefined;
  
  // Fluxo Principal
  MainTab: undefined; 
  
  // Telas Avulsas
  Pesquisa: undefined;
  Detalhes: { movieId: number };
  Favoritos: undefined;
  Desenvolvedores: undefined;
  Review: { movieId: number; movieTitle?: string; moviePoster?: string };
  
  // Novas Rotas Sociais
  SharedLists: undefined;
  CreateSharedList: undefined;
  SharedListDetail: { listId: string; listName: string };
  Friends: undefined;
  ReviewsHistory: undefined; // <--- NOVA ROTA ADICIONADA
};

const Stack = createStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <NavigationContainer>
      {/* StatusBar clara para contrastar com o fundo preto absoluto */}
      <StatusBar style="light" backgroundColor="#000" />
      
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          // 1. Removemos o header nativo globalmente (controle total do design)
          headerShown: false,
          
          // 2. Fundo preto para evitar flashes brancos na transição (Visual Premium)
          cardStyle: { backgroundColor: '#000' },
          
          // 3. Gestos nativos do iOS/Android
          gestureEnabled: true,
          gestureDirection: 'horizontal',

          // 4. Física de Transição (Mola/Spring estilo iOS)
          transitionSpec: {
            open: TransitionSpecs.TransitionIOSSpec,
            close: TransitionSpecs.TransitionIOSSpec,
          },

          // 5. Animação de Slide Lateral (Padrão de Apps de Streaming)
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
      >
        {/* --- GRUPO 1: AUTENTICAÇÃO --- */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Cadastro" component={CadastroScreen} />

        {/* --- GRUPO 2: NAVEGAÇÃO PRINCIPAL (ABAS) --- */}
        <Stack.Screen name="MainTab" component={MainTabNavigator} />
        
        {/* --- GRUPO 3: TELAS MODAIS E DETALHES --- */}
        
        {/* Pesquisa: Fade suave (Melhor para buscas) */}
        <Stack.Screen 
          name="Pesquisa" 
          component={PesquisaScreen}
          options={{
            cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
          }}
        />
        
        {/* Detalhes do Filme */}
        <Stack.Screen name="Detalhes" component={DetalhesScreen} />
        
        {/* --- ROTAS DE SOCIAL, LISTAS E HISTÓRICO --- */}
        
        {/* Listas */}
        <Stack.Screen name="SharedLists" component={SharedListsScreen} />
        <Stack.Screen name="SharedListDetail" component={SharedListDetailScreen} />
        
        {/* Criar Lista (Modal) */}
        <Stack.Screen 
          name="CreateSharedList" 
          component={CreateSharedListScreen}
          options={{ 
             presentation: 'modal',
             cardStyleInterpolator: CardStyleInterpolators.forModalPresentationIOS
          }}
        />
        
        {/* Amigos */}
        <Stack.Screen name="Friends" component={FriendsScreen} />

        {/* Histórico de Reviews (NOVO) */}
        <Stack.Screen name="ReviewsHistory" component={ReviewsHistoryScreen} />

        {/* Review - Avaliar Filme (Modal) */}
        <Stack.Screen 
          name="Review" 
          component={ReviewScreen}
          options={{ 
            presentation: 'modal', 
            cardStyleInterpolator: CardStyleInterpolators.forModalPresentationIOS 
          }}
        />

        {/* Telas Secundárias (Com Header Nativo Escuro para contraste) */}
        <Stack.Screen 
          name="Favoritos" 
          component={FavoritosScreen}
          options={{ 
            headerShown: true, 
            title: 'Meus Favoritos', 
            headerStyle: { backgroundColor: '#000', borderBottomColor: '#333', borderBottomWidth: 1 }, 
            headerTintColor: '#fff' 
          }} 
        />
        
        <Stack.Screen 
          name="Desenvolvedores" 
          component={DesenvolvedoresScreen}
          options={{ 
            headerShown: true, 
            title: 'Sobre', 
            headerStyle: { backgroundColor: '#000', borderBottomColor: '#333', borderBottomWidth: 1 }, 
            headerTintColor: '#fff' 
          }}
        />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;