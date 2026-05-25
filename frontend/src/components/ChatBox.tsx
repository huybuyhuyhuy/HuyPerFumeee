import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation } from 'react-router-dom';

type ChatRole = 'bot' | 'user';

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: number;
};

type QuickReply = {
  label: string;
  answer: string;
};

const CHAT_HISTORY_KEY = 'huyperfume.chat.history.v2';
const MAX_STORED_MESSAGES = 12;
const BOT_REPLY_DELAY_MS = 650;

const quickReplies: QuickReply[] = [
  {
    label: 'Tư vấn mùi hương nam',
    answer:
      'Bạn có thể chọn nhóm hương gỗ, hổ phách, da thuộc hoặc citrus. Đây là các nhóm hương nam tính, sang trọng và dễ dùng hằng ngày.',
  },
  {
    label: 'Tư vấn mùi hương nữ',
    answer:
      'Bạn có thể chọn nhóm hương hoa, trái cây, vanilla hoặc musk. Nếu thích phong cách quyến rũ hơn, hương amber hoặc gourmand sẽ rất phù hợp.',
  },
  {
    label: 'Hàng chính hãng?',
    answer:
      'HuyPerfume cam kết sản phẩm chính hãng, thông tin rõ ràng và được đóng gói cẩn thận trước khi giao đến khách hàng.',
  },
  {
    label: 'Chính sách giao hàng',
    answer:
      'HuyPerfume hỗ trợ giao hàng toàn quốc. Thời gian giao hàng tùy khu vực và sẽ được xác nhận khi đặt hàng.',
  },
  {
    label: 'Chính sách đổi trả',
    answer:
      'Sản phẩm được hỗ trợ đổi trả nếu lỗi do shop hoặc giao sai sản phẩm. Vui lòng giữ nguyên tem, hộp và hóa đơn.',
  },
  {
    label: 'Liên hệ shop',
    answer:
      'Bạn có thể liên hệ HuyPerfume qua hotline, email hoặc fanpage để được tư vấn nhanh nhất.',
  },
  {
    label: 'Gợi ý quà tặng',
    answer:
      'Nếu chọn nước hoa làm quà, bạn nên ưu tiên các mùi dễ dùng như fresh, floral, musk hoặc woody nhẹ. HuyPerfume có thể gợi ý theo giới tính, độ tuổi và ngân sách.',
  },
];

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createMessage(role: ChatRole, text: string): ChatMessage {
  return {
    id: createId(),
    role,
    text,
    createdAt: Date.now(),
  };
}

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Chào buổi sáng';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

function getPageHint(pathname: string) {
  if (pathname.startsWith('/products')) {
    return 'Bạn đang xem sản phẩm, mình có thể gợi ý nhóm hương, quà tặng hoặc chính sách mua hàng.';
  }

  if (pathname.startsWith('/cart') || pathname.startsWith('/checkout')) {
    return 'Nếu cần hỗ trợ giao hàng, thanh toán hoặc đổi trả, mình luôn sẵn sàng.';
  }

  return 'HuyPerfume có thể giúp bạn chọn mùi hương phù hợp hôm nay.';
}

function createGreeting(pathname: string) {
  return createMessage('bot', `${getTimeGreeting()}, ${getPageHint(pathname)}`);
}

function normalizeText(message: string) {
  return message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

function readStoredMessages(pathname: string) {
  try {
    const raw = window.localStorage.getItem(CHAT_HISTORY_KEY);
    if (!raw) return [createGreeting(pathname)];

    const parsed = JSON.parse(raw) as ChatMessage[];
    const validMessages = parsed.filter(
      (message) =>
        typeof message?.id === 'string' &&
        (message.role === 'bot' || message.role === 'user') &&
        typeof message.text === 'string' &&
        typeof message.createdAt === 'number',
    );

    return validMessages.length > 0 ? validMessages.slice(-MAX_STORED_MESSAGES) : [createGreeting(pathname)];
  } catch {
    return [createGreeting(pathname)];
  }
}

function findAnswer(message: string) {
  const normalized = normalizeText(message);

  if (normalized.includes('nam') || normalized.includes('go') || normalized.includes('da thuoc')) {
    return quickReplies[0].answer;
  }

  if (normalized.includes('nu') || normalized.includes('hoa') || normalized.includes('vanilla')) {
    return quickReplies[1].answer;
  }

  if (normalized.includes('chinh hang') || normalized.includes('auth') || normalized.includes('that') || normalized.includes('fake')) {
    return quickReplies[2].answer;
  }

  if (normalized.includes('giao') || normalized.includes('ship') || normalized.includes('van chuyen')) {
    return quickReplies[3].answer;
  }

  if (normalized.includes('doi') || normalized.includes('tra') || normalized.includes('loi')) {
    return quickReplies[4].answer;
  }

  if (normalized.includes('lien he') || normalized.includes('hotline') || normalized.includes('email') || normalized.includes('fanpage')) {
    return quickReplies[5].answer;
  }

  if (normalized.includes('qua') || normalized.includes('tang') || normalized.includes('sinh nhat')) {
    return quickReplies[6].answer;
  }

  return 'Mình chưa có câu trả lời thật chính xác cho nội dung này. Bạn có thể chọn một gợi ý bên dưới hoặc liên hệ HuyPerfume để được tư vấn nhanh hơn.';
}

function formatMessageTime(timestamp: number) {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp);
}

export function ChatBox() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => readStoredMessages(location.pathname));
  const [typing, setTyping] = useState(false);
  const [nudgeVisible, setNudgeVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimerRef = useRef<number | null>(null);
  const nudgeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, typing]);

  useEffect(() => {
    window.localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)));
  }, [messages]);

  useEffect(() => {
    if (open) {
      setNudgeVisible(false);
      window.dispatchEvent(new CustomEvent('huyperfume:chat-opened'));
    }
  }, [open]);

  useEffect(() => {
    const handleSalePopupClosed = () => {
      if (open) return;

      setNudgeVisible(true);
      if (nudgeTimerRef.current) window.clearTimeout(nudgeTimerRef.current);
      nudgeTimerRef.current = window.setTimeout(() => setNudgeVisible(false), 9000);
    };

    window.addEventListener('huyperfume:sale-popup-closed', handleSalePopupClosed);

    return () => {
      window.removeEventListener('huyperfume:sale-popup-closed', handleSalePopupClosed);
      if (nudgeTimerRef.current) window.clearTimeout(nudgeTimerRef.current);
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    };
  }, []);

  const sendQuestion = (question: string, answer: string) => {
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);

    setMessages((current) => [...current, createMessage('user', question)].slice(-MAX_STORED_MESSAGES));
    setTyping(true);
    setNudgeVisible(false);

    typingTimerRef.current = window.setTimeout(() => {
      setMessages((current) => [...current, createMessage('bot', answer)].slice(-MAX_STORED_MESSAGES));
      setTyping(false);
    }, BOT_REPLY_DELAY_MS);
  };

  const handleQuickReply = (item: QuickReply) => {
    setOpen(true);
    sendQuestion(item.label, item.answer);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = draft.trim();
    if (!question) return;

    setOpen(true);
    sendQuestion(question, findAnswer(question));
    setDraft('');
  };

  const clearConversation = () => {
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    setTyping(false);
    setMessages([createGreeting(location.pathname)]);
  };

  return (
    <div className={`chatbox-widget ${open ? 'is-open' : ''}`}>
      {open && (
        <section className="chatbox-panel" aria-label="Hộp chat hỗ trợ khách hàng">
          <div className="chatbox-header">
            <div className="chatbox-brand">
              <div className="chatbox-avatar" aria-hidden="true">HP</div>
              <div>
                <strong>HuyPerfume hỗ trợ</strong>
                <span>HuyPerfume đang online</span>
              </div>
            </div>

            <div className="chatbox-actions">
              <button type="button" onClick={clearConversation} aria-label="Xóa hội thoại">
                Xóa
              </button>
              <button type="button" onClick={() => setOpen(false)} aria-label="Thu nhỏ chatbox">
                <span aria-hidden="true">×</span>
              </button>
            </div>
          </div>

          <div className="chatbox-messages">
            {messages.map((message) => (
              <div key={message.id} className={`chatbox-message ${message.role}`}>
                <span>{message.text}</span>
                <time dateTime={new Date(message.createdAt).toISOString()}>{formatMessageTime(message.createdAt)}</time>
              </div>
            ))}
            {typing && (
              <div className="chatbox-typing" aria-label="HuyPerfume đang nhập">
                <span />
                <span />
                <span />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbox-quick-replies" aria-label="Gợi ý câu hỏi">
            {quickReplies.map((item) => (
              <button key={item.label} type="button" onClick={() => handleQuickReply(item)} disabled={typing}>
                {item.label}
              </button>
            ))}
          </div>

          <form className="chatbox-form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Nhập câu hỏi của bạn..."
              aria-label="Nhập câu hỏi"
              disabled={typing}
            />
            <button type="submit" disabled={typing || draft.trim().length === 0}>Gửi</button>
          </form>
        </section>
      )}

      {nudgeVisible && !open && (
        <button type="button" className="chatbox-nudge" onClick={() => setOpen(true)}>
          Bạn cần tư vấn chọn mùi hương phù hợp không?
        </button>
      )}

      <button
        type="button"
        className="chatbox-toggle"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={open ? 'Thu nhỏ chatbox' : 'Mở chat hỗ trợ'}
      >
        <span aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M4 6.8A4.8 4.8 0 0 1 8.8 2h6.4A4.8 4.8 0 0 1 20 6.8v4.7a4.8 4.8 0 0 1-4.8 4.8h-3.4l-4.1 3.2v-3.2A4.8 4.8 0 0 1 4 11.5z" />
            <path d="M8 8.5h8M8 12h5" />
          </svg>
        </span>
        <small>Hỗ trợ</small>
      </button>
    </div>
  );
}
