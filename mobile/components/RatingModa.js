/**
 * TSN Driver Rating Component
 * Police rate alerts after resolving - builds credibility scores
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Alert, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const RED   = '#d32f2f';
const GREEN = '#2e7d32';
const GOLD  = '#f5c518';
const BLUE  = '#1565C0';

const BASE_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? 'https://tsn-backend-53yj.onrender.com' : 'http://localhost:8000';

export default function RatingModal({ visible, alert, onClose, onRated }) {
  const [rating,  setRating]  = useState(0);
  const [genuine, setGenuine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notes,   setNotes]   = useState('');

  const handleSubmit = async () => {
    if (genuine === null) return Alert.alert('Select', 'Was this alert genuine?');
    if (rating === 0)     return Alert.alert('Select', 'Please give a star rating.');

    setLoading(true);
    try {
      const id = alert?._id || alert?.id;
      await fetch(BASE_URL + '/api/alerts/' + id + '/rate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, genuine, notes }),
      });
      Alert.alert('✅ Rating Submitted', 'Thank you for your feedback. This helps improve TSN credibility scores.');
      onRated && onRated();
      onClose();
    } catch (e) {
      Alert.alert('Error', 'Could not submit rating. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.modal}>
          <View style={s.handle} />

          <Text style={s.title}>RATE THIS ALERT</Text>
          <Text style={s.sub}>{alert?.driverName} · {(alert?.alertType||'SOS').toUpperCase()}</Text>

          {/* Genuine or false alarm */}
          <Text style={s.label}>WAS THIS ALERT GENUINE?</Text>
          <View style={s.genuineRow}>
            <TouchableOpacity
              style={[s.genuineBtn, genuine === true && { backgroundColor: GREEN, borderColor: GREEN }]}
              onPress={() => setGenuine(true)}
            >
              <MaterialIcons name="check-circle" size={22} color={genuine === true ? '#fff' : GREEN} />
              <Text style={[s.genuineTxt, genuine === true && { color: '#fff' }]}>YES — REAL EMERGENCY</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.genuineBtn, genuine === false && { backgroundColor: RED, borderColor: RED }]}
              onPress={() => setGenuine(false)}
            >
              <MaterialIcons name="cancel" size={22} color={genuine === false ? '#fff' : RED} />
              <Text style={[s.genuineTxt, genuine === false && { color: '#fff' }]}>NO — FALSE ALARM</Text>
            </TouchableOpacity>
          </View>

          {/* Star rating */}
          <Text style={s.label}>RESPONSE QUALITY</Text>
          <View style={s.starsRow}>
            {[1,2,3,4,5].map(star => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <MaterialIcons
                  name={star <= rating ? 'star' : 'star-border'}
                  size={36}
                  color={star <= rating ? GOLD : '#ddd'}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.ratingLabel}>
            {rating === 0 ? 'Tap to rate' : rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : 'Excellent'}
          </Text>

          {/* Credibility impact */}
          {genuine !== null && (
            <View style={[s.impactBox, { backgroundColor: genuine ? '#e8f5e9' : '#fde8e8' }]}>
              <MaterialIcons name={genuine ? 'trending-up' : 'trending-down'} size={16} color={genuine ? GREEN : RED} />
              <Text style={[s.impactTxt, { color: genuine ? GREEN : RED }]}>
                {genuine
                  ? 'Driver credibility score will INCREASE (+10 points)'
                  : 'Driver credibility score will DECREASE (-20 points). Repeated false alarms may result in account suspension.'
                }
              </Text>
            </View>
          )}

          <View style={s.btnRow}>
            <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
              <Text style={s.cancelTxt}>SKIP</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.submitBtn, loading && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                <>
                  <MaterialIcons name="star" size={16} color="#fff" />
                  <Text style={s.submitTxt}>SUBMIT RATING</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal:        { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle:       { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title:        { fontSize: 18, fontWeight: '900', color: '#111', textAlign: 'center', marginBottom: 4 },
  sub:          { fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 20 },
  label:        { fontSize: 11, fontWeight: '800', color: '#555', letterSpacing: 0.5, marginBottom: 10 },
  genuineRow:   { flexDirection: 'row', gap: 10, marginBottom: 20 },
  genuineBtn:   { flex: 1, borderWidth: 1.5, borderRadius: 12, padding: 12, alignItems: 'center', gap: 6, borderColor: '#ddd' },
  genuineTxt:   { fontSize: 11, fontWeight: '800', color: '#555', textAlign: 'center' },
  starsRow:     { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 6 },
  ratingLabel:  { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 16, fontStyle: 'italic' },
  impactBox:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 12, padding: 12, marginBottom: 20 },
  impactTxt:    { fontSize: 12, fontWeight: '600', flex: 1, lineHeight: 18 },
  btnRow:       { flexDirection: 'row', gap: 10 },
  cancelBtn:    { flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelTxt:    { fontSize: 14, fontWeight: '700', color: '#888' },
  submitBtn:    { flex: 2, backgroundColor: GOLD, borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  submitTxt:    { fontSize: 14, fontWeight: '900', color: '#fff' },
});