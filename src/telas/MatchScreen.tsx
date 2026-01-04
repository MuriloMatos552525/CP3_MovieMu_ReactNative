import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MatchScreen = () => {
  return (
    <View style={styles.container}>
      <Ionicons name="flame" size={80} color="#FF512F" />
      <Text style={styles.title}>Movie Match</Text>
      <Text style={styles.subtitle}>Encontre o filme perfeito com seus amigos.</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>EM BREVE</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
  },
  subtitle: {
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  badge: {
    marginTop: 30,
    backgroundColor: '#1c1c1e',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  }
});

export default MatchScreen;