import React, { useEffect, useState } from 'react'
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Button,
} from 'react-native'
import MapView, {
  Heatmap,
  Marker,
  Callout,
  Region,
  PROVIDER_GOOGLE,
} from 'react-native-maps'
import * as Location from 'expo-location'
import {
  collection,
  getDocs,
  Timestamp,
  onSnapshot,
  query,
  orderBy,
  addDoc,
} from 'firebase/firestore'
import { db } from '../config/firebaseConfig'
import PanicFAB from '../components/PanicFab'
import { useUser } from '../context/UserContext'
import { Modal, Pressable } from 'react-native' // ya lo usás en otros componentes
import { CATEGORIAS } from '../constants/categoriasIncidentes'
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';


type Reporte = {
  id: string
  categoria: string
  descripcion?: string
  nombre?: string
  fecha: Timestamp | Date
  coords: {
    latitude: number
    longitude: number
  }
}

type PuntoDeCalor = {
  latitude: number
  longitude: number
  weight: number
}

const MapScreen = () => {
  const { user } = useUser()
  const [region, setRegion] = useState<Region | null>(null)
  const [reportes, setReportes] = useState<Reporte[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [puntosAgrupados, setPuntosAgrupados] = useState<PuntoDeCalor[]>([])
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<Reporte[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<
    string | null
  >(null)
  const reportesFiltrados = categoriaSeleccionada
    ? reportes.filter((r) => r.categoria === categoriaSeleccionada)
    : reportes
  const [comentarios, setComentarios] = useState<any[]>([])
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [reporteSeleccionado, setReporteSeleccionado] = useState<Reporte | null>(null)


  useEffect(() => {
    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Permiso denegado',
          'Se necesita permiso para acceder a la ubicación.'
        )
        return
      }

      const location = await Location.getCurrentPositionAsync({})
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      })

      await cargarReportes()
    })()
  }, [])

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'reportes'), (snapshot) => {
      const data: Reporte[] = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Reporte))
        .filter((r) => r.coords?.latitude && r.coords?.longitude)

      setReportes(data)
    })

    return unsubscribe
  }, [])

  const cargarReportes = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'reportes'))
      const data: Reporte[] = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Reporte))
        .filter((r) => r.coords?.latitude && r.coords?.longitude)

      setReportes(data)
      const agrupados = agruparReportes(data)
      setPuntosAgrupados(agrupados)
    } catch (e) {
      console.error('Error al cargar reportes:', e)
    }
  }

  useEffect(() => {
    if (!reporteSeleccionado) return

    const ref = collection(db, 'reportes', reporteSeleccionado.id, 'comentarios')
    const q = query(ref, orderBy('creadoEn', 'desc'))

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setComentarios(data)
    })

    return () => unsub()
  }, [reporteSeleccionado])

  const enviarComentario = async () => {
    if ( !nuevoComentario.trim() || !reporteSeleccionado  ) return

    const ref = collection(
      db,
      'reportes',
      reporteSeleccionado.id,
      'comentarios'
    )
    await addDoc(ref, {
      texto: nuevoComentario,
      autor: user?.nombre || 'Anónimo',
      creadoEn: new Date(),
    })
    setNuevoComentario('')
  }

  const agruparReportes = (
    reportes: Reporte[],
    precision = 4
  ): PuntoDeCalor[] => {
    const mapa: Record<string, PuntoDeCalor> = {}

    reportes.forEach((r) => {
      const lat = Number(r.coords.latitude.toFixed(precision))
      const lng = Number(r.coords.longitude.toFixed(precision))
      const key = `${lat},${lng}`
      if (!mapa[key]) {
        mapa[key] = { latitude: lat, longitude: lng, weight: 0 }
      }
      mapa[key].weight += 1
    })

    return Object.values(mapa)
  }

  if (!region) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size='large' color='#007AFF' />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.slider}
      >
        <TouchableOpacity
          style={[
            styles.chip,
            categoriaSeleccionada === null && styles.chipActivo,
          ]}
          onPress={() => setCategoriaSeleccionada(null)}
        >
          <Text style={styles.chipTexto}>Todos</Text>
        </TouchableOpacity>

        {CATEGORIAS.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.chip,
              categoriaSeleccionada === cat && styles.chipActivo,
            ]}
            onPress={() => setCategoriaSeleccionada(cat)}
          >
            <Text
              style={[
                styles.chipTexto,
                categoriaSeleccionada === cat && styles.chipTextoActivo,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <MapView
        style={styles.map}
        showsUserLocation={true}
        initialRegion={region}
        provider={PROVIDER_GOOGLE}
      >
        {/* Heatmap */}
        {reportesFiltrados.length > 0 && (
          <Heatmap
            points={reportesFiltrados.map((r) => ({
              latitude: r.coords.latitude,
              longitude: r.coords.longitude,
              weight: 1,
            }))}
            radius={20}
            opacity={0.7}
            gradient={{
              colors: ['#00f', '#0ff', '#0f0', '#ff0', '#f00'],
              startPoints: [0.01, 0.25, 0.5, 0.75, 1],
              colorMapSize: 256,
            }}
          />
        )}

        {/* Marcadores invisibles con Callout */}
        {reportesFiltrados.map((reporte) => (
          <Marker
            key={reporte.id}
            coordinate={reporte.coords}
            onPress={() => {
              setReporteSeleccionado(reporte)
              setGrupoSeleccionado([reporte])
              setModalVisible(true)
            }}
            opacity={0}
          ></Marker>
        ))}
      </MapView>
      {/* Banner fijo abajo */}
      <BannerAd
        unitId={TestIds.BANNER}
        size={BannerAdSize.BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdFailedToLoad={(error) => {
          console.log('Ad load error:', error);
        }}
      />

      {user && (
        <PanicFAB zona={user.zona} user={{ id: user.uid, name: user.nombre }} />
      )}
      <Modal
        animationType='slide'
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              Reportes en esta zona
            </Text>

            {grupoSeleccionado.map((r) => (
              <View key={r.id} style={{ marginBottom: 10 }}>
                <Text style={{ fontWeight: 'bold' }}>{r.categoria}</Text>
                {r.descripcion ? <Text>{r.descripcion}</Text> : null}
                {r.nombre ? <Text>Reportado por: {r.nombre}</Text> : null}
                <Text style={{ fontSize: 12, color: '#666' }}>
                  {new Date(
                    r.fecha instanceof Timestamp ? r.fecha.toDate() : r.fecha
                  ).toLocaleString()}
                </Text>
              </View>
            ))}

            <Pressable
              style={styles.cerrarBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Cerrar</Text>
            </Pressable>
            <Text style={{ fontWeight: 'bold', marginTop: 16 }}>Comentarios</Text>

        {comentarios.map((c) => (
          <View key={c.id} style={{ marginTop: 8 }}>
            <Text style={{ fontWeight: '600' }}>{c.autor}</Text>
            <Text style={{ color: '#333' }}>{c.texto}</Text>
            <Text style={{ fontSize: 11, color: '#999' }}>
              {new Date(c.creadoEn?.toDate?.() ?? c.creadoEn).toLocaleString()}
            </Text>
          </View>
        ))}

        <TextInput
          placeholder='Agregar comentario...'
          value={nuevoComentario}
          onChangeText={setNuevoComentario}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            padding: 8,
            marginTop: 12,
            borderRadius: 8,
          }}
        />

        <Button title='Enviar comentario' onPress={enviarComentario} />
          </View>
        </View>
      </Modal>
    </View>
  )
}

export default MapScreen

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callout: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    maxWidth: 220,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  calloutText: {
    fontSize: 14,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '85%',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 6,
    color: '#333',
  },
  cerrarBtn: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  slider: {
    position: 'absolute',
    top: 20,
    left: 10,
    right: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    flexDirection: 'row',
    elevation: 5, // sombra en Android
    shadowColor: '#000', // sombra en iOS
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    zIndex: 999,
  },

  chip: {
    backgroundColor: '#eee',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    height: 30,
  },
  chipActivo: {
    backgroundColor: '#007AFF',
  },
  chipTexto: {
    color: '#444',
  },
  chipTextoActivo: {
    color: '#fff',
    fontWeight: 'bold',
  },
})
