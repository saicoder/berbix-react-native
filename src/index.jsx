import React, { Component, PureComponent } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native'
import { WebView } from 'react-native-webview';
import { RNCamera } from 'react-native-camera';
import PropTypes from 'prop-types';


const Overlay = ({ idType }) => {
  const stylesheet = idType === 'passport' ? passportStyles : cardStyles;
  return (
    <View style={styles.overlayContainer}>
      <View style={stylesheet.outerOverlay} />
      <View style={stylesheet.innerOverlay} />
    </View>
  );
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const cardWidth = screenWidth * 0.9;
const cardHeight = cardWidth * 0.63;
const passportHeight = cardWidth * 0.8;

const cardStyles = StyleSheet.create({
  outerOverlay: {
    alignSelf: 'center',
    borderColor: 'rgba(0, 0, 0, 0.5)',
    borderStyle: 'solid',
    borderRadius: 510,
    borderWidth: 500,
    width: cardWidth + 1000,
    height: cardHeight + 1000,
    position: 'absolute',
    left: (screenWidth - cardWidth) / 2 - 500,
    top: (screenHeight - cardHeight) / 2 - 500,
  },
  innerOverlay: {
    alignSelf: 'center',
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderStyle: 'solid',
    borderWidth: 5,
    borderRadius: 10,
    width: cardWidth,
    height: cardHeight,
    position: 'absolute',
    left: (screenWidth - cardWidth) / 2,
    top: (screenHeight - cardHeight) / 2,
  },
});

const passportStyles = StyleSheet.create({
  outerOverlay: {
    alignSelf: 'center',
    borderColor: 'rgba(0, 0, 0, 0.5)',
    borderStyle: 'solid',
    borderRadius: 510,
    borderWidth: 500,
    width: cardWidth + 1000,
    height: passportHeight + 1000,
    position: 'absolute',
    left: (screenWidth - cardWidth) / 2 - 500,
    top: (screenHeight - passportHeight) / 2 - 500,
  },
  innerOverlay: {
    alignSelf: 'center',
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderStyle: 'solid',
    borderWidth: 5,
    borderRadius: 10,
    width: cardWidth,
    height: passportHeight,
    position: 'absolute',
    left: (screenWidth - cardWidth) / 2,
    top: (screenHeight - passportHeight) / 2,
  },
});


class Camera extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      ready: false,
      loading: false,
    };
  }

  cameraSide() {
    switch (this.props.step) {
      case 'FRONT':
      case 'PASSPORT':
      case 'BACK':
        return RNCamera.Constants.Type.back;
      case 'SELFIE':
      case 'LIVENESS':
        return RNCamera.Constants.Type.front;
    }
  }

  takePicture = async camera => {
    if (!this.state.loading) {
      const options = {
        quality: 0.8,
        base64: true,
        exif: true,
        doNotSave: true,
        width: 1600,
      };
      this.setState({ loading: true });
      const data = await camera.takePictureAsync(options);
      this.props.onPhotoCapture(data.base64, data.exif);
    }
  }

  renderOverlay() {
    const { idType, step } = this.props;
    if (step === 'FRONT' || step === 'BACK' || step === 'PASSPORT') {
      return <Overlay idType={idType || 'card'} />
    }
    return null;
  }

  render() {
    const containerStyles = {
      ...styles.cameraContainer,
      ...(this.state.loading ? styles.cameraContainerLoading : {}),
    };

    const side = this.cameraSide();

    const pointOfInterest = side === RNCamera.Constants.Type.back ? { x: 0.5, y: 0.5 } : {};

    return (
      <View style={containerStyles}>
        <RNCamera
          style={styles.preview}
          type={side}
          flashMode={RNCamera.Constants.FlashMode.off}
          androidCameraPermissionOptions={{
            title: 'Permission to use camera',
            message: 'We need your permission to use your camera',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
          androidRecordAudioPermissionOptions={{
            title: 'Permission to use audio recording',
            message: 'We need your permission to use your audio',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
          captureAudio={false}
          onStatusChange={this.statusChange}
          {...pointOfInterest}
        >
          {({ camera, status }) => {
            if (status === 'READY' || !this.state.loading) {
              return (
                <>
                  {this.renderOverlay()}
                  <View style={styles.cameraButton}>
                    <TouchableOpacity onPress={() =>this.takePicture(camera)} style={styles.capture} disabled={this.state.loading}>
                      <Text style={{ fontSize: 14 }}>Take photo</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )
            }
          }}
        </RNCamera>
      </View>
    );
  }
}


class BerbixVerify extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      capturing: false,
      idType: "",
      step: "",
      backFormat: "",
      idx: 0,
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
    result['react-native-video'] = true;
    return result;
  }

  capturePhoto = async (base64, exif) => {
    this.postMessage({
      type: 'NATIVE_PHOTO_RESULT',
      payload: {
        base64: base64,
        format: 'jpg',
        exif: this.objectifyExif(exif),
        overlay: true,
      },
    });
    this.setState({ capturing: false });
  }

  cameraError = message => {
    this.postMessage({
      type: 'NATIVE_PHOTO_ERROR',
      payload: message,
    });
    this.setState({ capturing: false });
  }

  handleMessage = event => {
    const { onComplete, onError, onDisplay, onStateChange } = this.props;
    
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'VERIFICATION_COMPLETE') {
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
      } else if (data.type === 'DISPLAY_IFRAME') {
        onDisplay();
      } else if (data.type === 'RELOAD_IFRAME') {
        this.setState({ idx: this.state.idx + 1 });
      } else if (data.type === 'STATE_CHANGE') {
        onStateChange(data.payload);
      } else if (data.type === 'ERROR_RENDERED') {
        onError(data.payload);
      } else if (data.type === 'TAKE_NATIVE_PHOTO') {
        const { idType, step, backFormat } = data.payload;
        this.setState({ idType, step, backFormat, capturing: true });
      }
    } catch (err) {
      console.warn('Error parsing native message', event.nativeEvent.data, err);
    }
  }

  baseUrl() {
    const { baseUrl, environment } = this.props;
    if (baseUrl != null) {
      return baseUrl;
    }
    switch (environment) {
      case 'sandbox':
        return 'https://verify.sandbox.berbix.com';
      case 'staging':
        return 'https://verify.staging.berbix.com';
      default:
        return 'https://verify.berbix.com';
    }
  }

  frameUrl() {
    const { overrideUrl, version, clientId, role, email, phone, continuation } = this.props;
    if (overrideUrl != null) {
      return overrideUrl;
    }
    return (this.baseUrl() + '/' + version + '/verify') +
      ('?client_id=' + clientId) +
      ('&role=' + role) +
      '&mode=rn' +
      (email ? '&email=' + encodeURIComponent(email) : '') +
      (phone ? '&phone=' + encodeURIComponent(phone) : '') +
      (continuation ? '&continuation=' + continuation : '') ;
  }

  render() {
    const { env, clientId, role, continuation, email, phone, ...props } = this.props;

    return (
      <View {...props} style={styles.frameContainer}>
        <WebView
          key={this.state.idx}
          ref={this.webviewRef}
          source={{ uri: this.frameUrl() }}
          useWebKit
          javaScriptEnabled
          domStorageEnabled
          saveFormDataDisabled
          allowFileAccess
          onMessage={this.handleMessage}
        />
        {this.state.capturing && (
          <Camera
            idType={this.state.idType}
            step={this.state.step}
            backFormat={this.state.backFormat}
            onPhotoCapture={this.capturePhoto}
            onError={this.cameraError}
          />
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  frameContainer: {
    flex: 1,
  },
  overlayContainer: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
  cameraContainerLoading: {
    left: -10000,
    top: -10000,
  },
  cameraButton: {
    flex: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 30,
    width: '100%',
  },
  preview: {
    flex: 1,
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
  capture: {
    flex: 0,
    alignSelf: 'flex-end',
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 15,
    paddingHorizontal: 20,
    alignSelf: 'center',
    marginBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

BerbixVerify.propTypes = {
  onComplete: PropTypes.func.isRequired,
  clientId: PropTypes.string.isRequired,
  role: PropTypes.string.isRequired,
  onError: PropTypes.func,
  onDisplay: PropTypes.func,
  onStateChange: PropTypes.func,
  baseUrl: PropTypes.string,
  environment: PropTypes.oneOf(['sandbox', 'staging', 'production']),
  overrideUrl: PropTypes.string,
  version: PropTypes.string,
  email: PropTypes.string,
  phone: PropTypes.string,
  continuation: PropTypes.string,
};

BerbixVerify.defaultProps = {
  onError: function() {},
  onDisplay: function() {},
  onStateChange: function() {},
  version: 'v0',
};

export default BerbixVerify;
