import React, { PureComponent } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Camera as RNCamera } from "expo"
import Overlay from "./Overlay";

export default class IDCamera extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      ready: false,
      loading: false
    };
  }

  cameraRef = React.createRef();

  cameraSide() {
    switch (this.props.step) {
      case "FRONT":
      case "PASSPORT":
      case "BACK":
        return RNCamera.Constants.Type.back;
      case "SELFIE":
      case "LIVENESS":
        return RNCamera.Constants.Type.front;
    }
  }

  takePicture = async () => {
    if (this.cameraRef.current && !this.state.loading) {
      const options = {
        quality: 0.8,
        base64: true,
        exif: true,
        doNotSave: true,
        width: 1600
      };
      this.setState({ loading: true });
      const data = await this.cameraRef.current.takePictureAsync(options);
      this.props.onPhotoCapture(data.base64, data.exif);
    }
  };

  statusChange = e => {
    if (e.cameraStatus === "NOT_AUTHORIZED") {
      this.props.onError({
        message: "Camera must be authorized to capture photos."
      });
    } else if (e.cameraStatus === "READY") {
      this.setState({ ready: true });
    }
  };

  renderOverlay() {
    const { idType, step } = this.props;
    if (step === "FRONT" || step === "BACK" || step === "PASSPORT") {
      return <Overlay idType={idType || "card"} />;
    }
    return null;
  }

  render() {
    const containerStyles = {
      ...styles.cameraContainer,
      ...(this.state.loading ? styles.cameraContainerLoading : {})
    };

    const side = this.cameraSide();

    const pointOfInterest =
      side === RNCamera.Constants.Type.back ? { x: 0.5, y: 0.5 } : {};

    return (
      <View style={containerStyles}>
        <RNCamera
          ref={this.cameraRef}
          style={styles.preview}
          type={side}
          flashMode={RNCamera.Constants.FlashMode.off}
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
          onCameraReady={() => this.statusChange({ cameraStatus: 'READY' })}
          onMountError={() => this.statusChange({ cameraStatus: 'NOT_AUTHORIZED' })}
          {...pointOfInterest}
        />
        {this.state.ready && !this.state.loading && (
          <>
            {this.renderOverlay()}
            <View style={styles.cameraButton}>
              <TouchableOpacity
                onPress={this.takePicture}
                style={styles.capture}
                disabled={this.state.loading}
              >
                <Text style={{ fontSize: 14 }}>Take photo</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  cameraContainer: {
    flex: 1,
    justifyContent: "flex-end",
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    zIndex: 100
  },
  cameraContainerLoading: {
    left: -10000,
    top: -10000
  },
  cameraButton: {
    flex: 0,
    flexDirection: "row",
    justifyContent: "center",
    position: "absolute",
    bottom: 30,
    width: "100%"
  },
  preview: {
    flex: 1,
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%"
  },
  capture: {
    flex: 0,
    alignSelf: "flex-end",
    backgroundColor: "#fff",
    borderRadius: 5,
    padding: 15,
    paddingHorizontal: 20,
    alignSelf: "center",
    marginBottom: 30
  }
});
