import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";

const overlayRatio = idType => {
  switch (idType) {
    case "passport":
      return 0.8;
    case "barcode":
      return 0.4;
    default:
      return 0.63;
  }
};

export const overlayDimensions = idType => {
  const { width: screenWidth } = Dimensions.get("window");
  const ratio = overlayRatio(idType);
  const width = screenWidth * 0.9;
  return { width, height: width * ratio };
};

const targetStyle = ({ top, left }) => {
  return {
    borderColor: "#fff",
    width: 25,
    height: 25,
    ...(top
      ? { borderTopWidth: 2, alignSelf: "flex-start" }
      : { borderBottomWidth: 2, alignSelf: "flex-end" }),
    ...(left ? { borderLeftWidth: 2 } : { borderRightWidth: 2 })
  };
};

const Overlay = ({ idType }) => {
  const stylesheet = overlayStyles(idType);
  return (
    <View style={styles.overlayContainer}>
      <View style={stylesheet.outerOverlay} />
      <View style={stylesheet.innerOverlay}>
        <View style={styles.overlayTargetRow}>
          <View style={targetStyle({ top: true, left: true })} />
          <View style={targetStyle({ top: true, left: false })} />
        </View>
        <View style={styles.overlayTargetRow}>
          <View style={targetStyle({ top: false, left: true })} />
          <View style={targetStyle({ top: false, left: false })} />
        </View>
      </View>
    </View>
  );
};

const overlayStyles = idType => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const { width, height } = overlayDimensions(idType);
  const borderWidthY = (screenHeight - height) / 2;
  const borderWidthX = (screenWidth - width) / 2;
  return StyleSheet.create({
    outerOverlay: {
      alignSelf: "center",
      borderColor: "rgba(0, 0, 0, 0.5)",
      borderStyle: "solid",
      borderLeftWidth: borderWidthX,
      borderRightWidth: borderWidthX,
      borderTopWidth: borderWidthY,
      borderBottomWidth: borderWidthY,
      width: width + borderWidthX * 2,
      height: height + borderWidthY * 2,
      position: "absolute",
      left: 0,
      top: 0
    },
    innerOverlay: {
      width,
      height,
      position: "absolute",
      left: (screenWidth - width) / 2,
      top: (screenHeight - height) / 2,
      flexDirection: "column"
    }
  });
};

const styles = StyleSheet.create({
  overlayContainer: { flex: 1 },
  overlayTargetRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between"
  }
});

export default Overlay;
