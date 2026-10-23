/* eslint-env jest */
require('react-native-gesture-handler/jestSetup');

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

// The suite renders the screens on the seeded demo data, not a live backend.
jest.mock('@config/constants', () => ({
  ...jest.requireActual('@config/constants'),
  USE_MOCK_DATA: true,
}));

// A native module with no JS fallback; the cropper only calls it when a photo is cropped.
jest.mock('@react-native-community/image-editor', () => ({
  __esModule: true,
  default: { cropImage: jest.fn() },
}));

jest.mock('react-native-share', () => ({
  __esModule: true,
  default: { open: jest.fn(), shareSingle: jest.fn() },
}));
