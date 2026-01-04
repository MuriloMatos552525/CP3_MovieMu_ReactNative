import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Import das Telas
import TelaInicial from '../telas/TelaInicial';
import SharedListsScreen from '../telas/SharedListsScreen';
import MatchScreen from '../telas/MatchScreen';
import PerfilScreen from '../telas/PerfilScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        
        // --- ESTILO DA BARRA (PÍLULA) ---
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 30 : 20,
          left: 20, 
          right: 20,
          height: 70, // Altura da Barra
          borderRadius: 35,
          
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          
          // O SEGREDO DO ALINHAMENTO:
          alignItems: 'center', // Centraliza verticalmente os botões na barra
          justifyContent: 'center',
          paddingBottom: 0, // Remove padding nativo
        },
        
        // --- ESTILO DO CONTAINER DO BOTÃO ---
        tabBarItemStyle: {
          // Removemos altura fixa aqui para deixar o alignItems da barra controlar
          padding: 0,
          margin: 0,
        },
        
        // Fundo Vidro/Dark
        tabBarBackground: () => (
            <View style={styles.glassContainer}>
                <LinearGradient
                    colors={['rgba(30, 30, 30, 0.95)', 'rgba(10, 10, 10, 0.98)']}
                    style={styles.backgroundGradient}
                />
            </View>
        ),
      }}
    >
      {/* 1. HOME */}
      <Tab.Screen 
        name="HomeTab" 
        component={TelaInicial} 
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[
              styles.tabItemContainer, 
              focused && styles.activeTabBackground
            ]}>
              <Ionicons 
                name={focused ? "home" : "home-outline"} 
                size={22} 
                color={focused ? "#fff" : "#999"} 
              />
              <Text style={[styles.tabLabel, { color: focused ? "#fff" : "#999" }]}>Home</Text>
            </View>
          )
        }}
      />

      {/* 2. LISTAS */}
      <Tab.Screen 
        name="ListsTab" 
        component={SharedListsScreen} 
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[
              styles.tabItemContainer, 
              focused && styles.activeTabBackground
            ]}>
              <Ionicons 
                name={focused ? "folder-open" : "folder-open-outline"} 
                size={22} 
                color={focused ? "#fff" : "#999"} 
              />
              <Text style={[styles.tabLabel, { color: focused ? "#fff" : "#999" }]}>Listas</Text>
            </View>
          )
        }}
      />

      {/* 3. MATCH */}
      <Tab.Screen 
        name="MatchTab" 
        component={MatchScreen} 
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[
              styles.tabItemContainer, 
              focused && styles.activeTabBackground
            ]}>
               <Ionicons 
                 name={focused ? "ticket" : "ticket-outline"} 
                 size={22} 
                 color={focused ? "#fff" : "#999"}
                 style={focused ? { transform: [{ rotate: '-15deg' }] } : {}}
               />
               <Text style={[styles.tabLabel, { color: focused ? "#fff" : "#999" }]}>Match</Text>
            </View>
          )
        }}
      />

      {/* 4. PERFIL */}
      <Tab.Screen 
        name="ProfileTab" 
        component={PerfilScreen} 
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[
              styles.tabItemContainer, 
              focused && styles.activeTabBackground
            ]}>
              <Ionicons 
                name={focused ? "person" : "person-outline"} 
                size={22} 
                color={focused ? "#fff" : "#999"} 
              />
              <Text style={[styles.tabLabel, { color: focused ? "#fff" : "#999" }]}>Perfil</Text>
            </View>
          )
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  // Fundo (Vidro)
  glassContainer: {
    flex: 1,
    borderRadius: 35,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  backgroundGradient: {
    flex: 1,
  },

  // ITEM INTERNO (Onde a mágica acontece)
  tabItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 56, 
    width: 65,  
    borderRadius: 28,
    gap: 3, 
    
    // TRUQUE PARA iOS: 
    // Se ainda estiverem subindo, usamos este 'top' para forçar o centro.
    // O valor '16' compensa o alinhamento padrão do React Navigation.
    ...Platform.select({
      ios: {
        top: 16, 
      },
      android: {
        top: 0,
      }
    })
  },

  // Highlight
  activeTabBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },

  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  }
});

export default MainTabNavigator;