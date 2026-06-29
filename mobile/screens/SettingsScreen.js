import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Switch, Alert, Linking } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../services/AuthContext';

const RED=('#d32f2f'),BLUE=('#1565C0'),GREEN=('#2e7d32'),GOLD=('#f5c518');

export default function SettingsScreen({nav}){
  const {user,role,logout}=useAuth();
  const isDriver=role==='driver';
  const [sosVibration,setSosVibration]=useState(true);
  const [voiceAlerts,setVoiceAlerts]=useState(true);
  const [pushNotif,setPushNotif]=useState(true);
  const [alertSound,setAlertSound]=useState(true);
  const [offlineSMS,setOfflineSMS]=useState(true);
  const [autoShareLoc,setAutoShareLoc]=useState(true);

  const Row=({icon,title,subtitle,value,onChange,type='switch',onPress,danger,color})=>(
    <TouchableOpacity style={s.row} onPress={type==='button'?onPress:undefined} activeOpacity={type==='button'?0.7:1}>
      <View style={[s.rowIcon,danger&&{backgroundColor:'#fde8e8'}]}>
        <MaterialIcons name={icon} size={22} color={danger?RED:color||'#555'}/>
      </View>
      <View style={s.rowInfo}>
        <Text style={[s.rowTitle,danger&&{color:RED}]}>{title}</Text>
        {subtitle&&<Text style={s.rowSub}>{subtitle}</Text>}
      </View>
      {type==='switch'&&<Switch value={value} onValueChange={onChange} trackColor={{false:'#ddd',true:RED}} thumbColor="#fff"/>}
      {type==='button'&&<MaterialIcons name="chevron-right" size={22} color={danger?RED:'#ccc'}/>}
      {type==='value'&&<Text style={s.rowVal}>{value}</Text>}
    </TouchableOpacity>
  );

  return(
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={()=>nav(isDriver?'driverDashboard':'policeDashboard')}>
          <MaterialIcons name="arrow-back" size={24} color={RED}/>
        </TouchableOpacity>
        <View style={{flexDirection:'row',alignItems:'center',gap:8,flex:1,justifyContent:'center'}}>
          <MaterialIcons name="settings" size={22} color="#111"/>
          <Text style={s.headerTitle}>SETTINGS</Text>
        </View>
        <View style={{width:34}}/>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.accountCard}>
          <View style={[s.accountAv,{backgroundColor:isDriver?RED:BLUE}]}>
            <MaterialIcons name={isDriver?'directions-car':'account-balance'} size={32} color="#fff"/>
          </View>
          <View style={{flex:1}}>
            <Text style={s.accountName}>{user?.fullName||user?.stationName||'—'}</Text>
            <Text style={s.accountId}>{isDriver?user?.badgeId:user?.stationId}</Text>
            <View style={[s.rolePill,{backgroundColor:isDriver?RED:BLUE}]}>
              <MaterialIcons name={isDriver?'directions-car':'local-police'} size={12} color="#fff"/>
              <Text style={s.rolePillTxt}>{isDriver?'DRIVER':'POLICE'}</Text>
            </View>
          </View>
        </View>

        <Text style={s.sectionTitle}>SOS & EMERGENCY</Text>
        <View style={s.card}>
          <Row icon="vibration"     title="SOS Vibration"         subtitle="Vibrate phone hard when SOS triggers"         value={sosVibration}  onChange={setSosVibration}/>
          <View style={s.div}/>
          <Row icon="mic"           title="Voice Alert Broadcast"  subtitle="Play your voice note when SOS triggers"       value={voiceAlerts}   onChange={setVoiceAlerts}/>
          <View style={s.div}/>
          <Row icon="sms"           title="Offline SMS Fallback"   subtitle="Auto-send SMS to Police 117 if no internet"   value={offlineSMS}    onChange={setOfflineSMS}/>
        </View>

        <Text style={s.sectionTitle}>NOTIFICATIONS</Text>
        <View style={s.card}>
          <Row icon="notifications" title="Push Notifications"     subtitle="Get notified when new alerts are created"     value={pushNotif}     onChange={setPushNotif}/>
          <View style={s.div}/>
          <Row icon="volume-up"     title="Alert Sound"            subtitle="Play sound for incoming alerts"               value={alertSound}    onChange={setAlertSound}/>
        </View>

        <Text style={s.sectionTitle}>LOCATION</Text>
        <View style={s.card}>
          <Row icon="gps-fixed"     title="Auto-Share Location"    subtitle="Automatically share GPS when on duty"         value={autoShareLoc}  onChange={setAutoShareLoc}/>
          <View style={s.div}/>
          <Row icon="map"           title="Open Live Map"          subtitle="See all active drivers on map"                type="button" color={GREEN} onPress={()=>nav('liveMap')}/>
        </View>

        <Text style={s.sectionTitle}>SUBSCRIPTION</Text>
        <View style={s.card}>
          <Row icon="star"          title="Subscribe / Upgrade"    subtitle="MTN MoMo · Orange Money · Plans from 500 XAF" type="button" color={GOLD} onPress={()=>nav('subscription')}/>
        </View>

        <Text style={s.sectionTitle}>EMERGENCY CONTACTS</Text>
        <View style={s.card}>
          {[{icon:'local-police',label:'Police Emergency',number:'117',color:BLUE},{icon:'medical-services',label:'Ambulance / SAMU',number:'15',color:GREEN},{icon:'local-fire-department',label:'Fire Brigade',number:'118',color:RED}].map(({icon,label,number,color})=>(
            <React.Fragment key={number}>
              <TouchableOpacity style={s.row} onPress={()=>Alert.alert('Call '+label,'Dial '+number+'?',[{text:'Cancel',style:'cancel'},{text:'CALL NOW',onPress:()=>Linking.openURL('tel:'+number)}])}>
                <View style={[s.rowIcon,{backgroundColor:color+'20'}]}><MaterialIcons name={icon} size={22} color={color}/></View>
                <View style={s.rowInfo}>
                  <Text style={s.rowTitle}>{label}</Text>
                  <Text style={[s.rowSub,{color,fontWeight:'800'}]}>{number}</Text>
                </View>
                <TouchableOpacity style={[s.callPill,{backgroundColor:color}]} onPress={()=>Linking.openURL('tel:'+number)}>
                  <MaterialIcons name="phone" size={14} color="#fff"/>
                  <Text style={s.callPillTxt}>CALL</Text>
                </TouchableOpacity>
              </TouchableOpacity>
              <View style={s.div}/>
            </React.Fragment>
          ))}
          <Row icon="manage-accounts" title="Manage Contacts" subtitle="Add custom police station numbers" type="button" onPress={()=>nav('profileSetup')}/>
        </View>

        <Text style={s.sectionTitle}>ABOUT TSN</Text>
        <View style={s.card}>
          <Row icon="info"          title="App Version"            subtitle="Taxi Safety Network"                          type="value" value="1.0.0"/>
          <View style={s.div}/>
          <Row icon="email"         title="Contact Support"        subtitle="support@tsn-cameroon.com"                     type="button" onPress={()=>Linking.openURL('mailto:support@tsn-cameroon.com')}/>
          <View style={s.div}/>
          <Row icon="lock"          title="Privacy Policy"         subtitle="How we protect your data"                     type="button" onPress={()=>Alert.alert('Privacy Policy','Your location and personal data are only shared during active SOS alerts with registered police stations and nearby drivers.')}/>
        </View>

        <Text style={s.sectionTitle}>DANGER ZONE</Text>
        <View style={s.card}>
          <Row icon="delete" title="Clear Local Data" subtitle="Remove saved photo and voice note" type="button" danger
            onPress={()=>Alert.alert('Clear All Data','This will clear your profile photo and voice note.',[{text:'Cancel',style:'cancel'},{text:'Clear',style:'destructive',onPress:()=>{try{const uid=user?.badgeId||user?.stationId;localStorage.removeItem('tsn_photo_'+uid);localStorage.removeItem('tsn_voice_'+uid);}catch(e){}Alert.alert('Done','Local data cleared.');}}])}
          />
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={()=>{logout();nav('login');}}>
          <MaterialIcons name="logout" size={20} color="#fff"/>
          <Text style={s.logoutTxt}>LOGOUT / DÉCONNEXION</Text>
        </TouchableOpacity>

        <View style={{height:40}}/>
      </ScrollView>

      <View style={s.nav}>
        {(isDriver?[{icon:'dashboard',lbl:'DASHBOARD',to:'driverDashboard'},{icon:'warning',lbl:'ALERTS',to:'emergency'},{icon:'history',lbl:'HISTORY',to:'history'},{icon:'settings',lbl:'SETTINGS',to:'settings'}]:[{icon:'dashboard',lbl:'DASHBOARD',to:'policeDashboard'},{icon:'map',lbl:'LIVE MAP',to:'liveMap'},{icon:'history',lbl:'HISTORY',to:'history'},{icon:'settings',lbl:'SETTINGS',to:'settings'}]).map(({icon,lbl,to})=>(
          <TouchableOpacity key={lbl} style={lbl==='SETTINGS'?s.navActive:s.navItem} onPress={()=>nav(to)}>
            <MaterialIcons name={icon} size={22} color={lbl==='SETTINGS'?'#fff':'#aaa'}/>
            <Text style={lbl==='SETTINGS'?s.navTxtA:s.navTxt}>{lbl}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:'#f5f5f5'},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingVertical:14,backgroundColor:'#fff',borderBottomWidth:1,borderBottomColor:'#eee'},
  headerTitle:{fontSize:15,fontWeight:'900',color:'#111'},
  accountCard:{flexDirection:'row',alignItems:'center',backgroundColor:'#fff',padding:20,marginBottom:4,gap:16,borderBottomWidth:1,borderBottomColor:'#eee'},
  accountAv:{width:64,height:64,borderRadius:32,alignItems:'center',justifyContent:'center'},
  accountName:{fontSize:18,fontWeight:'900',color:'#111',marginBottom:4},
  accountId:{fontSize:12,color:'#888',marginBottom:8},
  rolePill:{flexDirection:'row',alignItems:'center',gap:4,borderRadius:12,paddingHorizontal:12,paddingVertical:4,alignSelf:'flex-start'},
  rolePillTxt:{fontSize:11,fontWeight:'800',color:'#fff'},
  sectionTitle:{fontSize:11,fontWeight:'800',color:'#888',letterSpacing:0.8,paddingHorizontal:16,paddingTop:20,paddingBottom:8},
  card:{backgroundColor:'#fff',borderTopWidth:1,borderBottomWidth:1,borderColor:'#eee'},
  row:{flexDirection:'row',alignItems:'center',paddingHorizontal:16,paddingVertical:14,gap:14},
  rowIcon:{width:36,height:36,borderRadius:10,backgroundColor:'#f5f5f5',alignItems:'center',justifyContent:'center'},
  rowInfo:{flex:1},
  rowTitle:{fontSize:14,fontWeight:'600',color:'#111'},
  rowSub:{fontSize:11,color:'#888',marginTop:2},
  rowVal:{fontSize:13,color:'#888',fontWeight:'600'},
  div:{height:1,backgroundColor:'#f5f5f5',marginLeft:66},
  callPill:{flexDirection:'row',alignItems:'center',gap:4,borderRadius:10,paddingHorizontal:10,paddingVertical:6},
  callPillTxt:{fontSize:11,fontWeight:'800',color:'#fff'},
  logoutBtn:{marginHorizontal:16,marginTop:24,backgroundColor:RED,borderRadius:14,paddingVertical:16,alignItems:'center',flexDirection:'row',justifyContent:'center',gap:8},
  logoutTxt:{fontSize:15,fontWeight:'900',color:'#fff'},
  nav:{flexDirection:'row',backgroundColor:'#fff',borderTopWidth:1,borderTopColor:'#eee',paddingVertical:8},
  navActive:{flex:1,alignItems:'center',backgroundColor:RED,borderRadius:12,paddingVertical:6,marginHorizontal:4},
  navItem:{flex:1,alignItems:'center',paddingVertical:6},
  navTxtA:{fontSize:9,color:'#fff',marginTop:2,fontWeight:'700'},
  navTxt:{fontSize:9,color:'#aaa',marginTop:2},
});