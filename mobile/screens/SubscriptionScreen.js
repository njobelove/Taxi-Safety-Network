import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, ActivityIndicator,
  Alert, Linking, TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../services/AuthContext';

const RED    = '#d32f2f';
const BLUE   = '#1565C0';
const GREEN  = '#2e7d32';
const GOLD   = '#f5c518';
const ORANGE = '#FF6600';

const BASE_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? 'https://tsn-backend-53yj.onrender.com'
  : 'http://localhost:8000';

const PLANS = [
  {
    id: 'monthly', name: 'MONTHLY', price: 500, period: '/month', color: BLUE,
    features: ['Full SOS alerts', 'Voice broadcast', 'Live map', 'Community chat', 'Alert history'],
  },
  {
    id: 'quarterly', name: 'QUARTERLY', price: 1200, period: '/3 months', color: GREEN, badge: 'BEST VALUE',
    features: ['All monthly features', 'Priority police response', 'Offline SMS included', 'Statistics dashboard'],
  },
  {
    id: 'annual', name: 'ANNUAL', price: 4000, period: '/year', color: GOLD, badge: 'FULL ACCESS',
    features: ['All features', 'Hardware button support', 'Family plan (3 drivers)', 'Dedicated support line'],
  },
];

// MTN MoMo USSD codes for Cameroon
const USSD = {
  MTN:    (amount, ref) => `*126*1*2*${amount}*TSN${ref}#`,
  Orange: (amount, ref) => `#150*2*${amount}*TSN${ref}#`,
  Camtel: (amount, ref) => `*200*3*${amount}*TSN${ref}#`,
};

// TSN payment number (your registered MTN MoMo merchant number)
const TSN_PAYMENT_NUMBER = '677000000'; // Replace with real MTN MoMo merchant number

export default function SubscriptionScreen({ nav }) {
  const { user, role } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [network,      setNetwork]      = useState('MTN');
  const [phone,        setPhone]        = useState(user?.phoneNumber || '');
  const [loading,      setLoading]      = useState(false);
  const [step,         setStep]         = useState(1);
  const [txRef,        setTxRef]        = useState('');

  const isDriver = role === 'driver';
  const plan     = PLANS.find(p => p.id === selectedPlan);
  const userId   = user?.badgeId || user?.stationId || 'unknown';

  const handlePayment = async () => {
    const cleanPhone = phone.replace(/\s/g, '').replace(/^\+237/, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      Alert.alert('Invalid Number', 'Please enter a valid 9-digit ' + network + ' number.\n\nExample: 677000000');
      return;
    }

    setLoading(true);

    // Generate reference
    const ref = userId.replace(/[^A-Z0-9]/g, '').slice(0, 8) + Date.now().toString().slice(-4);
    setTxRef(ref);

    // Save to backend
    try {
      await fetch(BASE_URL + '/api/payments/initiate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId, userName: user?.fullName || user?.stationName,
          plan: selectedPlan, amount: plan.price,
          currency: 'XAF', phone: cleanPhone, network,
          transactionId: ref,
        }),
      });
    } catch (e) { console.log('Payment init error:', e.message); }

    setLoading(false);

    // Build USSD code
    const ussdCode = USSD[network]?.(plan.price, ref) || USSD.MTN(plan.price, ref);

    // Show payment instructions
    Alert.alert(
      'Complete Your Payment',
      `PAY ${plan.price.toLocaleString()} XAF via ${network}\n\n` +
      `OPTION 1 — DIAL USSD:\n${ussdCode}\n\n` +
      `OPTION 2 — SEND MONEY:\nSend ${plan.price} XAF to:\nNumber: ${TSN_PAYMENT_NUMBER}\nName: TSN Safety Network\nRef: TSN${ref}\n\n` +
      `After payment, tap "I HAVE PAID" below.`,
      [
        {
          text: 'Dial ' + ussdCode,
          onPress: () => {
            Linking.openURL('tel:' + encodeURIComponent(ussdCode))
              .catch(() => {
                // Fallback for web — show USSD code
                Alert.alert('Dial this USSD code', ussdCode + '\n\nOn your ' + network + ' phone');
              });
            setStep(3);
          },
        },
        {
          text: 'Open MoMo App',
          onPress: () => {
            // Try to open MTN MoMo app
            Linking.openURL('momo://').catch(() => {
              Linking.openURL('https://mtn.com.cm/mobile-money').catch(() => {});
            });
            setStep(3);
          },
        },
        {
          text: 'I Will Pay Later',
          onPress: () => setStep(3),
          style: 'cancel',
        },
      ]
    );
  };

  const handleConfirmPaid = async () => {
    setLoading(true);
    try {
      const res  = await fetch(BASE_URL + '/api/payments/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: txRef, userId }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert(
          '✅ Subscription Active!',
          `Your ${plan.name} plan is now active!\n\nExpires: ${new Date(data.expiresAt).toLocaleDateString()}\n\nThank you for subscribing to TSN!`,
          [{ text: 'Continue', onPress: () => nav(isDriver ? 'driverDashboard' : 'policeDashboard') }]
        );
        return;
      }
    } catch (e) {}

    // Manual verification fallback
    Alert.alert(
      'Payment Under Review',
      'If you have paid, your subscription will be activated within 30 minutes.\n\n' +
      'Please send your payment screenshot to:\n📱 WhatsApp: +237677000000\n✉ support@tsn-cameroon.com\n\n' +
      'Reference: TSN' + txRef,
      [
        { text: 'WhatsApp Support', onPress: () => Linking.openURL('https://wa.me/237677000000?text=TSN Payment Reference: TSN' + txRef) },
        { text: 'OK', onPress: () => nav(isDriver ? 'driverDashboard' : 'policeDashboard') },
      ]
    );
    setLoading(false);
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : nav(isDriver ? 'driverDashboard' : 'policeDashboard')}>
          <MaterialIcons name="arrow-back" size={24} color={RED} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>TSN SUBSCRIPTION</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={s.hero}>
          <MaterialIcons name="security" size={40} color="#fff" />
          <Text style={s.heroTitle}>Stay Protected</Text>
          <Text style={s.heroSub}>Choose a plan to access all TSN features</Text>
        </View>

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
                    <MaterialIcons
                      name={p.id === 'monthly' ? 'calendar-today' : p.id === 'quarterly' ? 'bar-chart' : 'star'}
                      size={22} color="#fff"
                    />
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
                      <MaterialIcons name="check-circle" size={16} color={p.color} />
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
              <Text style={s.nextBtnTxt}>CONTINUE → PAY {plan?.price?.toLocaleString()} XAF</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 2 && (
          <View style={s.payCard}>
            <Text style={s.payTitle}>MOBILE MONEY PAYMENT</Text>
            <Text style={s.payAmount}>{plan?.price?.toLocaleString()} XAF · {plan?.name}</Text>

            <Text style={s.fieldLabel}>SELECT YOUR NETWORK</Text>
            <View style={s.networkRow}>
              {[
                { n: 'MTN',    label: 'MTN MoMo',      color: GOLD   },
                { n: 'Orange', label: 'Orange Money',   color: ORANGE },
                { n: 'Camtel', label: 'Camtel Mobile',  color: BLUE   },
              ].map(({ n, label, color }) => (
                <TouchableOpacity
                  key={n}
                  style={[s.netBtn, network === n && { backgroundColor: color, borderColor: 'transparent' }]}
                  onPress={() => setNetwork(n)}
                >
                  <MaterialIcons name="phone-android" size={16} color={network === n ? '#fff' : '#555'} />
                  <Text style={[s.netTxt, network === n && { color: '#fff', fontWeight: '900' }]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.fieldLabel}>YOUR {network} NUMBER</Text>
            <View style={s.phoneRow}>
              <MaterialIcons name="phone" size={20} color="#aaa" />
              <TextInput
                style={s.phoneInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. 677000000"
                placeholderTextColor="#aaa"
                keyboardType="phone-pad"
              />
            </View>
            <Text style={s.phoneHint}>
              A USSD code will be shown that you dial on your {network} phone to approve the payment.
            </Text>

            <View style={s.summaryBox}>
              <Text style={s.summaryTitle}>PAYMENT SUMMARY</Text>
              {[
                ['Plan',    plan?.name],
                ['Amount',  plan?.price?.toLocaleString() + ' XAF'],
                ['Network', network + ' Mobile Money'],
                ['Account', userId],
              ].map(([lbl, val]) => (
                <View key={lbl} style={s.summaryRow}>
                  <Text style={s.summaryLbl}>{lbl}</Text>
                  <Text style={s.summaryVal}>{val}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[s.payBtn, loading && { opacity: 0.7 }]}
              onPress={handlePayment}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <MaterialIcons name="payment" size={20} color="#fff" />
                  <Text style={s.payBtnTxt}>PAY {plan?.price?.toLocaleString()} XAF VIA {network}</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={s.backBtn2} onPress={() => setStep(1)}>
              <MaterialIcons name="arrow-back" size={16} color="#888" />
              <Text style={s.backBtn2Txt}>Change Plan</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 3 && (
          <View style={s.confirmCard}>
            <MaterialIcons name="access-time" size={64} color={GOLD} />
            <Text style={s.confirmTitle}>PAYMENT PENDING</Text>
            <Text style={s.confirmRef}>Reference: TSN{txRef}</Text>
            <Text style={s.confirmSub}>
              {`Dial the USSD code on your ${network} phone:\n\n`}
              <Text style={{ fontWeight: '900', fontSize: 16 }}>
                {USSD[network]?.(plan?.price, txRef)}
              </Text>
              {'\n\nOR send ' + plan?.price?.toLocaleString() + ' XAF to:\n'}
              <Text style={{ fontWeight: '900' }}>{TSN_PAYMENT_NUMBER}</Text>
              {'\n\nThen tap the button below to confirm.'}
            </Text>

            <TouchableOpacity
              style={[s.payBtn, { marginTop: 20 }, loading && { opacity: 0.7 }]}
              onPress={handleConfirmPaid}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <MaterialIcons name="check-circle" size={20} color="#fff" />
                  <Text style={s.payBtnTxt}>I HAVE PAID — ACTIVATE NOW</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.whatsappBtn]}
              onPress={() => Linking.openURL('https://wa.me/237677000000?text=TSN Subscription Payment Ref: TSN' + txRef + ' Plan: ' + plan?.name + ' Amount: ' + plan?.price + ' XAF')}
            >
              <MaterialIcons name="chat" size={18} color="#fff" />
              <Text style={s.whatsappTxt}>Send Payment Proof on WhatsApp</Text>
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
  headerTitle:   { fontSize: 15, fontWeight: '900', color: '#111' },
  hero:          { backgroundColor: RED, alignItems: 'center', paddingVertical: 30, paddingHorizontal: 20, gap: 8 },
  heroTitle:     { fontSize: 24, fontWeight: '900', color: '#fff' },
  heroSub:       { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  sectionTitle:  { fontSize: 11, fontWeight: '800', color: '#888', paddingHorizontal: 16, marginTop: 16, marginBottom: 10, letterSpacing: 0.8 },
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
  planFeatures:  { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12, gap: 8 },
  featureRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureTxt:    { fontSize: 13, color: '#555' },
  nextBtn:       { marginHorizontal: 16, marginBottom: 16, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  nextBtnTxt:    { fontSize: 15, fontWeight: '900', color: '#fff' },
  payCard:       { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 20 },
  payTitle:      { fontSize: 14, fontWeight: '900', color: '#111', marginBottom: 4 },
  payAmount:     { fontSize: 20, fontWeight: '900', color: GREEN, marginBottom: 20 },
  fieldLabel:    { fontSize: 11, fontWeight: '800', color: '#555', marginBottom: 8, letterSpacing: 0.5 },
  networkRow:    { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  netBtn:        { flex: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ddd', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  netTxt:        { fontSize: 12, fontWeight: '600', color: '#555' },
  phoneRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, paddingHorizontal: 14, marginBottom: 8 },
  phoneInput:    { flex: 1, paddingVertical: 14, fontSize: 18, color: '#111', fontWeight: '700' },
  phoneHint:     { fontSize: 11, color: '#888', lineHeight: 16, marginBottom: 20 },
  summaryBox:    { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 16, marginBottom: 20 },
  summaryTitle:  { fontSize: 11, fontWeight: '800', color: '#888', marginBottom: 12, letterSpacing: 0.5 },
  summaryRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  summaryLbl:    { fontSize: 13, color: '#888' },
  summaryVal:    { fontSize: 13, fontWeight: '700', color: '#111' },
  payBtn:        { backgroundColor: RED, borderRadius: 14, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  payBtnTxt:     { fontSize: 15, fontWeight: '900', color: '#fff' },
  backBtn2:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 4 },
  backBtn2Txt:   { fontSize: 13, color: '#888', fontWeight: '600' },
  confirmCard:   { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 30, alignItems: 'center', gap: 12 },
  confirmTitle:  { fontSize: 22, fontWeight: '900', color: '#111' },
  confirmRef:    { fontSize: 13, color: '#888', fontFamily: 'monospace' },
  confirmSub:    { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 24 },
  whatsappBtn:   { backgroundColor: '#25D366', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center' },
  whatsappTxt:   { fontSize: 14, fontWeight: '800', color: '#fff' },
});