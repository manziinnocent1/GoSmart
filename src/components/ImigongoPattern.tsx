import React from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../theme";

interface Props {
  columns?: number;
  rows?: number;
  cellSize?: number;
}

const SCALES = [1, 0.68, 0.36];

/** Nested-diamond tiling inspired by Imigongo, the traditional Rwandan geometric art. */
export function ImigongoPattern({
  columns = 5,
  rows = 3,
  cellSize = 74,
}: Props) {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        width: columns * cellSize,
      }}
    >
      {Array.from({ length: columns * rows }, (_, i) => {
        const dark = (Math.floor(i / columns) + (i % columns)) % 2 === 0;
        return (
          <View key={i} style={{ width: cellSize, height: cellSize }}>
            {SCALES.map((scale, layer) => {
              const size = cellSize * 0.7 * scale;
              return (
                <View
                  key={layer}
                  style={[
                    styles.diamond,
                    {
                      width: size,
                      height: size,
                      left: (cellSize - size) / 2,
                      top: (cellSize - size) / 2,
                      backgroundColor:
                        layer % 2 === 0
                          ? dark
                            ? colors.ink
                            : colors.white
                          : colors.blue,
                    },
                  ]}
                />
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  diamond: { position: "absolute", transform: [{ rotate: "45deg" }] },
});
