/* eslint-env jest */
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

jest.mock('react-native-audio-recorder-player', () => {
  return jest.fn().mockImplementation(() => {
    return {
      startRecorder: jest.fn().mockResolvedValue('file:///mock-audio.m4a'),
      stopRecorder: jest.fn().mockResolvedValue('file:///mock-audio.m4a'),
      addRecordBackListener: jest.fn(),
      removeRecordBackListener: jest.fn(),
    };
  });
});

// Mock global fetch to prevent network requests during tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, data: [] }),
  })
);
