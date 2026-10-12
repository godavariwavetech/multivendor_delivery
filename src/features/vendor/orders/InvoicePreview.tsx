import { Share2, X } from 'lucide-react-native';
import React from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Text } from '@/components';
import { fonts, palette, radius, shadow, space } from '@/theme';
import { type InvoiceContent, type InvoiceLogo, toLatin1 } from '@/utils/invoice';

type Props = {
  /** Null keeps the preview closed. */
  content: InvoiceContent | null;
  logo: InvoiceLogo | null;
  sharing: boolean;
  onShare: () => void;
  onClose: () => void;
};

const LOGO_BOX = 56;

/**
 * The invoice as it will look in the PDF, shown before it is shared. It reads the same
 * `InvoiceContent` as the PDF, and shows amounts the way the PDF prints them ("Rs.").
 */
export function InvoicePreview({ content, logo, sharing, onShare, onClose }: Props) {
  const insets = useSafeAreaInsets();
  if (!content) {
    return null;
  }
  const scale = logo ? Math.min(LOGO_BOX / logo.width, LOGO_BOX / logo.height) : 0;
  const money = (value: string) => toLatin1(value);

  return (
    <Modal animationType="slide" visible onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.screen, { paddingTop: insets.top + space.md }]}>
        <View style={styles.header}>
          <View style={styles.flex}>
            <Text v="title">Invoice preview</Text>
            <Text v="caption" muted>
              This is the PDF that will be shared
            </Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close preview" hitSlop={10} onPress={onClose} style={styles.close}>
            <X size={18} color={palette.ink} strokeWidth={2.4} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.paper}>
            <View style={styles.head}>
              {logo ? (
                <Image
                  accessibilityLabel="Store logo"
                  source={{ uri: `data:image/jpeg;base64,${btoa(logo.data)}` }}
                  style={{ width: logo.width * scale, height: logo.height * scale }}
                />
              ) : null}
              <View style={styles.flex}>
                {content.tenantName ? (
                  <Text v="caption" style={styles.bold}>
                    {content.tenantName}
                  </Text>
                ) : null}
                <Text v="display" style={styles.bold}>
                  {content.storeName}
                </Text>
                {content.address ? <Text v="caption">{content.address}</Text> : null}
                {content.gstin ? (
                  <Text v="caption" style={styles.bold}>
                    {`GSTIN: ${content.gstin}`}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.between}>
              <Text v="headline" style={styles.bold}>{`INVOICE #${content.number}`}</Text>
              <Text v="caption">{content.placed}</Text>
            </View>
            <Text v="caption">{`Customer: ${content.customer}`}</Text>

            <View style={styles.rule} />
            <View style={styles.between}>
              <Text v="caption" style={styles.bold}>
                Item
              </Text>
              <Text v="caption" style={styles.bold}>
                Amount
              </Text>
            </View>
            <View style={styles.rule} />
            {content.items.map((item, i) => (
              <View key={`${i}-${item.label}`} style={styles.line}>
                <Text v="caption" style={styles.flex}>
                  {toLatin1(item.label)}
                </Text>
                <Text v="caption">{money(item.amount)}</Text>
              </View>
            ))}

            <View style={styles.rule} />
            {content.totals.map(t => (
              <View key={t.label} style={styles.line}>
                <Text v="caption" style={styles.flex}>
                  {t.label}
                </Text>
                <Text v="caption">{money(t.amount)}</Text>
              </View>
            ))}
            <View style={styles.rule} />
            <View style={styles.between}>
              <Text v="headline" style={styles.bold}>
                TOTAL
              </Text>
              <Text v="headline" style={styles.bold}>
                {money(content.total)}
              </Text>
            </View>
            <Text v="caption">{`Payment: ${content.payment}`}</Text>
            <Text v="bodyStrong" style={[styles.bold, styles.thanks]}>
              Thank you!
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
          <Button label="Close" variant="outline" flex={1} onPress={onClose} />
          <Button label={sharing ? 'Preparing…' : 'Share PDF'} icon={Share2} flex={2} disabled={sharing} onPress={onShare} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontFamily: fonts.bold },
  screen: { flex: 1, backgroundColor: palette.canvas },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.gutter, paddingBottom: space.md },
  close: { width: 36, height: 36, borderRadius: radius.pill, backgroundColor: palette.sunken, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: space.gutter },
  paper: { backgroundColor: palette.paper, borderRadius: radius.sm, padding: space.lg, gap: space.sm, ...shadow.card },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.sm },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: palette.line },
  thanks: { marginTop: space.md },
  footer: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.gutter, paddingTop: space.md, backgroundColor: palette.paper },
});
