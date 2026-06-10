import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';

export default function SignupScreen({ navigation }) {
  const [role, setRole] = useState('driver');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PUBLIC SAFETY | SÉCURITÉ PUBLIQUE</Text>
        <Text style={styles.headerSub}>CAMEROON NETWORK</Text>
        <Text style={styles.mainTitle}>Taxi Safety Network</Text>
        <Text style={styles.mainFr}>Sûreté des Taxis du Cameroun</Text>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>⏰ 24/7</Text>
          <Text style={styles.infoText}>TACTICAL WATCH</Text>
          <Text style={styles.infoFr}>Veille Tactique</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>📍 GPS</Text>
          <Text style={styles.infoText}>REAL-TIME DATA</Text>
          <Text style={styles.infoFr}>Données en Temps Réel</Text>
        </View>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>PERSONNEL REGISTRATION</Text>
        <Text style={styles.formFr}>Enregistrement du Personnel</Text>

        <Text style={styles.label}>01. SELECT AUTHORITY ROLE</Text>
        <Text style={styles.labelFr}>CHOISIR LE RÔLE</Text>
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'driver' && styles.roleActive]}
            onPress={() => setRole('driver')}
          >
            <Text style={styles.roleText}>Driver</Text>
            <Text style={styles.roleFr}>Conducteur</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'police' && styles.roleActive]}
            onPress={() => setRole('police')}
          >
            <Text style={styles.roleText}>Police</Text>
            <Text style={styles.roleFr}>Forces de l'ordre</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>02. PERSONNEL DETAILS</Text>
        <Text style={styles.labelFr}>DÉTAILS DU PERSONNEL</Text>

        <Text style={styles.inputLabel}>Full Name</Text>
        <Text style={styles.inputFr}>NOM COMPLET</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Jean-Paul Biya"
          placeholderTextColor="#999"
        />

        <Text style={styles.inputLabel}>Badge Number / ID</Text>
        <Text style={styles.inputFr}>NUMÉRO DE BADGE / MATRICULE</Text>
        <TextInput
          style={styles.input}
          placeholder="TX-9982-CP"
          placeholderTextColor="#999"
        />

        <Text style={styles.inputLabel}>Phone Number</Text>
        <Text style={styles.inputFr}>NUMÉRO DE TÉLÉPHONE</Text>
        <TextInput
          style={styles.input}
          placeholder="+237 6XX XXX XXX"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
        />

        {role === 'driver' && (
          <>
            <Text style={styles.inputLabel}>Vehicle Plate</Text>
            <Text style={styles.inputFr}>PLAQUE D'IMMATRICULATION</Text>
            <TextInput
              style={styles.input}
              placeholder="CE 000 AA"
              placeholderTextColor="#999"
            />
          </>
        )}

        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            ⓘ Note: For Law Enforcement, your district and rank will be verified
            against the National Police Database.
          </Text>
          <Text style={styles.noteFr}>
            Note: Pour les forces de l'ordre, votre district et votre grade
            seront vérifiés.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.registerBtn}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.registerText}>INITIALIZE SECURE ACCOUNT</Text>
          <Text style={styles.registerFr}>INITIALISEZ LE COMPTE SÉCURISÉ</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLink}>Already have an account? Log In</Text>
        </TouchableOpacity>

        <Text style={styles.footerStatus}>SENTINEL CORE STATUS: PRC-GDRN</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#0b2b3b',
    padding: 30,
    paddingTop: 50,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffd700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerSub: {
    color: 'white',
    fontSize: 10,
    marginTop: 3,
  },
  mainTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },
  mainFr: {
    color: 'white',
    fontSize: 14,
    marginTop: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: 20,
  },
  infoBox: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    flex: 0.45,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0b2b3b',
  },
  infoText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0b2b3b',
    marginTop: 5,
  },
  infoFr: {
    fontSize: 10,
    color: '#666',
  },
  formContainer: {
    padding: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0b2b3b',
    textAlign: 'center',
  },
  formFr: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0b2b3b',
    marginTop: 15,
  },
  labelFr: {
    fontSize: 11,
    color: '#999',
    marginBottom: 5,
  },
  roleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  roleBtn: {
    backgroundColor: '#e0e0e0',
    padding: 12,
    borderRadius: 10,
    flex: 0.48,
    alignItems: 'center',
  },
  roleActive: {
    backgroundColor: '#0b2b3b',
  },
  roleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  roleFr: {
    fontSize: 10,
    color: '#666',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  inputFr: {
    fontSize: 10,
    color: '#999',
    marginBottom: 3,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 14,
  },
  noteBox: {
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  noteText: {
    fontSize: 10,
    color: '#666',
  },
  noteFr: {
    fontSize: 9,
    color: '#999',
    marginTop: 5,
  },
  registerBtn: {
    backgroundColor: '#0b2b3b',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 25,
  },
  registerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  registerFr: {
    color: '#ffd700',
    fontSize: 11,
    marginTop: 3,
  },
  loginLink: {
    textAlign: 'center',
    marginTop: 15,
    color: '#0b2b3b',
    textDecorationLine: 'underline',
  },
  footerStatus: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 10,
    color: '#999',
    marginBottom: 30,
  },
});