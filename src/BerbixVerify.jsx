import React, { Component } from "react";
import { View, StyleSheet, Modal } from "react-native";
import { WebView } from "react-native-webview";
import PropTypes from "prop-types";
import IDCamera from "./IDCamera";
import BarcodeCamera from "./BarcodeCamera";

export const SDK_VERSION = "0.1.3";

const captureMode = {
  id: 1,
  barcode: 2
};

export default class BerbixVerify extends Component {
  constructor(props) {
    super(props);

    this.state = {
      capturing: null,
      showModal: false,
      idType: "",
      step: "",
      backFormat: "",
      idx: 0,
      height: 0,
      timeout: null
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
    this.setState({ capturing: null, showModal: false });
  };

  cameraError = message => {
    this.postMessage({
      type: "NATIVE_PHOTO_ERROR",
      payload: message
    });
    this.setState({ capturing: null, showModal: false });
  };

  barcodeCapture = payload => {
    this.postMessage({
      type: "NATIVE_BARCODE_RESULT",
      payload: {
        payload
      }
    });
    this.setState({ capturing: null, showModal: false });
  };

  barcodeFallback = () => {
    this.postMessage({
      type: "NATIVE_BARCODE_FALLBACK"
    });
    this.setState({ capturing: null, showModal: false });
  };

  barcodeExit = () => {
    this.setState({ capturing: null, showModal: false });
  };

  handleMessage = event => {
    const { onComplete, onError, onDisplay, onStateChange } = this.props;

    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log(data);
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
          capturing: captureMode.id,
          showModal: true
        });
      } else if (data.type === "TAKE_NATIVE_BARCODE") {
        const { timeout } = data.payload;
        this.setState({
          timeout,
          capturing: captureMode.barcode,
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
            this.setState({ capturing: null, showModal: false });
          }}
          onRequestClose={() => {
            this.setState({ capturing: null, showModal: false });
          }}
        >
          {this.state.capturing === captureMode.id && (
            <IDCamera
              idType={this.state.idType}
              step={this.state.step}
              backFormat={this.state.backFormat}
              onPhotoCapture={this.capturePhoto}
              onError={this.cameraError}
            />
          )}
          {this.state.capturing === captureMode.barcode && (
            <BarcodeCamera
              timeout={this.state.timeout}
              onCapture={this.barcodeCapture}
              onFallback={this.barcodeFallback}
              onExit={this.barcodeExit}
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
