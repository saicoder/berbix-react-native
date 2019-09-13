import React, { PureComponent } from "react";
import { overlayDimensions } from "./Overlay";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Linking
} from "react-native";
import Overlay from "./Overlay";
import { Camera as RNCamera } from "expo"
import { SDK_VERSION } from "./BerbixVerify";

export default class Camera extends PureComponent {
  state = {
    flashlightOn: false
  };

  exit() {
    this.props.onExit();
  }

  toggleLight() {
    this.setState({
      flashlightOn: !this.state.flashlightOn
    });
  }

  fallback() {
    this.props.onFallback();
  }

  capture = captured => {
    this.props.onCapture(captured.data);
  };

  render() {
    const overlay = overlayDimensions("barcode");
    const pointOfInterest = { pointOfInterest: { x: 0.5, y: 0.5 } };
    const flashMode = this.state.flashlightOn
      ? RNCamera.Constants.FlashMode.torch
      : RNCamera.Constants.FlashMode.off;
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <RNCamera
            ref={this.cameraRef}
            style={styles.preview}
            type={RNCamera.Constants.Type.back}
            flashMode={flashMode}
            androidCameraPermissionOptions={{
              title: "Permission to use camera",
              message: "We need your permission to use your camera",
              buttonPositive: "OK",
              buttonNegative: "Cancel"
            }}
            androidRecordAudioPermissionOptions={{
              title: "Permission to use audio recording",
              message: "We need your permission to use your audio",
              buttonPositive: "OK",
              buttonNegative: "Cancel"
            }}
            captureAudio={false}
            onBarCodeRead={this.capture}
            barCodeTypes={[RNCamera.Constants.BarCodeType.pdf417]}
            {...pointOfInterest}
          />
          <View style={styles.background}>
            <Overlay idType="barcode" />
          </View>
          <View style={styles.foreground}>
            <View style={styles.sections}>
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.exitButton}
                  onPress={() => this.exit()}
                >
                  <Text style={styles.headerText}>Exit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.flashlightButton}
                  onPress={() => this.toggleLight()}
                >
                  <Text style={styles.headerText}>Toggle light</Text>
                </TouchableOpacity>
              </View>
              <View
                style={{
                  ...styles.middleSection,
                  height: overlay.height + 160
                }}
              >
                <View style={styles.instruction}>
                  <Text style={styles.instructionText}>
                    Scan the barcode on the back of your ID
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.fallbackButton}
                  onPress={() => this.fallback()}
                >
                  <Text style={styles.fallbackButtonText}>
                    Don't have this barcode on your ID?
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.footer}>
                <View style={styles.poweredBy}>
                  <Text style={styles.footerText}>Powered by Berbix</Text>
                </View>
                <TouchableOpacity
                  style={styles.termsLink}
                  onPress={() =>
                    Linking.openURL(
                      "https://terms.berbix.com/terms/service?from=rn" +
                        SDK_VERSION
                    )
                  }
                >
                  <Text style={styles.footerText}>Terms &amp; Privacy</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  container: {
    flex: 1
  },
  preview: {
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    width: "100%"
  },
  foreground: {
    flex: 1,
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    width: "100%"
  },
  background: {
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    width: "100%"
  },
  sections: {
    flexDirection: "column",
    justifyContent: "space-between",
    height: "100%"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  headerText: {
    color: "white"
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  middleSection: {
    flexDirection: "column",
    justifyContent: "space-between"
  },
  instruction: {
    flexDirection: "row",
    justifyContent: "center"
  },
  instructionText: {
    color: "white",
    fontWeight: "bold"
  },
  fallbackButton: {
    flexDirection: "row",
    justifyContent: "center",
    padding: 10
  },
  fallbackButtonText: {
    color: "#4885C5"
  },
  exitButton: {
    padding: 10
  },
  flashlightButton: {
    padding: 10
  },
  poweredBy: {
    padding: 10
  },
  termsLink: {
    padding: 10
  },
  footerText: {
    color: "white"
  }
});
