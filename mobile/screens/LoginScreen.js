import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.title}>🚕 TAXI SAFETY NETWORK</Text>
        <Text style={styles.subtitle}>RÉSEAU DE SÉCURITÉ DES TAXIS</Text>
        <View style={styles.certBadge}>
          <Text style={styles.certText}>DGSN CERTIFIED</Text>
        </View>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Driver Authentication</Text>
        <Text style={styles.sectionSub}>Veuillez vous identifier pour continuer</Text>

        <Text style={styles.label}>BADGE NUMBER</Text>
        <Text style={styles.labelFr}>N° DE BADGE</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., TX-YDE-001"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>ACTIVE NETWORK</Text>
        <Text style={styles.labelFr}>RÉSEAU ACTIF</Text>
        <View style={styles.networkRow}>
          <TouchableOpacity style={styles.networkBtn}>
            <Text style={styles.networkBtnText}>MTN</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.networkBtn}>
            <Text style={styles.networkBtnText}>ORANGE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.networkBtn}>
            <Text style={styles.networkBtnText}>CAMTEL</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>PASSWORD</Text>
        <Text style={styles.labelFr}>MOT DE PASSE</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor="#999"
        />

        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => navigation.navigate('DriverDashboard')}
        >
          <Text style={styles.loginBtnText}>INITIALIZE SESSION →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.policeBtn}
          onPress={() => navigation.navigate('PoliceDashboard')}
        >
          <Text style={styles.policeBtnText}>👮 POLICE ACCESS</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.createAccount}>
            New to the network? CREATE ACCOUNT
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>DGSN CERTIFIED • END-TO-END ENCRYPTION</Text>
          <Text style={styles.version}>SYSTEM VERSION 4.2.0-ALPHA</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#0b2b3b',
    padding: 40,
    paddingTop: 60,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  subtitle: {
    color: '#ffd700',
    fontSize: 14,
    marginTop: 5,
  },
  certBadge: {
    marginTop: 10,
    backgroundColor: '#1e4a6b',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
  },
  certText: {
    color: '#4caf50',
    fontSize: 11,
    fontWeight: 'bold',
  },
  formContainer: {
    padding: 20,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0b2b3b',
    textAlign: 'center',
    marginTop: 20,
  },
  sectionSub: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
  },
  labelFr: {
    fontSize: 11,
    color: '#999',
    marginBottom: 5,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
  },
  networkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  networkBtn: {
    backgroundColor: '#1e4a6b',
    padding: 10,
    borderRadius: 8,
    flex: 0.3,
    alignItems: 'center',
  },
  networkBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loginBtn: {
    backgroundColor: '#0b2b3b',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },
  loginBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  policeBtn: {
    backgroundColor: '#2c3e50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  policeBtnText: {
    color: '#ffd700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  createAccount: {
    textAlign: 'center',
    marginTop: 15,
    color: '#0b2b3b',
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#999',
  },
  version: {
    fontSize: 10,
    color: '#999',
    marginTop: 5,
  },
});