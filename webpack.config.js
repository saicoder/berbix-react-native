var path = require("path");
var webpack = require("webpack");
module.exports = {
  entry: "./src/index.jsx",
  output: {
    path: path.resolve(__dirname),
    filename: "index.js",
    libraryTarget: "umd"
  },
  externals: {
    react: "react",
    "prop-types": "prop-types",
    "react-native": "react-native",
    "react-native-webview": "react-native-webview",
    "react-native-camera": "react-native-camera"
  },
  resolve: {
    extensions: [".js", ".jsx"]
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        loader: "babel-loader"
      }
    ]
  },
  stats: {
    colors: true
  },
  devtool: "source-map"
};
