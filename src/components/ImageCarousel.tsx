import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { radius, spacing } from "../theme";

interface Props {
  images: ImageSourcePropType[];
  height: number;
  autoPlayMs?: number;
}

const GAP = 12;

/** Horizontal, snap-to-card photo strip that advances on its own until the user swipes. */
export function ImageCarousel({ images, height, autoPlayMs = 3500 }: Props) {
  const { width } = useWindowDimensions();
  const cardWidth = width * 0.62;
  const step = cardWidth + GAP;
  const listRef = useRef<FlatList<ImageSourcePropType>>(null);
  const current = useRef(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay || images.length < 2) return;
    const id = setInterval(() => {
      current.current = (current.current + 1) % images.length;
      listRef.current?.scrollToOffset({
        offset: current.current * step,
        animated: true,
      });
    }, autoPlayMs);
    return () => clearInterval(id);
  }, [autoPlay, images.length, step, autoPlayMs]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    current.current = Math.round(e.nativeEvent.contentOffset.x / step);
    setAutoPlay(true);
  };

  return (
    <FlatList
      ref={listRef}
      data={images}
      horizontal
      keyExtractor={(_, i) => String(i)}
      showsHorizontalScrollIndicator={false}
      snapToInterval={step}
      snapToAlignment="start"
      decelerationRate="fast"
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
      onScrollBeginDrag={() => setAutoPlay(false)}
      onMomentumScrollEnd={onScrollEnd}
      renderItem={({ item }) => (
        <Image
          source={item}
          style={[styles.card, { width: cardWidth, height }]}
          resizeMode="cover"
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.xl },
  card: { borderRadius: radius.lg, backgroundColor: "#E8EEFF" },
});
