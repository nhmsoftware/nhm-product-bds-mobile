module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [],
    overrides: [
      {
        test(filename) {
          return /node_modules\/react-native\/(?:src\/private\/(?:webapis\/(?:geometry|dom\/oldstylecollections|errors|performance)|devsupport\/rndevtools)|Libraries\/(?:Animated|Debugging|vendor\/emitter))/.test(filename || '');
        },
        plugins: [
          ['@babel/plugin-transform-class-properties', { loose: true }],
          ['@babel/plugin-transform-private-methods', { loose: true }],
          ['@babel/plugin-transform-private-property-in-object', { loose: true }]
        ]
      }
    ]
  };
}; 
