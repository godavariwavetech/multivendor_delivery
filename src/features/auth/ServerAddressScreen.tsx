import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { BackButton, Banner, Button, Screen, Text, useToast } from '@/components';
import { getBaseUrl, normaliseBaseUrl, setBaseUrl } from '@/api';
import { useAuthNav } from '@/navigation/types';
import { fonts, palette, radius, space } from '@/theme';

/**
 * Where the app looks for the backend. The emulator reaches the PC on
 * 10.0.2.2; a phone on the same Wi-Fi needs the PC's LAN address instead.
 */
export function ServerAddressScreen() {
  const nav = useAuthNav();
  const toast = useToast();
  const [value, setValue] = useState(getBaseUrl());

  const save = async () => {
    const saved = await setBaseUrl(value);
    setValue(saved);
    toast(`Server set to ${saved}`);
    nav.goBack();
  };

  return (
    <Screen gap={0} footer={<Button label="Save address" size="lg" flex={1} onPress={save} />}>
      <View style={styles.top}>
        <BackButton onPress={nav.goBack} />
      </View>
      <Text v="display">Server</Text>
      <Text v="body" muted style={styles.sub}>
        The address of the backend this app talks to.
      </Text>
      <View style={styles.field}>
        <TextInput
          value={value}
          onChangeText={setValue}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          style={styles.input}
          placeholder="http://192.168.1.5:2407"
          placeholderTextColor={palette.inkSubtle}
          onSubmitEditing={save}
        />
      </View>
      <Text v="caption" subtle style={styles.preview}>
        {`Will connect to ${normaliseBaseUrl(value)}/partner_app`}
      </Text>
      <Banner
        tone="mint"
        title="Which address?"
        body={'Android emulator · 10.0.2.2:2407\nPhone on the same Wi-Fi · your PC\'s IP, e.g. 192.168.1.5:2407\nUSB · run "adb reverse tcp:2407 tcp:2407", then localhost:2407'}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { paddingTop: space.lg, paddingBottom: space.xl },
  sub: { marginTop: space.xs, marginBottom: space.xxl, fontSize: 15 },
  field: {
    height: 54,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: palette.line,
    backgroundColor: palette.paper,
    paddingHorizontal: space.xl,
    justifyContent: 'center',
  },
  input: { fontFamily: fonts.regular, fontSize: 16, color: palette.ink, paddingVertical: 0 },
  preview: { marginTop: space.sm, marginBottom: space.xl, paddingHorizontal: 6 },
});
