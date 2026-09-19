import { Alert } from 'react-native';
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
