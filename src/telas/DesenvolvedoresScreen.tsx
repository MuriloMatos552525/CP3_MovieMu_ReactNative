import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Animated, Image } from 'react-native';

const SobreScreen = () => {
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 10,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }], opacity: fadeAnim }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <View style={styles.header}>
          <Text style={styles.title}>Bem-vindo ao MovieMu</Text>
          <Text style={styles.subtitle}>Sua fonte de informações sobre filmes</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipe de Desenvolvimento</Text>
          <View style={styles.item}>
            <Text style={styles.label}>Gerente de Projeto:</Text>
            <Text style={styles.value}>Giovanna Alvarez</Text>
            <Text style={styles.value}>RM98892</Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.label}>Desenvolvedor Frontend:</Text>
            <Text style={styles.value}>Murilo Matos</Text>
            <Text style={styles.value}>RM552525</Text>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Funcionamento do App</Text>
          <Text style={styles.description}>
            O MovieMu é o seu companheiro ideal para descobrir novos filmes, encontrar informações sobre seus favoritos e acompanhar as últimas novidades do cinema. Com uma interface intuitiva e recursos completos, o MovieMu torna mais fácil do que nunca explorar o mundo do entretenimento cinematográfico.
          </Text>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 50,
  },
  logo: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#ccc',
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  item: {
    marginBottom: 10,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#aaa',
  },
  value: {
    fontSize: 18,
    color: '#fff',
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 22,
  },
});

export default SobreScreen;
