import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, ActivityIndicator,
  Alert, Linking, TextInput,
} from 'react-native';
import { useAuth } from '../services/AuthContext';

const RED    = '#d32f2f';
const BLUE   = '#1565C0';
const GREEN  = '#2e7d32';
const GOLD   = '#f5c518';
const ORANGE = '#FF6600'; // MTN Orange color

const BASE_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? 'https://tsn-backend-53yj.onrender.com'
  : 'http://localhost:8000';

const PLANS = [
  {
    id:      'monthly',
    name:    'MONTHLY',
    price:   500,
    period:  '/month',
    color:   BLUE,
    features: ['Full SOS alerts', 'Voice broadcast', 'Live map', 'Community chat', 'Alert history'],
  },
  {
    id:      'quarterly',
    name:    'QUARTERLY',
    price:   1200,
    period:  '/3 months',
    color:   GREEN,
    badge:   'BEST VALUE',
    features: ['All monthly features', 'Priority police response', 'Offline SMS included', 'Statistics dashboard'],
  },
  {
    id:      'annual',
    name:    'ANNUAL',
    price:   4000,
    period:  '/year',
    color:   GOLD,
    badge:   'FULL ACCESS',
    features: ['All features', 'Hardware button support', 'Family plan (3 drivers)', 'Dedicated support line'],
  },
];

export default function SubscriptionScreen({ nav }) {
  const { user, role } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [network,      setNetwork]      = useState('MTN');
  const [phone,        setPhone]        = useState(user?.phoneNumber || '');
  const [loading,      setLoading]      = useState(false);
  const [step,         setStep]         = useState(1); // 1=plan, 2=payment, 3=confirm

  const isDriver = role === 'driver';
  const plan     = PLANS.find(p => p.id === selectedPlan);

  // ── Initiate MTN MoMo payment ─────────────────────────────────────────────
  const handlePayment = async () => {
    if (!phone.trim()) {
      Alert.alert('Phone Required', 'Enter your ' + network + ' number to pay.');
      return;
    }
    if (phone.length < 9) {
      Alert.alert('Invalid Number', 'Please enter a valid 9-digit ' + network + ' number.');
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch(BASE_URL + '/api/payments/initiate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          userId:   user?.badgeId || user?.stationId,
          userName: user?.fullName || user?.stationName,
          plan:     selectedPlan,
          amount:   plan.price,
          currency: 'XAF',
          phone:    phone.trim(),
          network,
        }),
      });
      const data = await res.json();

      if (data.success || data.paymentUrl || data.ussdCode) {
        setStep(3);
        // If USSD code provided, open it
        if (data.ussdCode) {
          Alert.alert(
            '📱 Dial USSD to Pay',
            'Dial this code on your ' + network + ' phone:\n\n' + data.ussdCode + '\n\nOr we have sent a push notification to your phone to approve the payment.',
            [
              { text: '📞 Dial Now', onPress: () => Linking.openURL('tel:' + encodeURIComponent(data.ussdCode)) },
              { text: 'Already Paid', onPress: () => handleVerify(data.transactionId) },
            ]
          );
        } else if (data.paymentUrl) {
          Linking.openURL(data.paymentUrl);
        }
      } else {
        throw new Error(data.error || 'Payment initiation failed');
      }
    } catch (e) {
      // Fallback: show USSD codes manually
      showManualPayment();
    } finally {
      setLoading(false);
    }
  };

  const showManualPayment = () => {
    const ussdCodes = {
      MTN:     '*126#',
      Orange:  '#150#',
      Camtel:  '*200#',
    };
    const ussd = ussdCodes[network] || '*126#';
    Alert.alert(
      '📱 Pay via ' + network + ' Mobile Money',
      'Send ' + plan.price + ' XAF to:\n\n' +
      '📱 Number: 677 000 000\n' +
      '👤 Name: TSN Safety Network\n' +
      '💰 Amount: ' + plan.price + ' XAF\n' +
      '📝 Reference: ' + (user?.badgeId || user?.stationId) + '\n\n' +
      'Or dial ' + ussd + ' on your ' + network + ' phone\n\n' +
      'After payment, contact us at:\n+237 677 000 000',
      [
        { text: '📞 Dial ' + ussd,  onPress: () => Linking.openURL('tel:' + encodeURIComponent(ussd)) },
        { text: '✅ I Have Paid',    onPress: () => setStep(3) },
        { text: 'Cancel',           style: 'cancel' },
      ]
    );
  };

  const handleVerify = async (transactionId) => {
    setLoading(true);
    try {
      const res  = await fetch(BASE_URL + '/api/payments/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ transactionId, userId: user?.badgeId || user?.stationId }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert(
          '✅ Payment Confirmed!',
          'Your ' + plan.name + ' plan is now active.\n\nThank you for subscribing to TSN!',
          [{ text: 'Continue', onPress: () => nav(isDriver ? 'driverDashboard' : 'policeDashboard') }]
        );
      }
    } catch (e) {
      Alert.alert('Verification Failed', 'Please contact support if payment was deducted.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav(isDriver ? 'driverDashboard' : 'policeDashboard')}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>TSN SUBSCRIPTION</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={s.hero}>
          <Text style={{ fontSize: 40 }}>🛡</Text>
          <Text style={s.heroTitle}>Stay Protected</Text>
          <Text style={s.heroSub}>Choose a plan to access all TSN features</Text>
        </View>

        {/* Plans */}
        {step === 1 && (
          <>
            <Text style={s.sectionTitle}>SELECT YOUR PLAN</Text>
            {PLANS.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[s.planCard, selectedPlan === p.id && { borderColor: p.color, borderWidth: 2.5 }]}
                onPress={() => setSelectedPlan(p.id)}
              >
                {p.badge && (
                  <View style={[s.planBadge, { backgroundColor: p.color }]}>
                    <Text style={s.planBadgeTxt}>{p.badge}</Text>
                  </View>
                )}
                <View style={s.planTop}>
                  <View style={[s.planIcon, { backgroundColor: p.color }]}>
                    <Text style={{ fontSize: 22, color: '#fff' }}>
                      {p.id === 'monthly' ? '📅' : p.id === 'quarterly' ? '📊' : '⭐'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.planName}>{p.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                      <Text style={[s.planPrice, { color: p.color }]}>{p.price.toLocaleString()} XAF</Text>
                      <Text style={s.planPeriod}>{p.period}</Text>
                    </View>
                  </View>
                  <View style={[s.planRadio, selectedPlan === p.id && { backgroundColor: p.color, borderColor: p.color }]}>
                    {selectedPlan === p.id && <View style={s.planRadioInner} />}
                  </View>
                </View>
                <View style={s.planFeatures}>
                  {p.features.map(f => (
                    <View key={f} style={s.featureRow}>
                      <Text style={[s.featureCheck, { color: p.color }]}>✓</Text>
                      <Text style={s.featureTxt}>{f}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[s.nextBtn, { backgroundColor: PLANS.find(p => p.id === selectedPlan)?.color || RED }]}
              onPress={() => setStep(2)}
            >
              <Text style={s.nextBtnTxt}>
                CONTINUE → PAY {plan?.price?.toLocaleString()} XAF
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Payment */}
        {step === 2 && (
          <View style={s.payCard}>
            <Text style={s.payTitle}>MOBILE MONEY PAYMENT</Text>
            <Text style={s.payAmount}>{plan?.price?.toLocaleString()} XAF · {plan?.name}</Text>

            {/* Network selector */}
            <Text style={s.fieldLabel}>SELECT NETWORK</Text>
            <View style={s.networkRow}>
              {['MTN', 'Orange', 'Camtel'].map(n => (
                <TouchableOpacity
                  key={n}
                  style={[s.netBtn, network === n && {
                    backgroundColor: n === 'MTN' ? GOLD : n === 'Orange' ? ORANGE : BLUE,
                    borderColor: 'transparent',
                  }]}
                  onPress={() => setNetwork(n)}
                >
                  <Text style={[s.netTxt, network === n && { color: '#fff', fontWeight: '900' }]}>
                    {n === 'MTN' ? '🟡 MTN MoMo' : n === 'Orange' ? '🟠 Orange Money' : '🔵 Camtel'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Phone */}
            <Text style={s.fieldLabel}>YOUR {network} NUMBER</Text>
            <TextInput
              style={s.phoneInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. 677000000"
              placeholderTextColor="#aaa"
              keyboardType="phone-pad"
            />
            <Text style={s.phoneHint}>
              You will receive a push notification on your phone to approve this payment.
            </Text>

            <View style={s.summaryBox}>
              <Text style={s.summaryTitle}>PAYMENT SUMMARY</Text>
              <View style={s.summaryRow}><Text style={s.summaryLbl}>Plan</Text><Text style={s.summaryVal}>{plan?.name}</Text></View>
              <View style={s.summaryRow}><Text style={s.summaryLbl}>Amount</Text><Text style={s.summaryVal}>{plan?.price?.toLocaleString()} XAF</Text></View>
              <View style={s.summaryRow}><Text style={s.summaryLbl}>Network</Text><Text style={s.summaryVal}>{network} Mobile Money</Text></View>
              <View style={s.summaryRow}><Text style={s.summaryLbl}>Account</Text><Text style={s.summaryVal}>{user?.badgeId || user?.stationId}</Text></View>
            </View>

            <TouchableOpacity
              style={[s.payBtn, loading && { opacity: 0.7 }]}
              onPress={handlePayment}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.payBtnTxt}>
                    {network === 'MTN' ? '🟡' : network === 'Orange' ? '🟠' : '🔵'} PAY {plan?.price?.toLocaleString()} XAF VIA {network}
                  </Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={s.backBtn2} onPress={() => setStep(1)}>
              <Text style={s.backBtn2Txt}>← Change Plan</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Confirmation */}
        {step === 3 && (
          <View style={s.confirmCard}>
            <Text style={{ fontSize: 60, marginBottom: 16 }}>⏳</Text>
            <Text style={s.confirmTitle}>PAYMENT PENDING</Text>
            <Text style={s.confirmSub}>
              Check your {network} phone for a payment approval notification.{'\n\n'}
              Approve the payment and your subscription will activate immediately.
            </Text>
            <TouchableOpacity
              style={[s.payBtn, { marginTop: 20 }]}
              onPress={() => nav(isDriver ? 'driverDashboard' : 'policeDashboard')}
            >
              <Text style={s.payBtnTxt}>✅ I APPROVED THE PAYMENT</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.backBtn2} onPress={() => setStep(1)}>
              <Text style={s.backBtn2Txt}>Start Over</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#f5f5f5' },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  back:          { fontSize: 22, color: RED, fontWeight: '600' },
  headerTitle:   { fontSize: 15, fontWeight: '900', color: '#111' },
  hero:          { alignItems: 'center', paddingVertical: 30, backgroundColor: '#fff', marginBottom: 8 },
  heroTitle:     { fontSize: 24, fontWeight: '900', color: '#111', marginTop: 12 },
  heroSub:       { fontSize: 13, color: '#888', marginTop: 6 },
  sectionTitle:  { fontSize: 11, fontWeight: '800', color: '#888', paddingHorizontal: 16, marginBottom: 10, letterSpacing: 0.8 },
  planCard:      { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#eee', elevation: 2 },
  planBadge:     { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
  planBadgeTxt:  { fontSize: 11, fontWeight: '800', color: '#fff' },
  planTop:       { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  planIcon:      { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  planName:      { fontSize: 16, fontWeight: '900', color: '#111', marginBottom: 4 },
  planPrice:     { fontSize: 22, fontWeight: '900' },
  planPeriod:    { fontSize: 13, color: '#888' },
  planRadio:     { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
  planRadioInner:{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#fff' },
  planFeatures:  { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12, gap: 6 },
  featureRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureCheck:  { fontSize: 14, fontWeight: '900' },
  featureTxt:    { fontSize: 13, color: '#555' },
  nextBtn:       { marginHorizontal: 16, marginBottom: 16, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  nextBtnTxt:    { fontSize: 15, fontWeight: '900', color: '#fff' },
  payCard:       { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 20 },
  payTitle:      { fontSize: 14, fontWeight: '900', color: '#111', marginBottom: 4 },
  payAmount:     { fontSize: 20, fontWeight: '900', color: GREEN, marginBottom: 20 },
  fieldLabel:    { fontSize: 11, fontWeight: '800', color: '#555', marginBottom: 8, letterSpacing: 0.5 },
  networkRow:    { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  netBtn:        { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ddd' },
  netTxt:        { fontSize: 13, fontWeight: '600', color: '#555' },
  phoneInput:    { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 18, color: '#111', fontWeight: '700', marginBottom: 8 },
  phoneHint:     { fontSize: 11, color: '#888', lineHeight: 16, marginBottom: 20 },
  summaryBox:    { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 16, marginBottom: 20 },
  summaryTitle:  { fontSize: 11, fontWeight: '800', color: '#888', marginBottom: 12, letterSpacing: 0.5 },
  summaryRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#eee' },
  summaryLbl:    { fontSize: 13, color: '#888' },
  summaryVal:    { fontSize: 13, fontWeight: '700', color: '#111' },
  payBtn:        { backgroundColor: RED, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  payBtnTxt:     { fontSize: 15, fontWeight: '900', color: '#fff' },
  backBtn2:      { alignItems: 'center', paddingVertical: 14 },
  backBtn2Txt:   { fontSize: 13, color: '#888', fontWeight: '600' },
  confirmCard:   { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 30, alignItems: 'center' },
  confirmTitle:  { fontSize: 22, fontWeight: '900', color: '#111', marginBottom: 12 },
  confirmSub:    { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22 },
});