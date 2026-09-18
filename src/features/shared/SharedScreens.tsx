import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { BellOff, ChevronDown, ChevronUp, Headset, Mail, MessageCircle } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import {
  BackHeader,
  Banner,
  Button,
  Card,
  Chip,
  ChipRow,
  EmptyState,
  KeyValue,
  LinkButton,
  ListGroup,
  ListRow,
  Screen,
  SectionLabel,
  Text,
  useToast,
} from '@/components';
import { useDelivery } from '@/data/deliveryStore';
import { useVendor } from '@/data/vendorStore';
import { SharedParams, useSharedNav } from '@/navigation/types';
import { fonts, palette, radius, space, useTheme } from '@/theme';
import { ago } from '@/utils/datetime';

/** The shared screens read settings from whichever role is active. */
function useRoleStore() {
  const { role } = useTheme();
  const vendor = useVendor();
  const delivery = useDelivery();
  return role === 'vendor'
    ? {
        notifications: vendor.state.notifications,
        readAll: vendor.actions.readNotifications,
      }
    : {
        notifications: delivery.state.notifications,
        readAll: delivery.actions.readNotifications,
      };
}

/** Vendor SRS 10 / Delivery SRS 13. */
export function NotificationsScreen() {
  const nav = useSharedNav();
  const { r } = useTheme();
  const { notifications, readAll } = useRoleStore();
  const now = Date.now();
  const unread = notifications.filter(n => !n.read).length;

  return (
    <Screen>
      <BackHeader
        title="Notifications"
        subtitle={unread ? `${unread} unread` : 'All caught up'}
        onBack={nav.goBack}
        right={unread ? <LinkButton label="Mark read" onPress={readAll} /> : undefined}
      />
      {notifications.length ? (
        notifications.map(n => (
          <Card key={n.id}>
            <View style={styles.notif}>
              <View style={[styles.dot, { backgroundColor: n.read ? 'transparent' : r.accent }]} />
              <View style={styles.flex}>
                <View style={styles.notifHead}>
                  <Text v="bodyStrong" style={styles.flex}>
                    {n.title}
                  </Text>
                  <Text v="caption" subtle>
                    {ago(n.at, now)}
                  </Text>
                </View>
                <Text v="body" muted>
                  {n.body}
                </Text>
              </View>
            </View>
          </Card>
        ))
      ) : (
        <EmptyState icon={BellOff} title="No notifications" body="Order, payout and system updates show up here." />
      )}
    </Screen>
  );
}

const FAQS = {
  vendor: [
    { q: 'An order came in after closing time', a: 'Reject it with "Store closing". The customer is refunded automatically and your rating is not affected.' },
    { q: "The partner hasn't arrived", a: 'Keep the order on the Ready tab. If nobody arrives 10 minutes after the promised time, report it from the handover screen.' },
    { q: 'When is my settlement paid?', a: 'Weekly cycles close Sunday midnight and are paid to your bank on Tuesday.' },
    { q: 'How do I change menu prices?', a: 'Open the item from the Menu tab and save the new price. Existing orders keep the old price.' },
  ],
  delivery: [
    { q: 'The customer is not answering', a: 'Call twice, wait 5 minutes at the address, then use "Customer unavailable" on the OTP screen.' },
    { q: "The food isn't ready at the store", a: 'Wait at the counter. If it is more than 10 minutes past the ready time, use "Order not ready · report delay".' },
    { q: 'How is COD cash settled?', a: 'Cash you collect is deducted from your next weekly payout. You never deposit it separately.' },
    { q: 'When do I get paid?', a: 'Weekly earnings are paid on Tuesday to your registered bank account.' },
  ],
};

export function HelpScreen() {
  const nav = useSharedNav();
  const toast = useToast();
  const { role } = useTheme();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Screen>
      <BackHeader title="Help & support" subtitle="We usually respond within 5 minutes" onBack={nav.goBack} />
      <View style={styles.contactRow}>
        <ContactTile icon={Headset} label="Call" onPress={() => toast('Calling partner support · 1800 000 000')} />
        <ContactTile icon={MessageCircle} label="Chat" onPress={() => toast('Chat opens with a support agent')} />
        <ContactTile icon={Mail} label="Email" onPress={() => toast('support@koodai.example copied')} />
      </View>

      <SectionLabel style={styles.label}>Common questions</SectionLabel>
      <ListGroup>
        {FAQS[role].map((f, i) => (
          <Pressable key={f.q} onPress={() => setOpen(open === i ? null : i)} style={styles.faq}>
            <View style={styles.faqHead}>
              <Text v="bodyStrong" style={styles.flex}>
                {f.q}
              </Text>
              {open === i ? (
                <ChevronUp size={20} color={palette.inkSubtle} />
              ) : (
                <ChevronDown size={20} color={palette.inkSubtle} />
              )}
            </View>
            {open === i ? (
              <Text v="body" muted style={styles.faqBody}>
                {f.a}
              </Text>
            ) : null}
          </Pressable>
        ))}
      </ListGroup>

      <Button label="Report a problem" variant="outline" onPress={() => nav.navigate('ReportProblem', undefined)} />
    </Screen>
  );
}

function ContactTile({ icon: Icon, label, onPress }: { icon: typeof Headset; label: string; onPress: () => void }) {
  const { r } = useTheme();
  return (
    <Card onPress={onPress} style={styles.contact}>
      <View style={[styles.contactIcon, { backgroundColor: r.soft }]}>
        <Icon size={22} color={r.accentDeep} strokeWidth={2.2} />
      </View>
      <Text v="bodyStrong">{label}</Text>
    </Card>
  );
}

const TOPICS = {
  vendor: ['Partner not here', 'Wrong partner', 'Order issue', 'Payout issue', 'App problem'],
  delivery: ['Order not ready', 'Customer issue', 'Address wrong', 'Vehicle trouble', 'Payout issue', 'App problem'],
};

export function ReportProblemScreen() {
  const nav = useSharedNav();
  const toast = useToast();
  const { role } = useTheme();
  const route = useRoute<RouteProp<SharedParams, 'ReportProblem'>>();
  const [topic, setTopic] = useState<string | null>(null);
  const [text, setText] = useState('');

  const submit = () => {
    toast(`Ticket #SR-${10480 + Math.floor(Math.random() * 90)} raised · support will call you`);
    nav.goBack();
  };

  return (
    <Screen footer={<Button label="Submit report" size="lg" flex={1} disabled={!topic} onPress={submit} />}>
      <BackHeader title="Report a problem" subtitle={route.params?.context ?? 'Tell us what went wrong'} onBack={nav.goBack} />
      <SectionLabel style={styles.label}>What's it about?</SectionLabel>
      <ChipRow scroll={false}>
        {TOPICS[role].map(t => (
          <Chip key={t} label={t} selected={topic === t} onPress={() => setTopic(t)} />
        ))}
      </ChipRow>
      <SectionLabel style={styles.label}>Details</SectionLabel>
      <Card padded={false}>
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          placeholder="What happened? Include the order number if there is one."
          placeholderTextColor={palette.inkSubtle}
          style={styles.textArea}
        />
      </Card>
      <Banner tone="mint" title="Urgent during a trip or service?" body="Call support directly from Help & support — calls are answered first." />
    </Screen>
  );
}

export function PrivacyScreen() {
  const nav = useSharedNav();
  const toast = useToast();
  return (
    <Screen>
      <BackHeader title="Terms & privacy" subtitle="Account and data settings" onBack={nav.goBack} />
      <ListGroup>
        <ListRow title="Terms of service" onPress={() => toast('Opens the latest terms (v4, 1 Aug)')} />
        <ListRow title="Privacy policy" onPress={() => toast('Opens the privacy policy')} />
        <ListRow title="Download my data" subtitle="Orders, payouts and profile as a ZIP" onPress={() => toast('We will email your data export within 24 h')} />
      </ListGroup>
      <Card>
        <SectionLabel>What we keep</SectionLabel>
        <KeyValue label="Order history" value="7 years (tax law)" />
        <KeyValue label="Location during trips" value="90 days" />
        <KeyValue label="Call recordings" value="30 days" />
      </Card>
      <Card tone="peach">
        <Text v="cardTitle" color={palette.clayDeep}>
          Delete account
        </Text>
        <Text v="body" color={palette.clayDeep} style={styles.gap}>
          Your login is removed after pending payouts settle. Tax records are kept as the law requires.
        </Text>
        <Button
          label="Request deletion"
          variant="clay"
          size="sm"
          style={styles.deleteBtn}
          onPress={() =>
            Alert.alert('Delete account?', 'Your store admin must approve this. You can cancel within 7 days.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Request deletion', style: 'destructive', onPress: () => toast('Deletion request sent') },
            ])
          }
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  notif: { flexDirection: 'row', gap: space.md },
  dot: { width: 9, height: 9, borderRadius: 5, marginTop: 7 },
  notifHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: 2 },
  label: { marginTop: space.sm, marginBottom: 0 },
  contactRow: { flexDirection: 'row', gap: 10 },
  contact: { flex: 1, alignItems: 'center', gap: space.sm },
  contactIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  faq: { paddingHorizontal: space.lg, paddingVertical: space.lg },
  faqHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  faqBody: { marginTop: space.sm },
  textArea: {
    minHeight: 130,
    padding: space.lg,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: palette.ink,
    textAlignVertical: 'top',
    borderRadius: radius.lg,
  },
  gap: { marginTop: 4 },
  deleteBtn: { alignSelf: 'flex-start', marginTop: space.md },
});
