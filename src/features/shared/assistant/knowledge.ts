import type { Role } from '@/theme';

/** A button under an answer: open a screen, or raise a support ticket. */
export type AssistantAction = { label: string; screen: string; params?: object };

type Topic = {
  /** Words and phrases that point to this topic; longer phrases score higher. */
  keywords: string[];
  /** The question shown as a quick-reply chip. */
  question: string;
  answer: string;
  action?: AssistantAction;
};

const TICKET: AssistantAction = { label: 'Contact support', screen: 'ReportProblem' };

const vendor: Topic[] = [
  {
    keywords: ['accept', 'new order', 'incoming', 'prep time', 'preparation'],
    question: 'How do I accept an order?',
    answer:
      'Open the order from Home or the Orders tab and tap Accept, then pick a prep time. You have a few minutes to respond, and the countdown shows on the order card.',
  },
  {
    keywords: ['reject', 'decline', 'refuse', 'cancel order', 'closing time'],
    question: 'How do I reject an order?',
    answer:
      'Tap Reject on the order and choose a reason, like "Store closing" or "Out of stock". The customer is refunded automatically.',
  },
  {
    keywords: ['ready', 'handover', 'hand over', 'pickup', 'pick up', 'collect', 'partner'],
    question: 'How do I hand an order to the delivery partner?',
    answer:
      'When the food is done, tap Mark ready. The partner is notified. When they arrive, open the order from the Ready tab, check the items and ask for their handover code.',
  },
  {
    keywords: ["hasn't arrived", 'not arrived', 'late partner', 'partner late', 'waiting for partner'],
    question: "The partner hasn't arrived",
    answer:
      'Keep the order on the Ready tab. If nobody arrives 10 minutes after the promised time, report it from the handover screen.',
  },
  {
    keywords: ['price', 'change price', 'edit dish', 'edit item', 'update menu', 'rate'],
    question: 'How do I change a price?',
    answer: 'Open the Menu tab, tap the item, change the price and tap Save. Orders already placed keep the old price.',
  },
  {
    keywords: ['add dish', 'new dish', 'add item', 'add product', 'photo', 'image', 'picture'],
    question: 'How do I add a dish with a photo?',
    answer:
      'On the Menu tab tap Add dish, fill in the name, category and price, then tap the photo box to take or choose a picture (500 KB to 1 MB). Tap Save item when you are done. New items appear at the top of the menu.',
  },
  {
    keywords: ['out of stock', 'unavailable', 'sold out', 'not available', 'stock'],
    question: 'How do I mark something out of stock?',
    answer: 'Switch the toggle on the right of the item off on the Menu tab. Switch it on again when it is back.',
    action: { label: 'Out of stock list', screen: 'OutOfStock' },
  },
  {
    keywords: ['veg', 'non-veg', 'nonveg', 'filter'],
    question: 'How do I filter veg and non-veg dishes?',
    answer:
      'On the Menu tab use the small switch above "Out of stock". Green is veg and brown is non-veg. It is only shown for food and bakery stores.',
  },
  {
    keywords: ['open', 'close', 'closed', 'timing', 'hours', 'busy', 'accepting orders', 'stop orders'],
    question: 'How do I open or close my store?',
    answer: 'Use the "Accepting orders" switch on Home. To change your daily opening hours or day parts, open Timings.',
    action: { label: 'Open Timings', screen: 'Timings' },
  },
  {
    keywords: ['settlement', 'payout', 'paid', 'payment', 'money', 'earning', 'commission', 'bank'],
    question: 'When is my settlement paid?',
    answer:
      'Weekly cycles close on Sunday midnight and are paid to your bank account on Tuesday. See the Earnings tab for each cycle and its breakdown.',
    action: { label: 'See reports', screen: 'Reports' },
  },
  {
    keywords: ['invoice', 'bill', 'receipt', 'share'],
    question: 'How do I share an invoice?',
    answer: 'Open an order that you have accepted and tap Share invoice. Pick WhatsApp, SMS, email or Copy.',
  },
  {
    keywords: ['coupon', 'offer', 'discount', 'promo'],
    question: 'How do I create a coupon?',
    answer:
      'Open Profile, then Coupons, and add a new one with its code, value and valid days. You can switch a coupon off at any time.',
    action: { label: 'Open Coupons', screen: 'Coupons' },
  },
  {
    keywords: ['refund', 'complaint', 'problem', 'issue', 'help', 'support', 'agent', 'human', 'call'],
    question: 'I need to talk to support',
    answer: 'You can message support from here. Describe the problem and the team will get back to you.',
    action: TICKET,
  },
];

const delivery: Topic[] = [
  {
    keywords: ['accept', 'request', 'new delivery', 'incoming', 'skip'],
    question: 'How do I accept a delivery request?',
    answer: 'Open Requests and tap Accept before the countdown ends. If you skip a request it is offered to another partner.',
  },
  {
    keywords: ['not answering', 'no answer', 'unavailable', 'customer not', "can't reach", 'not picking'],
    question: 'The customer is not answering',
    answer: 'Call twice, wait 5 minutes at the address, then use "Customer unavailable" on the OTP screen.',
  },
  {
    keywords: ["isn't ready", 'not ready', 'food not', 'delay', 'waiting at store'],
    question: "The food isn't ready at the store",
    answer: 'Wait at the counter. If it is more than 10 minutes past the ready time, use "Order not ready · report delay".',
  },
  {
    keywords: ['otp', 'code', 'handover code', 'verify'],
    question: 'Where do I get the OTP or handover code?',
    answer:
      'At the store, ask the vendor for the handover code from their handover screen. At the drop, ask the customer for the 4-digit OTP shown in their order screen.',
  },
  {
    keywords: ['cod', 'cash', 'collect cash'],
    question: 'How is COD cash settled?',
    answer: 'Cash you collect is deducted from your next weekly payout. You never deposit it separately.',
  },
  {
    keywords: ['paid', 'payout', 'payment', 'earning', 'money', 'salary', 'bank'],
    question: 'When do I get paid?',
    answer: 'Weekly earnings are paid on Tuesday to your registered bank account. Open the Earnings tab to see each trip.',
  },
  {
    keywords: ['kyc', 'document', 'vehicle', 'licence', 'license', 'verification'],
    question: 'How do I update my documents?',
    answer: 'Open Profile and choose KYC & documents or Vehicle to update them. Changes are reviewed before they go live.',
  },
  {
    keywords: ['refund', 'complaint', 'problem', 'issue', 'help', 'support', 'agent', 'human', 'call'],
    question: 'I need to talk to support',
    answer: 'You can message support from here. Describe the problem and the team will get back to you.',
    action: TICKET,
  },
];

const TOPICS: Record<Role, Topic[]> = { vendor, delivery };

export const GREETING = (name?: string) =>
  `Hi${name ? ` ${name}` : ''}! I'm your eKart360 assistant. Ask me anything about orders, your menu or payouts, or pick a question below.`;

const THANKS = /\b(thanks|thank you|thx)\b/i;
const HELLO = /^\s*(hi|hello|hey|hii|good (morning|afternoon|evening))\b/i;

export type AssistantReply = { text: string; action?: AssistantAction };

/** The quick-reply chips offered under the chat. */
export const suggestions = (role: Role, limit = 5): string[] => TOPICS[role].slice(0, limit).map(t => t.question);

export const reply = (input: string, role: Role): AssistantReply => {
  const text = input.toLowerCase().trim();
  if (THANKS.test(text)) {
    return { text: "You're welcome! Ask me anything else any time." };
  }
  if (HELLO.test(text) && text.split(/\s+/).length <= 3) {
    return { text: 'Hello! What can I help you with?' };
  }

  let best: Topic | null = null;
  let bestScore = 0;
  for (const topic of TOPICS[role]) {
    // A tapped chip is an exact question and always wins.
    if (topic.question.toLowerCase() === text) {
      best = topic;
      bestScore = Infinity;
      break;
    }
    const score = topic.keywords.reduce((sum, k) => (text.includes(k) ? sum + k.length : sum), 0);
    if (score > bestScore) {
      best = topic;
      bestScore = score;
    }
  }

  if (best && bestScore > 0) {
    return { text: best.answer, action: best.action };
  }
  return {
    text: "I'm not sure about that one. Try asking in different words, pick a question below, or message support and they'll help.",
    action: TICKET,
  };
};
