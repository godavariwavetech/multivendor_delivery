import { Send } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, type ScrollViewInstance, StyleSheet, TextInput, View } from 'react-native';

import { BackHeader, Button, Screen, Text } from '@/components';
import { useSession } from '@/data/session';
import { useSharedNav } from '@/navigation/types';
import { fonts, palette, pastel, pastelEdge, radius, space, useTheme } from '@/theme';

import { BotIcon } from './BotIcon';
import { GREETING, reply, suggestions, type AssistantAction } from './knowledge';

type Message = { id: number; from: 'bot' | 'me'; text: string; action?: AssistantAction };

let nextId = 1;

/** A help chat: answers common questions from a built-in guide, and hands over to support when it cannot. */
export function AssistantScreen() {
  const nav = useSharedNav();
  const { r, role } = useTheme();
  const { session } = useSession();
  const scroller = useRef<ScrollViewInstance>(null);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);

  const account = session?.account;
  const firstName = (role === 'delivery' ? account?.partner?.name : undefined)?.split(' ')[0];
  const [messages, setMessages] = useState<Message[]>(() => [{ id: nextId++, from: 'bot', text: GREETING(firstName) }]);

  useEffect(() => {
    const t = setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(t);
  }, [messages, typing]);

  const ask = (raw: string) => {
    const text = raw.trim();
    if (!text || typing) {
      return;
    }
    setDraft('');
    setMessages(m => [...m, { id: nextId++, from: 'me', text }]);
    setTyping(true);
    // A short pause so the answer reads as a reply, not a flash of text.
    setTimeout(() => {
      const answer = reply(text, role);
      setMessages(m => [...m, { id: nextId++, from: 'bot', text: answer.text, action: answer.action }]);
      setTyping(false);
    }, 550);
  };

  const run = (action: AssistantAction) =>
    (nav as unknown as { navigate: (name: string, params?: object) => void }).navigate(action.screen, action.params);

  const botAvatar = (
    <View style={[styles.avatar, { backgroundColor: r.soft }]}>
      <BotIcon size={26} color={r.accent} />
    </View>
  );

  return (
    <Screen
      scroll={false}
      footer={
        <View style={styles.inputRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={() => ask(draft)}
            placeholder="Type your question"
            placeholderTextColor={palette.inkSubtle}
            returnKeyType="send"
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            onPress={() => ask(draft)}
            style={[styles.send, { backgroundColor: draft.trim() ? r.accent : palette.line }]}>
            <Send size={20} color={palette.white} strokeWidth={2.2} />
          </Pressable>
        </View>
      }>
      <BackHeader title="Assistant" subtitle="Quick answers, any time" onBack={nav.goBack} />
      <ScrollView
        ref={scroller}
        style={styles.flex}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {messages.map(m => (
          <View key={m.id} style={[styles.row, m.from === 'me' && styles.rowMe]}>
            {m.from === 'bot' ? botAvatar : null}
            <View style={styles.bubbleCol}>
              <View style={[styles.bubble, m.from === 'me' ? { backgroundColor: r.accent } : styles.bubbleBot]}>
                <Text v="body" color={m.from === 'me' ? r.onAccent : palette.ink}>
                  {m.text}
                </Text>
              </View>
              {m.action ? (
                <Button label={m.action.label} variant="outline" size="sm" style={styles.action} onPress={() => run(m.action as AssistantAction)} />
              ) : null}
            </View>
          </View>
        ))}
        {typing ? (
          <View style={styles.row}>
            {botAvatar}
            <View style={[styles.bubble, styles.bubbleBot]}>
              <Text v="body" muted>
                Typing…
              </Text>
            </View>
          </View>
        ) : null}
        <View style={styles.chips}>
          {suggestions(role).map(q => (
            <Pressable key={q} onPress={() => ask(q)} style={[styles.chip, { borderColor: pastelEdge('sky') }]}>
              <Text v="caption" color={pastel.sky.ink}>
                {q}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { gap: space.md, paddingBottom: space.lg },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  rowMe: { justifyContent: 'flex-end' },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  bubbleCol: { flexShrink: 1, maxWidth: '82%', gap: space.sm },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.lg },
  bubbleBot: { backgroundColor: palette.paper, borderWidth: 1, borderColor: palette.line },
  action: { alignSelf: 'flex-start' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, paddingTop: space.sm },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, backgroundColor: palette.paper },
  inputRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  input: {
    flex: 1,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.paper,
    paddingHorizontal: space.lg,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: palette.ink,
  },
  send: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
