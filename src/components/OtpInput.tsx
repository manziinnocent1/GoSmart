import React, { useRef } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing } from "../theme";

interface Props {
  value: string;
  length?: number;
  onChange: (value: string) => void;
}

export function OtpInput({ value, length = 4, onChange }: Props) {
  const inputRef = useRef<TextInput>(null);

  return (
    <Pressable style={styles.row} onPress={() => inputRef.current?.focus()}>
      {Array.from({ length }, (_, i) => {
        const filled = Boolean(value[i]);
        const active = i === value.length;
        return (
          <View
            key={i}
            style={[
              styles.cell,
              filled && styles.filled,
              active && styles.active,
            ]}
          >
            <Text style={styles.digit}>{value[i] ?? ""}</Text>
            {active && <View style={styles.caret} />}
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        autoFocus
        value={value}
        maxLength={length}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        onChangeText={(t) => onChange(t.replace(/\D/g, ""))}
        style={styles.hidden}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.md },
  cell: {
    flex: 1,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.blueMist,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  filled: { backgroundColor: colors.ink },
  active: { borderColor: colors.blue, backgroundColor: colors.white },
  digit: { fontSize: 30, fontWeight: "800", color: colors.white },
  caret: {
    position: "absolute",
    width: 2,
    height: 30,
    backgroundColor: colors.blue,
  },
  hidden: { position: "absolute", opacity: 0, width: 1, height: 1 },
});
