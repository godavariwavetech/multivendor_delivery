import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';
import { launchCamera, launchImageLibrary, type Asset } from 'react-native-image-picker';

import { getBaseUrl } from '@/api';

export type PickedPhoto = { uri: string; name: string; type: string };

const toPicked = (asset: Asset | undefined): PickedPhoto | null => {
  if (!asset?.uri) {
    return null;
  }
  return {
    uri: asset.uri,
    name: asset.fileName ?? `photo-${Date.now()}.jpg`,
    type: asset.type ?? 'image/jpeg',
  };
};

/**
 * Photos are resized before they leave the phone: a modern camera file is
 * several megabytes, the server caps an upload at 8 MB, and none of these are
 * ever shown larger than a card.
 */
const OPTIONS = { mediaType: 'photo', maxWidth: 1280, maxHeight: 1280, quality: 0.8 } as const;

/** Asks camera or gallery, and resolves to null if the person backs out. */
export const pickPhoto = (title = 'Add a photo'): Promise<PickedPhoto | null> =>
  new Promise(resolve => {
    Alert.alert(title, undefined, [
      {
        text: 'Take a photo',
        onPress: async () => {
          const result = await launchCamera(OPTIONS);
          resolve(result.didCancel || result.errorCode ? null : toPicked(result.assets?.[0]));
        },
      },
      {
        text: 'Choose from gallery',
        onPress: async () => {
          const result = await launchImageLibrary(OPTIONS);
          resolve(result.didCancel || result.errorCode ? null : toPicked(result.assets?.[0]));
        },
      },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });

/**
 * The server stores a path ("/uploads/partner_app/x.jpg"), not a full URL, so
 * the same row works whichever address the app reached the server on.
 */
export const photoUrl = (stored?: string | null) => {
  if (!stored) {
    return undefined;
  }
  return /^https?:\/\//i.test(stored) ? stored : `${getBaseUrl()}${stored}`;
};

export type PhotoSource = 'camera' | 'gallery';

/** Android asks for the camera at run time; the gallery uses the system photo picker and needs nothing. */
const ensureCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
  if (result === PermissionsAndroid.RESULTS.GRANTED) {
    return true;
  }
  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
    Alert.alert('Camera access is off', 'Allow the camera for this app in Settings to take a photo.', [
      { text: 'Not now', style: 'cancel' },
      { text: 'Open settings', onPress: () => Linking.openSettings() },
    ]);
  }
  return false;
};

/**
 * One photo from the camera or the gallery, resolved to null when the person
 * backs out or the camera permission is refused. A device or picker failure
 * throws an Error whose message is fit to show.
 */
export const getPhoto = async (source: PhotoSource): Promise<PickedPhoto | null> => {
  if (source === 'camera' && !(await ensureCameraPermission())) {
    return null;
  }
  // Larger than the upload size so there is room to crop before it is scaled down.
  const result = await (source === 'camera' ? launchCamera : launchImageLibrary)({ ...OPTIONS, maxWidth: 2048, maxHeight: 2048 });
  if (result.didCancel) {
    return null;
  }
  if (result.errorCode) {
    throw new Error(
      result.errorCode === 'camera_unavailable' ? 'No camera is available on this device.' : result.errorMessage || 'The photo could not be opened.',
    );
  }
  const picked = toPicked(result.assets?.[0]);
  if (!picked) {
    throw new Error('That file is not a usable photo.');
  }
  return picked;
};
