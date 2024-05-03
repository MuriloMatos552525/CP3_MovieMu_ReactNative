import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import TelaInicial from './src/telas/TelaInicial';
import PesquisaScreen from './src/telas/PesquisaScreen';
import DetalhesScreen from './src/telas/DetalhesScreen';
import FavoritosScreen from './src/telas/FavoritosScreen';
import DesenvolvedoresScreen from './src/telas/DesenvolvedoresScreen';
import CadastroScreen from './src/telas/CadastroScreen';
import LoginScreen from './src/telas/LoginScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Login"
          component={LoginScreen}
          options={{ title: 'Login', headerShown: false }} // Remova o cabeçalho da tela de login
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
        <Stack.Screen 
          name="Cadastro"
          component={CadastroScreen}
          options={{ title: 'Cadastro' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
