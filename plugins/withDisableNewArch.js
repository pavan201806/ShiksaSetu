const { withGradleProperties, withPodfileProperties } = require('@expo/config-plugins');

/**
 * Expo Config Plugin that forces newArchEnabled=false in both:
 * - android/gradle.properties
 * - ios/Podfile.properties.json
 *
 * This ensures native libraries without New Architecture / React Native 0.86+ JSI
 * support (such as expo-av) link and run cleanly without dlopen UnsatisfiedLinkError.
 */
module.exports = function withDisableNewArch(config) {
  config = withGradleProperties(config, (config) => {
    let found = false;
    config.modResults = config.modResults.map((item) => {
      if (item.type === 'property' && item.key === 'newArchEnabled') {
        found = true;
        return { ...item, value: 'false' };
      }
      return item;
    });

    if (!found) {
      config.modResults.push({
        type: 'property',
        key: 'newArchEnabled',
        value: 'false',
      });
    }

    return config;
  });

  config = withPodfileProperties(config, (config) => {
    config.modResults['newArchEnabled'] = 'false';
    return config;
  });

  return config;
};

