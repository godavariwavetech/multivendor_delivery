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
