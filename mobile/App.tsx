import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { BracketCanvas } from './src/widgets/bracket/BracketCanvas';
import { sampleBracket } from './src/entities/bracket/sample';

export default function App() {
  // меряем реальную область канваса (onLayout), а не windowHeight-96 — иначе
  // View вылезает за низ и оверлей с кнопками уходит под системную панель
  const [canvas, setCanvas] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) =>
    setCanvas({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>{sampleBracket.title}</Text>
        <Text style={styles.sub}>Сетка · тяните, щипайте или кнопки ± для зума</Text>
      </View>
      <View style={styles.canvas} onLayout={onLayout}>
        {canvas.h > 0 && (
          <BracketCanvas bracket={sampleBracket} width={canvas.w} height={canvas.h} />
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b1120' },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  title: { color: '#eef2fb', fontSize: 20, fontWeight: '800' },
  sub: { color: '#8b95a9', fontSize: 12.5, marginTop: 3 },
  canvas: { flex: 1 },
});
