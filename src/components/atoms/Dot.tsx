import { View } from "react-native";

interface Props {
  color: string;
  size?: number;
  bordered?: boolean;
}

export function Dot({ color, size = 10, bordered = false }: Props) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        ...(bordered && { borderWidth: 2, borderColor: "#fff" }),
      }}
    />
  );
}
