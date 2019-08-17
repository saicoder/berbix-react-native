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

const Overlay = ({ idType }) => {
  const stylesheet = overlayStyles(idType);
  return (
    <View style={styles.overlayContainer}>
      <View style={stylesheet.outerOverlay} />
      <View style={stylesheet.innerOverlay} />
    </View>
  );
};

const overlayStyles = idType => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const { width, height } = overlayDimensions(idType);
  return StyleSheet.create({
    outerOverlay: {
      alignSelf: "center",
      borderColor: "rgba(0, 0, 0, 0.5)",
      borderStyle: "solid",
      borderRadius: 510,
      borderWidth: 500,
      width: width + 1000,
      height: height + 1000,
      position: "absolute",
      left: (screenWidth - width) / 2 - 500,
      top: (screenHeight - height) / 2 - 500
    },
    innerOverlay: {
      alignSelf: "center",
      borderColor: "rgba(255, 255, 255, 0.6)",
      borderStyle: "solid",
      borderWidth: 5,
      borderRadius: 10,
      width: width,
      height: height,
      position: "absolute",
      left: (screenWidth - width) / 2,
      top: (screenHeight - height) / 2
    }
  });
};

const styles = StyleSheet.create({
  overlayContainer: { flex: 1 }
});

export default Overlay;
