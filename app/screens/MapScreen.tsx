'use client'

import { useEffect, useState } from 'react'
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native'
import MapView, {
  Heatmap,
  Marker,
  Callout,
  type Region,
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
  updateDoc,
  arrayUnion,
  arrayRemove,
  doc,
} from 'firebase/firestore'
import { db } from '../config/firebaseConfig'
import PanicFAB from '../components/PanicFab'
import { useUser } from '../context/UserContext'
import { Modal } from 'react-native'
import { CATEGORIAS } from '../constants/categoriasIncidentes'
import { MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons'

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
  votos_confirmar: string[] // UIDs de usuarios que votaron ✅
  votos_negar: string[] // UIDs de usuarios que votaron 🚫
}

type PuntoDeCalor = {
  latitude: number
  longitude: number
  weight: number
}

const { width, height } = Dimensions.get('window')
const STATUSBAR_HEIGHT = StatusBar.currentHeight || 0

const MapScreen = () => {
  const { user } = useUser()
  const [region, setRegion] = useState<Region | null>(null)
  const [reportes, setReportes] = useState<Reporte[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [puntosAgrupados, setPuntosAgrupados] = useState<PuntoDeCalor[]>([])
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<Reporte[]>([])
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<
    string | null
  >(null)
  const reportesFiltrados = categoriaSeleccionada
    ? reportes.filter((r) => r.categoria === categoriaSeleccionada)
    : reportes
  const [comentarios, setComentarios] = useState<any[]>([])
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [reporteSeleccionado, setReporteSeleccionado] =
    useState<Reporte | null>(null)

  const votar = async (tipo: 'confirmar' | 'negar') => {
    if (!user || !reporteSeleccionado) return

    const ref = doc(db, 'reportes', reporteSeleccionado.id)

    const otros = tipo === 'confirmar' ? 'negar' : 'confirmar'

    await updateDoc(ref, {
      [`votos_${tipo}`]: arrayUnion(user.uid),
      [`votos_${otros}`]: arrayRemove(user.uid), // Evita doble voto
    })

    Alert.alert('Gracias por tu voto')
  }

  const votoUsuario = reporteSeleccionado?.votos_confirmar?.includes(
    user?.uid ?? ''
  )
    ? 'confirmar'
    : reporteSeleccionado?.votos_negar?.includes(user?.uid ?? '')
    ? 'negar'
    : null

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

    const ref = collection(
      db,
      'reportes',
      reporteSeleccionado.id,
      'comentarios'
    )
    const q = query(ref, orderBy('creadoEn', 'desc'))

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setComentarios(data)
    })

    return () => unsub()
  }, [reporteSeleccionado])

  const enviarComentario = async () => {
    if (!nuevoComentario.trim() || !reporteSeleccionado) return

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

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case 'Robo':
        return (
          <MaterialIcons
            name='security'
            size={16}
            color={categoriaSeleccionada === categoria ? '#fff' : '#555'}
          />
        )
      case 'Asalto':
        return (
          <FontAwesome
            name='warning'
            size={16}
            color={categoriaSeleccionada === categoria ? '#fff' : '#555'}
          />
        )
      case 'Acoso':
        return (
          <MaterialIcons
            name='person-pin-circle'
            size={16}
            color={categoriaSeleccionada === categoria ? '#fff' : '#555'}
          />
        )
      default:
        return (
          <Ionicons
            name='alert-circle'
            size={16}
            color={categoriaSeleccionada === categoria ? '#fff' : '#555'}
          />
        )
    }
  }

  if (!region) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size='large' color='#007AFF' />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mapa</Text>
        <Ionicons name='map' size={24} color='#fff' />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipContainer}
        >
          <TouchableOpacity
            style={[
              styles.chip,
              categoriaSeleccionada === null && styles.chipActivo,
            ]}
            onPress={() => setCategoriaSeleccionada(null)}
          >
            <Ionicons
              name='layers'
              size={16}
              color={categoriaSeleccionada === null ? '#fff' : '#555'}
            />
            <Text
              style={[
                styles.chipTexto,
                categoriaSeleccionada === null && styles.chipTextoActivo,
              ]}
            >
              Todos
            </Text>
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
              {getCategoriaIcon(cat)}
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
      </View>

      <View style={styles.mapContainer}>
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

          {/* Marcadores con Callout */}
          {reportesFiltrados.map((reporte) => (
            <Marker
              key={reporte.id}
              coordinate={reporte.coords}
              onPress={() => {
                setReporteSeleccionado(reporte)
                setGrupoSeleccionado([reporte])
                setModalVisible(true)
              }}
              pinColor='#FF3B30'
              opacity={0}
            >
              <Callout tooltip>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{reporte.categoria}</Text>
                  <Text style={styles.calloutText}>
                    {new Date(
                      reporte.fecha instanceof Timestamp
                        ? reporte.fecha.toDate()
                        : reporte.fecha
                    ).toLocaleDateString()}
                  </Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      </View>

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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles del Reporte</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name='close' size={24} color='#555' />
              </TouchableOpacity>
            </View>

            {grupoSeleccionado.map((r) => (
              <View key={r.id} style={styles.reporteCard}>
                <View style={styles.reporteHeader}>
                  <View
                    style={[
                      styles.categoriaBadge,
                      { backgroundColor: getCategoriaColor(r.categoria) },
                    ]}
                  >
                    <Text style={styles.categoriaBadgeText}>{r.categoria}</Text>
                  </View>
                  <Text style={styles.reporteDate}>
                    {new Date(
                      r.fecha instanceof Timestamp ? r.fecha.toDate() : r.fecha
                    ).toLocaleString()}
                  </Text>
                </View>

                {r.descripcion ? (
                  <Text style={styles.reporteDescription}>{r.descripcion}</Text>
                ) : null}

                {r.nombre ? (
                  <View style={styles.reporterInfo}>
                    <Ionicons
                      name='person-circle-outline'
                      size={16}
                      color='#555'
                    />
                    <Text style={styles.reporterName}>{r.nombre}</Text>
                  </View>
                ) : null}
              </View>
            ))}

            <View style={styles.votingSection}>
              <Text style={styles.sectionTitle}>¿Es válido este reporte?</Text>

              <View style={styles.votingButtons}>
                {votoUsuario === null && (
                  <>
                    <TouchableOpacity
                      onPress={() => votar('confirmar')}
                      style={styles.confirmButton}
                    >
                      <Ionicons
                        name='checkmark-circle'
                        size={20}
                        color='#155724'
                      />
                      <Text style={styles.confirmButtonText}>Confirmar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => votar('negar')}
                      style={styles.denyButton}
                    >
                      <Ionicons name='close-circle' size={20} color='#721c24' />
                      <Text style={styles.denyButtonText}>Negar</Text>
                    </TouchableOpacity>
                  </>
                )}

                {votoUsuario === 'confirmar' && (
                  <TouchableOpacity
                    onPress={() => votar('negar')}
                    style={styles.votedButton}
                  >
                    <Ionicons
                      name='checkmark-done-circle'
                      size={20}
                      color='#004085'
                    />
                    <Text style={styles.votedButtonText}>
                      Ya confirmaste (Tocar para cambiar)
                    </Text>
                  </TouchableOpacity>
                )}

                {votoUsuario === 'negar' && (
                  <TouchableOpacity
                    onPress={() => votar('confirmar')}
                    style={styles.votedButton}
                  >
                    <Ionicons name='close-circle' size={20} color='#856404' />
                    <Text style={styles.votedButtonText}>
                      Ya negaste (Tocar para cambiar)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.commentsSection}>
              <Text style={styles.sectionTitle}>Comentarios</Text>

              <ScrollView style={styles.commentsList}>
                {comentarios.length === 0 ? (
                  <Text style={styles.noCommentsText}>
                    No hay comentarios aún
                  </Text>
                ) : (
                  comentarios.map((c) => (
                    <View key={c.id} style={styles.commentItem}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentAuthor}>{c.autor}</Text>
                        <Text style={styles.commentDate}>
                          {new Date(
                            c.creadoEn?.toDate?.() ?? c.creadoEn
                          ).toLocaleString()}
                        </Text>
                      </View>
                      <Text style={styles.commentText}>{c.texto}</Text>
                    </View>
                  ))
                )}
              </ScrollView>

              <View style={styles.commentInputContainer}>
                <TextInput
                  placeholder='Agregar comentario...'
                  value={nuevoComentario}
                  onChangeText={setNuevoComentario}
                  style={styles.commentInput}
                  multiline
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    !nuevoComentario.trim() && styles.sendButtonDisabled,
                  ]}
                  onPress={enviarComentario}
                  disabled={!nuevoComentario.trim()}
                >
                  <Ionicons
                    name='send'
                    size={20}
                    color={nuevoComentario.trim() ? '#fff' : '#ccc'}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const getCategoriaColor = (categoria: string) => {
  switch (categoria) {
    case 'Robo':
      return '#e74c3c'
    case 'Asalto':
      return '#e67e22'
    case 'Acoso':
      return '#9b59b6'
    default:
      return '#3498db'
  }
}

export default MapScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: "#3498db",
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  headerButton: {
    padding: 4,
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
    zIndex: 5,
  },
  chipContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    backgroundColor: '#f1f3f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e1e4e8',
  },
  chipActivo: {
    backgroundColor: '#007AFF',
    borderColor: '#0062cc',
  },
  chipTexto: {
    color: '#555',
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextoActivo: {
    color: '#fff',
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  callout: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    width: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  calloutText: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: height * 0.7, // antes era maxHeight
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    justifyContent: 'space-between',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  reporteCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e4e8',
  },
  reporteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoriaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  categoriaBadgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  reporteDate: {
    fontSize: 12,
    color: '#666',
  },
  reporteDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  reporterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reporterName: {
    fontSize: 13,
    color: '#555',
    fontStyle: 'italic',
  },
  votingSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  votingButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#d4edda',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  confirmButtonText: {
    color: '#155724',
    fontWeight: '500',
  },
  denyButton: {
    flex: 1,
    backgroundColor: '#f8d7da',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  denyButtonText: {
    color: '#721c24',
    fontWeight: '500',
  },
  votedButton: {
    flex: 1,
    backgroundColor: '#e2e3e5',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#d6d8db',
  },
  votedButtonText: {
    color: '#383d41',
    fontWeight: '500',
    fontSize: 12,
  },
  commentsSection: {
    marginTop: 24,
    paddingHorizontal: 20,
    flex: 1,
  },
  commentsList: {
    maxHeight: 200,
  },
  noCommentsText: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
  commentItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f1f3f5',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentAuthor: {
    fontWeight: '600',
    fontSize: 13,
    color: '#333',
  },
  commentDate: {
    fontSize: 11,
    color: '#999',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e1e4e8',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e1e4e8',
  },
})
