import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, Linking, ScrollView } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../services/AuthContext';

const RED=('#d32f2f'),BLUE=('#1565C0'),GREEN=('#2e7d32'),GOLD=('#f5c518');
const BASE_URL=typeof window!=='undefined'&&window.location.hostname!=='localhost'?'https://tsn-backend-53yj.onrender.com':'http://localhost:8000';

function getDistance(lat1,lng1,lat2,lng2){const R=6371,dLat=(lat2-lat1)*Math.PI/180,dLng=(lng2-lng1)*Math.PI/180,a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));}

export default function LiveMapScreen({nav,location}){
  const {user,role}=useAuth();
  const [drivers,setDrivers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [sharing,setSharing]=useState(false);
  const [lastUpdate,setLastUpdate]=useState(null);
  const intervalRef=useRef(null);
  const shareRef=useRef(null);

  useEffect(()=>{
    loadDrivers();
    intervalRef.current=setInterval(loadDrivers,10000);
    return()=>{clearInterval(intervalRef.current);clearInterval(shareRef.current);};
  },[]);

  useEffect(()=>{
    if(sharing&&location){
      shareLiveLocation();
      shareRef.current=setInterval(()=>{if(location)shareLiveLocation();},5000);
    }else{clearInterval(shareRef.current);}
    return()=>clearInterval(shareRef.current);
  },[sharing,location]);

  const loadDrivers=async()=>{
    try{const r=await fetch(BASE_URL+'/api/drivers/live');const d=await r.json();setDrivers(d.drivers||[]);setLastUpdate(new Date().toLocaleTimeString());}
    catch(e){console.log('Load drivers error:',e.message);}
    finally{setLoading(false);}
  };

  const shareLiveLocation=async()=>{
    if(!location||!user)return;
    try{await fetch(BASE_URL+'/api/drivers/live-location',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({driverId:user?.badgeId||user?.stationId||'unknown',driverName:user?.fullName||user?.stationName||'Unknown',lat:location.latitude,lng:location.longitude,speed:location.speed||0,heading:location.heading||0,vehiclePlate:user?.vehiclePlate||'',network:user?.network||'MTN'})});}
    catch(e){}
  };

  const toggleSharing=()=>{
    if(!sharing){setSharing(true);Alert.alert('Location Sharing ON','Your live location is now visible to all TSN drivers and police stations.');}
    else{setSharing(false);Alert.alert('Location Sharing OFF','Your location is no longer being shared.');}
  };

  const activeDrivers=drivers.filter(d=>d.active!==false);
  const myId=user?.badgeId||user?.stationId;

  return(
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={()=>nav(role==='police'?'policeDashboard':'driverDashboard')}>
          <MaterialIcons name="arrow-back" size={24} color={RED}/>
        </TouchableOpacity>
        <View style={{flex:1,marginLeft:10}}>
          <Text style={s.headerTitle}>LIVE DRIVER MAP</Text>
          <Text style={s.headerSub}>{activeDrivers.length} drivers online · Updated {lastUpdate||'—'}</Text>
        </View>
        <TouchableOpacity onPress={loadDrivers}>
          <MaterialIcons name="refresh" size={24} color={GREEN}/>
        </TouchableOpacity>
      </View>

      {/* Share toggle */}
      <TouchableOpacity style={[s.shareBanner,{backgroundColor:sharing?GREEN:'#333'}]} onPress={toggleSharing}>
        <MaterialIcons name={sharing?'location-on':'location-off'} size={18} color="#fff"/>
        <Text style={s.shareTxt}>
          {sharing?'YOUR LOCATION IS BEING SHARED LIVE — Tap to stop':'TAP TO SHARE YOUR LIVE LOCATION with all TSN drivers'}
        </Text>
        <MaterialIcons name={sharing?'toggle-on':'toggle-off'} size={24} color="#fff"/>
      </TouchableOpacity>

      {/* My location */}
      {location&&(
        <View style={s.myLocCard}>
          <View style={{flex:1}}>
            <View style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:4}}>
              <MaterialIcons name="gps-fixed" size={14} color={GREEN}/>
              <Text style={s.myLocTitle}>MY CURRENT LOCATION</Text>
            </View>
            <Text style={s.myLocCoords}>{location.latitude.toFixed(5)}° N,  {location.longitude.toFixed(5)}° E</Text>
            <View style={{flexDirection:'row',alignItems:'center',gap:4,marginTop:4}}>
              <MaterialIcons name={sharing?'wifi-tethering':'wifi-tethering-off'} size={12} color={sharing?GREEN:'#666'}/>
              <Text style={{fontSize:10,color:sharing?GREEN:'#666'}}>Accuracy: ±{Math.round(location.accuracy||10)}m · {sharing?'SHARING LIVE':'NOT SHARING'}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={s.openMapsBtn}
            onPress={()=>Linking.openURL('https://www.google.com/maps?q='+location.latitude+','+location.longitude+'&z=16')}
          >
            <MaterialIcons name="open-in-new" size={16} color="#fff"/>
            <Text style={s.openMapsTxt}>Maps</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={s.fullMapBtn} onPress={()=>location&&Linking.openURL('https://www.google.com/maps/@'+location.latitude+','+location.longitude+',14z')}>
        <MaterialIcons name="map" size={18} color="#fff"/>
        <Text style={s.fullMapBtnTxt}>OPEN FULL LIVE MAP IN GOOGLE MAPS</Text>
        <MaterialIcons name="open-in-new" size={16} color="#fff"/>
      </TouchableOpacity>

      <ScrollView style={s.driverList} showsVerticalScrollIndicator={false}>
        <View style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:10,marginTop:4}}>
          <MaterialIcons name="directions-car" size={16} color="#888"/>
          <Text style={s.sectionTitle}>LIVE DRIVERS ({activeDrivers.length})</Text>
        </View>

        {loading?(
          <View style={{alignItems:'center',padding:40}}><ActivityIndicator size="large" color={RED}/></View>
        ):activeDrivers.length===0?(
          <View style={s.emptyBox}>
            <MaterialIcons name="directions-car" size={48} color="#333"/>
            <Text style={s.emptyTxt}>No drivers sharing location</Text>
            <Text style={s.emptySub}>Enable location sharing above to appear on the map</Text>
          </View>
        ):(
          activeDrivers.map((driver)=>{
            const isMe=driver.driverId===myId;
            const dist=location?getDistance(location.latitude,location.longitude,driver.lat,driver.lng):null;
            return(
              <View key={driver.driverId} style={[s.driverCard,isMe&&s.driverCardMe]}>
                <View style={[s.driverStatus,{backgroundColor:isMe?GOLD:GREEN}]}/>
                <View style={s.driverInfo}>
                  <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:4}}>
                    <MaterialIcons name={isMe?'person':'directions-car'} size={16} color={isMe?GOLD:GREEN}/>
                    <Text style={s.driverName}>{isMe?'YOU — ':''}{driver.driverName}</Text>
                    {isMe&&<View style={s.meBadge}><Text style={s.meBadgeTxt}>ME</Text></View>}
                  </View>
                  <Text style={s.driverId}>{driver.driverId}</Text>
                  {driver.vehiclePlate&&<Text style={s.driverPlate}>{driver.vehiclePlate}</Text>}
                  <View style={{flexDirection:'row',alignItems:'center',gap:4}}>
                    <MaterialIcons name="location-on" size={12} color={GREEN}/>
                    <Text style={s.driverCoords}>{driver.lat?.toFixed(4)}° N, {driver.lng?.toFixed(4)}° E</Text>
                  </View>
                  {dist!==null&&(
                    <View style={{flexDirection:'row',alignItems:'center',gap:4}}>
                      <MaterialIcons name="social-distance" size={12} color={BLUE}/>
                      <Text style={s.driverDist}>{dist<1?Math.round(dist*1000)+'m':dist.toFixed(1)+'km'} away</Text>
                    </View>
                  )}
                  <View style={{flexDirection:'row',alignItems:'center',gap:4,marginTop:2}}>
                    <MaterialIcons name="access-time" size={11} color="#666"/>
                    <Text style={s.driverTime}>Last seen: {new Date(driver.lastSeen).toLocaleTimeString()}</Text>
                    {driver.speed>0&&<><MaterialIcons name="speed" size={11} color="#666"/><Text style={s.driverTime}>{Math.round(driver.speed)}km/h</Text></>}
                  </View>
                </View>
                <TouchableOpacity style={s.mapPin} onPress={()=>Linking.openURL('https://www.google.com/maps?q='+driver.lat+','+driver.lng)}>
                  <MaterialIcons name="open-in-new" size={18} color="#fff"/>
                  <Text style={s.mapPinTxt}>View</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
        <View style={{height:30}}/>
      </ScrollView>

      <View style={s.nav}>
        {(role==='driver'?[{icon:'dashboard',lbl:'DASHBOARD',to:'driverDashboard'},{icon:'warning',lbl:'ALERTS',to:'emergency'},{icon:'map',lbl:'MAP',to:'liveMap'},{icon:'chat',lbl:'CHAT',to:'chatBoard'}]:[{icon:'dashboard',lbl:'DASHBOARD',to:'policeDashboard'},{icon:'warning',lbl:'ALERTS',to:'policeDashboard'},{icon:'map',lbl:'MAP',to:'liveMap'},{icon:'chat',lbl:'CHAT',to:'chatBoard'}]).map(({icon,lbl,to})=>(
          <TouchableOpacity key={lbl} style={lbl==='MAP'?s.navActive:s.navItem} onPress={()=>nav(to)}>
            <MaterialIcons name={icon} size={22} color={lbl==='MAP'?'#fff':'#666'}/>
            <Text style={lbl==='MAP'?s.navTxtA:s.navTxt}>{lbl}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:'#0d0d0d'},
  header:{flexDirection:'row',alignItems:'center',paddingHorizontal:16,paddingVertical:14,backgroundColor:'#111',borderBottomWidth:1,borderBottomColor:'#222'},
  headerTitle:{fontSize:16,fontWeight:'800',color:'#fff'},
  headerSub:{fontSize:10,color:'#888',marginTop:1},
  shareBanner:{flexDirection:'row',alignItems:'center',paddingHorizontal:16,paddingVertical:14,gap:10},
  shareTxt:{flex:1,fontSize:12,fontWeight:'700',color:'#fff'},
  myLocCard:{flexDirection:'row',alignItems:'center',backgroundColor:'#111',margin:12,borderRadius:14,padding:14,borderWidth:1,borderColor:'#222'},
  myLocTitle:{fontSize:11,fontWeight:'800',color:GREEN},
  myLocCoords:{fontSize:13,fontWeight:'900',color:'#fff',fontFamily:'monospace'},
  openMapsBtn:{backgroundColor:BLUE,borderRadius:12,padding:12,alignItems:'center',marginLeft:12,flexDirection:'row',gap:4},
  openMapsTxt:{fontSize:10,color:'#fff',fontWeight:'700'},
  fullMapBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:BLUE,marginHorizontal:12,marginBottom:8,borderRadius:12,paddingVertical:13},
  fullMapBtnTxt:{fontSize:12,fontWeight:'800',color:'#fff'},
  driverList:{flex:1,paddingHorizontal:12},
  sectionTitle:{fontSize:12,fontWeight:'800',color:'#888'},
  emptyBox:{alignItems:'center',paddingVertical:50,gap:10},
  emptyTxt:{fontSize:16,fontWeight:'700',color:'#555'},
  emptySub:{fontSize:12,color:'#444',textAlign:'center'},
  driverCard:{backgroundColor:'#111',borderRadius:14,padding:14,marginBottom:10,flexDirection:'row',alignItems:'flex-start',borderWidth:1,borderColor:'#222'},
  driverCardMe:{borderColor:GOLD,backgroundColor:'#1a1500'},
  driverStatus:{width:10,height:10,borderRadius:5,marginTop:4,marginRight:12},
  driverInfo:{flex:1},
  driverName:{fontSize:14,fontWeight:'800',color:'#fff'},
  meBadge:{backgroundColor:GOLD,borderRadius:6,paddingHorizontal:8,paddingVertical:2},
  meBadgeTxt:{fontSize:9,fontWeight:'900',color:'#111'},
  driverId:{fontSize:11,color:'#888',marginBottom:2},
  driverPlate:{fontSize:11,color:'#aaa',marginBottom:2},
  driverCoords:{fontSize:11,color:GREEN,fontFamily:'monospace'},
  driverDist:{fontSize:11,color:BLUE,fontWeight:'700'},
  driverTime:{fontSize:10,color:'#666'},
  mapPin:{backgroundColor:BLUE,borderRadius:10,padding:10,alignItems:'center',marginLeft:10,gap:4},
  mapPinTxt:{fontSize:9,color:'#fff',fontWeight:'700'},
  nav:{flexDirection:'row',backgroundColor:'#111',borderTopWidth:1,borderTopColor:'#222',paddingVertical:10},
  navActive:{flex:1,alignItems:'center',backgroundColor:RED,borderRadius:12,paddingVertical:6,marginHorizontal:4},
  navItem:{flex:1,alignItems:'center',paddingVertical:6},
  navTxtA:{fontSize:9,color:'#fff',marginTop:2,fontWeight:'700'},
  navTxt:{fontSize:9,color:'#666',marginTop:2},
});