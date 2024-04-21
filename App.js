import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import TelaInicial from './src/telas/TelaInicial';
import PesquisaScreen from './src/telas/PesquisaScreen';
import DetalhesScreen from './src/telas/DetalhesScreen';
import FavoritosScreen from './src/telas/FavoritosScreen';
import DesenvolvedoresScreen from './src/telas/DesenvolvedoresScreen'; // Importe DesenvolvedoresScreen


const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
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
          component={DesenvolvedoresScreen} // Adicione DesenvolvedoresScreen como o componente para a tela de detalhes dos desenvolvedores
          options={{ title: 'Desenvolvedores' }} // Opcional: defina um título para a tela de detalhes dos desenvolvedores
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
