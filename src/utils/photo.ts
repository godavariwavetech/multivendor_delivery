import { Linking, PermissionsAndroid, Platform } from 'react-native';
import { launchCamera, launchImageLibrary, type Asset } from 'react-native-image-picker';

import { getBaseUrl } from '@/api';
import { appAlert } from '@/components/Dialog';

export type PickedPhoto = { uri: string; name: string; type: string };

/**
 * A dish photo is 500 KB to 1 MB. Anything smaller is refused as too low quality;
 * anything larger is compressed by the cropper until it fits.
 */
export const MIN_PHOTO_BYTES = 500 * 1024;
export const MAX_PHOTO_BYTES = 1024 * 1024;

export const formatKb = (bytes: number) => `${Math.round(bytes / 1024)} KB`;

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
    appAlert(title, undefined, [
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
  // A server path gets the server's address; a full URL or a photo still on this phone is used as it is.
  return /^(https?|file|content):\/\//i.test(stored) ? stored : `${getBaseUrl()}${stored}`;
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
  // Denied once or for good, say why nothing happened and where to turn it back on.
  appAlert('Camera access is off', 'Allow the camera for this app in Settings to take a photo.', [
    { text: 'Not now', style: 'cancel' },
    { text: 'Open settings', onPress: () => Linking.openSettings() },
  ]);
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
  const asset = result.assets?.[0];
  const picked = toPicked(asset);
  if (!picked) {
    throw new Error('That file is not a usable photo.');
  }
  if (asset?.fileSize && asset.fileSize < MIN_PHOTO_BYTES) {
    throw new Error(`Photo is too small (${formatKb(asset.fileSize)}). Use a photo between 500 KB and 1 MB.`);
  }
  return picked;
};
