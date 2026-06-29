import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, RefreshControl, Linking } from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '../services/Icon';

import { useAuth } from '../services/AuthContext';

const RED=('#d32f2f'),BLUE=('#1565C0'),GREEN=('#2e7d32'),GOLD=('#f5c518');
const BASE_URL=typeof window!=='undefined'&&window.location.hostname!=='localhost'?'https://tsn-backend-53yj.onrender.com':'http://localhost:8000';
const ALERT_CFG={robbery:{icon:'warning',label:'ROBBERY',color:RED},assault:{icon:'personal-injury',label:'ASSAULT',color:'#e65100'},accident:{icon:'car-crash',label:'ACCIDENT',color:BLUE},medical:{icon:'medical-services',label:'MEDICAL',color:'#827717'},theft:{icon:'security',label:'THEFT',color:'#6a1b9a'},sos:{icon:'sos',label:'SOS',color:RED}};
const fmt=(ts)=>{if(!ts)return'—';const d=new Date(ts),diff=Math.floor((Date.now()-d)/60000);if(diff<60)return diff+'m ago';if(diff<1440)return Math.floor(diff/60)+'h ago';return d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})+' '+d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});};

export default function HistoryScreen({nav}){
  const {user,role}=useAuth();
  const [alerts,setAlerts]=useState([]);
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [tab,setTab]=useState('all');
  const [error,setError]=useState(null);
  const isDriver=role==='driver';

  useEffect(()=>{loadHistory();},[]);

  const loadHistory=async()=>{
    try{
      setError(null);
      let all=[];
      try{const r=await fetch(BASE_URL+'/api/alerts/history');const d=await r.json();all=d.alerts||[];}
      catch(e){const r=await fetch(BASE_URL+'/api/alerts');const d=await r.json();all=d.alerts||[];}
      setAlerts(all);
      if(all.length===0)setError('No alerts found. Trigger some SOS alerts to see them here.');
    }catch(e){setError('Could not load history. Check your connection.');}
    finally{setLoading(false);setRefreshing(false);}
  };

  const mine=alerts.filter(a=>a.driverId===user?.badgeId);
  const resolved=alerts.filter(a=>a.status==='resolved');
  const active=alerts.filter(a=>a.status!=='resolved');
  const displayed=tab==='mine'?mine:tab==='resolved'?resolved:tab==='active'?active:alerts;

  return(
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={()=>nav(isDriver?'driverDashboard':'policeDashboard')}>
          <MaterialIcons name="arrow-back" size={24} color={RED}/>
        </TouchableOpacity>
        <View style={{flexDirection:'row',alignItems:'center',gap:8,flex:1,justifyContent:'center'}}>
          <MaterialIcons name="history" size={22} color="#111"/>
          <Text style={s.headerTitle}>ALERT HISTORY</Text>
        </View>
        <TouchableOpacity onPress={()=>{setRefreshing(true);loadHistory();}}>
          <MaterialIcons name="refresh" size={24} color={GREEN}/>
        </TouchableOpacity>
      </View>

      <View style={s.statsRow}>
        {[[alerts.length,'TOTAL',BLUE,'list'],[active.length,'ACTIVE',RED,'notifications-active'],[resolved.length,'RESOLVED',GREEN,'check-circle'],[mine.length,'MINE',GOLD,'person']].map(([num,lbl,col,icon],i)=>(
          <View key={i} style={[s.stat,{borderBottomColor:col}]}>
            <MaterialIcons name={icon} size={16} color={col}/>
            <Text style={[s.statNum,{color:col}]}>{num}</Text>
            <Text style={s.statLbl}>{lbl}</Text>
          </View>
        ))}
      </View>

      <View style={s.tabs}>
        {[{key:'all',label:'All',icon:'list'},{key:'active',label:'Active',icon:'warning'},{key:'resolved',label:'Resolved',icon:'check-circle'},{key:'mine',label:'Mine',icon:'person'}].map(({key,label,icon})=>(
          <TouchableOpacity key={key} style={[s.tab,tab===key&&s.tabOn]} onPress={()=>setTab(key)}>
            <MaterialIcons name={icon} size={14} color={tab===key?'#fff':'#666'}/>
            <Text style={[s.tabTxt,tab===key&&s.tabTxtOn]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading?(
        <View style={s.loadBox}><ActivityIndicator size="large" color={RED}/><Text style={{color:'#888',marginTop:12}}>Loading alert history...</Text></View>
      ):(
        <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);loadHistory();}} tintColor={RED}/>}>
          {error&&(
            <View style={s.errorBox}>
              <MaterialIcons name="history" size={52} color="#555"/>
              <Text style={s.errorTxt}>{error}</Text>
              <TouchableOpacity style={s.retryBtn} onPress={()=>{setLoading(true);loadHistory();}}>
                <MaterialIcons name="refresh" size={18} color="#fff"/>
                <Text style={s.retryTxt}>RETRY</Text>
              </TouchableOpacity>
            </View>
          )}
          {!error&&displayed.length===0&&(
            <View style={s.emptyBox}>
              <MaterialIcons name="inbox" size={48} color="#555"/>
              <Text style={s.emptyTxt}>No alerts in this category</Text>
              <Text style={s.emptySub}>Try a different tab or pull down to refresh</Text>
            </View>
          )}
          {displayed.map((alert)=>{
            const alertId=alert._id||alert.id;
            const cfg=ALERT_CFG[alert.alertType]||ALERT_CFG.sos;
            const lat=alert.location?.lat,lng=alert.location?.lng;
            const isResolved=alert.status==='resolved';
            const isMe=alert.driverId===user?.badgeId;
            return(
              <View key={alertId} style={[s.alertCard,{borderLeftColor:cfg.color},isResolved&&{opacity:0.85}]}>
                <View style={s.alertTop}>
                  <View style={[s.typeBadge,{backgroundColor:cfg.color}]}>
                    <MaterialIcons name={cfg.icon} size={13} color="#fff"/>
                    <Text style={s.typeTxt}>{cfg.label}</Text>
                  </View>
                  <View style={[s.statusBadge,{backgroundColor:isResolved?GREEN:RED}]}>
                    <MaterialIcons name={isResolved?'check-circle':'warning'} size={11} color="#fff"/>
                    <Text style={s.statusTxt}>{isResolved?'RESOLVED':'ACTIVE'}</Text>
                  </View>
                  {isMe&&<View style={s.meBadge}><MaterialIcons name="person" size={11} color="#111"/><Text style={s.meTxt}>MINE</Text></View>}
                </View>
                <View style={{flexDirection:'row',alignItems:'center',gap:4,marginBottom:4}}>
                  <MaterialIcons name="access-time" size={13} color="#555"/>
                  <Text style={s.alertTime}>{fmt(alert.timestamp||alert.createdAt)}</Text>
                </View>
                {isResolved&&alert.resolvedAt&&<View style={{flexDirection:'row',alignItems:'center',gap:4,marginBottom:4}}><MaterialIcons name="check-circle" size={13} color={GREEN}/><Text style={[s.alertTime,{color:GREEN}]}>Resolved: {fmt(alert.resolvedAt)}</Text></View>}
                <TouchableOpacity onPress={()=>lat&&Linking.openURL('https://maps.google.com?q='+lat+','+lng)} style={{flexDirection:'row',alignItems:'center',gap:4,marginBottom:8}}>
                  <MaterialIcons name="location-on" size={14} color={BLUE}/>
                  <Text style={s.alertLoc}>{alert.location?.address||(lat?parseFloat(lat).toFixed(4)+'° N, '+parseFloat(lng).toFixed(4)+'° E':'Location not recorded')}{lat?'  → tap to open':''}</Text>
                </TouchableOpacity>
                <View style={s.driverRow}>
                  <MaterialIcons name="person" size={16} color="#888"/>
                  <Text style={s.driverInfo}>{alert.driverName||'—'}  ·  {alert.driverId||'—'}{alert.vehiclePlate?'  ·  '+alert.vehiclePlate:''}{alert.network?'  ·  '+alert.network:''}</Text>
                </View>
                <View style={{flexDirection:'row',alignItems:'center',gap:4,marginTop:6}}>
                  <MaterialIcons name={alert.hasVoiceNote?'mic':'mic-off'} size={12} color={alert.hasVoiceNote?GREEN:'#aaa'}/>
                  <Text style={{fontSize:10,color:'#aaa'}}>Triggered: {alert.triggerMethod||'manual'}{alert.hasVoiceNote?'  ·  Voice note':''}</Text>
                </View>
              </View>
            );
          })}
          <View style={{height:30}}/>
        </ScrollView>
      )}

      <View style={s.nav}>
        {(isDriver?[{icon:'dashboard',lbl:'DASHBOARD',to:'driverDashboard'},{icon:'warning',lbl:'ALERTS',to:'emergency'},{icon:'history',lbl:'HISTORY',to:'history'},{icon:'settings',lbl:'SETTINGS',to:'settings'}]:[{icon:'dashboard',lbl:'DASHBOARD',to:'policeDashboard'},{icon:'map',lbl:'LIVE MAP',to:'liveMap'},{icon:'history',lbl:'HISTORY',to:'history'},{icon:'settings',lbl:'SETTINGS',to:'settings'}]).map(({icon,lbl,to})=>(
          <TouchableOpacity key={lbl} style={lbl==='HISTORY'?s.navActive:s.navItem} onPress={()=>nav(to)}>
            <MaterialIcons name={icon} size={22} color={lbl==='HISTORY'?'#fff':'#aaa'}/>
            <Text style={lbl==='HISTORY'?s.navTxtA:s.navTxt}>{lbl}</Text>
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
  statsRow:{flexDirection:'row',backgroundColor:'#fff',borderBottomWidth:1,borderBottomColor:'#eee'},
  stat:{flex:1,alignItems:'center',paddingVertical:12,borderBottomWidth:3,gap:2},
  statNum:{fontSize:20,fontWeight:'900'},
  statLbl:{fontSize:9,color:'#888',textAlign:'center',fontWeight:'600'},
  tabs:{flexDirection:'row',backgroundColor:'#fff',paddingHorizontal:8,paddingVertical:8,gap:6,borderBottomWidth:1,borderBottomColor:'#eee'},
  tab:{flex:1,backgroundColor:'#f0f0f0',borderRadius:8,paddingVertical:8,alignItems:'center',flexDirection:'row',justifyContent:'center',gap:4},
  tabOn:{backgroundColor:RED},
  tabTxt:{fontSize:10,fontWeight:'700',color:'#666'},
  tabTxtOn:{color:'#fff'},
  loadBox:{flex:1,alignItems:'center',justifyContent:'center',paddingTop:80},
  errorBox:{alignItems:'center',paddingVertical:50,paddingHorizontal:30,gap:12},
  errorTxt:{fontSize:14,color:'#888',textAlign:'center',lineHeight:22},
  retryBtn:{backgroundColor:RED,borderRadius:12,paddingHorizontal:24,paddingVertical:12,flexDirection:'row',alignItems:'center',gap:8},
  retryTxt:{fontSize:14,fontWeight:'800',color:'#fff'},
  emptyBox:{alignItems:'center',paddingVertical:60,gap:8},
  emptyTxt:{fontSize:16,fontWeight:'700',color:'#555'},
  emptySub:{fontSize:12,color:'#888',textAlign:'center'},
  alertCard:{backgroundColor:'#fff',marginHorizontal:14,marginTop:10,borderRadius:14,padding:14,borderLeftWidth:4,elevation:1},
  alertTop:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:8,flexWrap:'wrap'},
  typeBadge:{flexDirection:'row',alignItems:'center',gap:4,borderRadius:8,paddingHorizontal:10,paddingVertical:4},
  typeTxt:{fontSize:11,fontWeight:'800',color:'#fff'},
  statusBadge:{flexDirection:'row',alignItems:'center',gap:3,borderRadius:8,paddingHorizontal:8,paddingVertical:4},
  statusTxt:{fontSize:10,fontWeight:'800',color:'#fff'},
  meBadge:{flexDirection:'row',alignItems:'center',gap:3,backgroundColor:GOLD,borderRadius:8,paddingHorizontal:8,paddingVertical:4},
  meTxt:{fontSize:10,fontWeight:'800',color:'#111'},
  alertTime:{fontSize:12,color:'#555',fontWeight:'600'},
  alertLoc:{fontSize:13,fontWeight:'700',color:BLUE,flex:1},
  driverRow:{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:'#f9f9f9',borderRadius:8,padding:8,marginBottom:2},
  driverInfo:{fontSize:12,color:'#333',fontWeight:'600',flex:1},
  nav:{flexDirection:'row',backgroundColor:'#fff',borderTopWidth:1,borderTopColor:'#eee',paddingVertical:8},
  navActive:{flex:1,alignItems:'center',backgroundColor:RED,borderRadius:12,paddingVertical:6,marginHorizontal:4},
  navItem:{flex:1,alignItems:'center',paddingVertical:6},
  navTxtA:{fontSize:9,color:'#fff',marginTop:2,fontWeight:'700'},
  navTxt:{fontSize:9,color:'#aaa',marginTop:2},
});