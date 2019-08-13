import React, { Component, PureComponent, ViewPropTypes } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  Modal
} from "react-native";
import { WebView } from "react-native-webview";
import { RNCamera } from "react-native-camera";
import PropTypes from "prop-types";

const SDK_VERSION = "0.0.9";

const Overlay = ({ idType }) => {
  const stylesheet = idType === "passport" ? passportStyles : cardStyles;
  return (
    <View style={styles.overlayContainer}>
      <View style={stylesheet.outerOverlay} />
      <View style={stylesheet.innerOverlay} />
    </View>
  );
};

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const cardWidth = screenWidth * 0.9;
const cardHeight = cardWidth * 0.63;
const passportHeight = cardWidth * 0.8;

const cardStyles = StyleSheet.create({
  outerOverlay: {
    alignSelf: "center",
    borderColor: "rgba(0, 0, 0, 0.5)",
    borderStyle: "solid",
    borderRadius: 510,
    borderWidth: 500,
    width: cardWidth + 1000,
    height: cardHeight + 1000,
    position: "absolute",
    left: (screenWidth - cardWidth) / 2 - 500,
    top: (screenHeight - cardHeight) / 2 - 500
  },
  innerOverlay: {
    alignSelf: "center",
    borderColor: "rgba(255, 255, 255, 0.6)",
    borderStyle: "solid",
    borderWidth: 5,
    borderRadius: 10,
    width: cardWidth,
    height: cardHeight,
    position: "absolute",
    left: (screenWidth - cardWidth) / 2,
    top: (screenHeight - cardHeight) / 2
  }
});

const passportStyles = StyleSheet.create({
  outerOverlay: {
    alignSelf: "center",
    borderColor: "rgba(0, 0, 0, 0.5)",
    borderStyle: "solid",
    borderRadius: 510,
    borderWidth: 500,
    width: cardWidth + 1000,
    height: passportHeight + 1000,
    position: "absolute",
    left: (screenWidth - cardWidth) / 2 - 500,
    top: (screenHeight - passportHeight) / 2 - 500
  },
  innerOverlay: {
    alignSelf: "center",
    borderColor: "rgba(255, 255, 255, 0.6)",
    borderStyle: "solid",
    borderWidth: 5,
    borderRadius: 10,
    width: cardWidth,
    height: passportHeight,
    position: "absolute",
    left: (screenWidth - cardWidth) / 2,
    top: (screenHeight - passportHeight) / 2
  }
});

class Camera extends PureComponent {
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
          onStatusChange={this.statusChange}
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

class BerbixVerify extends Component {
  constructor(props) {
    super(props);

    this.state = {
      capturing: false,
      showModal: false,
      idType: "",
      step: "",
      backFormat: "",
      idx: 0,
      height: 0
    };
  }

  webviewRef = React.createRef();

  postMessage(message) {
    const data = JSON.stringify(message);
    const toRun = `window.ReceiveRNImage(${data}); true;`;
    this.webviewRef.current.injectJavaScript(toRun);
  }

  objectifyExif(exif) {
    const result = JSON.parse(JSON.stringify(exif));
    result["react-native-video"] = true;
    return result;
  }

  capturePhoto = async (base64, exif) => {
    this.postMessage({
      type: "NATIVE_PHOTO_RESULT",
      payload: {
        base64: base64,
        format: "jpg",
        exif: this.objectifyExif(exif),
        overlay: true
      }
    });
    this.setState({ capturing: false, showModal: false });
  };

  cameraError = message => {
    this.postMessage({
      type: "NATIVE_PHOTO_ERROR",
      payload: message
    });
    this.setState({ capturing: false, showModal: false });
  };

  handleMessage = event => {
    const { onComplete, onError, onDisplay, onStateChange } = this.props;

    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "VERIFICATION_COMPLETE") {
        try {
          if (data.payload.success) {
            onComplete({ value: data.payload.code });
          } else {
            onError(data);
          }
        } catch (e) {
          // Continue clean-up even if callback throws
        }
        this.setState({ show: false });
      } else if (data.type === "DISPLAY_IFRAME") {
        onDisplay();
        this.setState({ height: data.payload.height });
      } else if (data.type === "RESIZE_IFRAME") {
        this.setState({ height: data.payload.height });
      } else if (data.type === "RELOAD_IFRAME") {
        this.setState({ idx: this.state.idx + 1 });
      } else if (data.type === "STATE_CHANGE") {
        onStateChange(data.payload);
      } else if (data.type === "ERROR_RENDERED") {
        onError(data.payload);
      } else if (data.type === "TAKE_NATIVE_PHOTO") {
        const { idType, step, backFormat } = data.payload;
        this.setState({
          idType,
          step,
          backFormat,
          capturing: true,
          showModal: true
        });
      }
    } catch (err) {
      console.warn("Error parsing native message", event.nativeEvent.data, err);
    }
  };

  baseUrl() {
    const { baseUrl, environment } = this.props;
    if (baseUrl != null) {
      return baseUrl;
    }
    switch (environment) {
      case "sandbox":
        return "https://verify.sandbox.berbix.com";
      case "staging":
        return "https://verify.staging.berbix.com";
      default:
        return "https://verify.berbix.com";
    }
  }

  frameUrl() {
    const {
      overrideUrl,
      version,
      clientId,
      role,
      templateKey,
      email,
      phone,
      continuation,
      clientToken
    } = this.props;
    if (overrideUrl != null) {
      return overrideUrl;
    }
    const token = clientToken || continuation;
    const template = templateKey || role;
    return (
      this.baseUrl() +
      "/" +
      version +
      "/verify" +
      ("?client_id=" + clientId) +
      (template ? "&template=" + template : "") +
      "&mode=rn" +
      (email ? "&email=" + encodeURIComponent(email) : "") +
      (phone ? "&phone=" + encodeURIComponent(phone) : "") +
      (token ? "&client_token=" + token : "") +
      ("&sdk=BerbixReactNative-" + SDK_VERSION)
    );
  }

  render() {
    const { style, ...props } = this.props;

    return (
      <>
        <View {...props} style={{ ...styles.frameContainer, ...(style || {}) }}>
          <WebView
            key={this.state.idx}
            ref={this.webviewRef}
            style={{ height: this.state.height }}
            source={{ uri: this.frameUrl() }}
            useWebKit
            javaScriptEnabled
            domStorageEnabled
            saveFormDataDisabled
            allowFileAccess
            onMessage={this.handleMessage}
          />
        </View>
        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.showModal}
          onDismiss={() => {
            this.setState({ capturing: false, showModal: false });
          }}
          onRequestClose={() => {
            this.setState({ capturing: false, showModal: false });
          }}
        >
          {this.state.capturing && (
            <Camera
              idType={this.state.idType}
              step={this.state.step}
              backFormat={this.state.backFormat}
              onPhotoCapture={this.capturePhoto}
              onError={this.cameraError}
            />
          )}
        </Modal>
      </>
    );
  }
}

const styles = StyleSheet.create({
  frameContainer: {
    flex: 1
  },
  overlayContainer: {
    flex: 1
  },
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)"
  }
});

BerbixVerify.propTypes = {
  clientId: PropTypes.string.isRequired,

  // Configurations
  clientToken: PropTypes.string,
  templateKey: PropTypes.string,
  email: PropTypes.string,
  phone: PropTypes.string,

  // Event handlers
  onComplete: PropTypes.func.isRequired,
  onError: PropTypes.func,
  onDisplay: PropTypes.func,
  onStateChange: PropTypes.func,

  // Internal use
  baseUrl: PropTypes.string,
  overrideUrl: PropTypes.string,
  environment: PropTypes.oneOf(["sandbox", "staging", "production"]),
  version: PropTypes.string,

  // Deprecated
  continuation: PropTypes.string,
  role: PropTypes.string
};

BerbixVerify.defaultProps = {
  onError: function() {},
  onDisplay: function() {},
  onStateChange: function() {},
  version: "v0",
  style: {}
};

export default BerbixVerify;
