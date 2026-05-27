import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api, { unwrapApiData } from '../services/api';
import { resolveProductImage } from '../utils/image';

type ChatRole = 'bot' | 'user';

type ChatProduct = {
  id: number;
  name: string;
  brand: string;
  price: number | null;
  originalPrice: number | null;
  discountPrice: number | null;
  effectivePrice: number | null;
  volumeMl: number | null;
  gender: string;
  scentGroup: string;
  description: string;
  image: string;
  detailUrl: string;
  isInStock: boolean;
  stock: number;
};

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: number;
  products?: ChatProduct[];
};

type QuickReply = {
  label: string;
};

const CHAT_HISTORY_KEY = 'huyperfume.chat.history.v2';
const MAX_STORED_MESSAGES = 12;
const CONNECTION_ERROR_MESSAGE = 'Mình chưa kết nối được máy chủ. Bạn thử lại sau nhé.';
const CHAT_PRODUCT_PLACEHOLDER = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 120 150%22%3E%3Crect width=%22120%22 height=%22150%22 fill=%22%23f4f0e9%22/%3E%3Cpath d=%22M48 41h24v10h6v48c0 7-5 12-12 12H54c-7 0-12-5-12-12V51h6z%22 fill=%22none%22 stroke=%22%23b89a60%22 stroke-width=%223%22/%3E%3Cpath d=%22M48 67h30%22 stroke=%22%23d0af67%22 stroke-width=%223%22/%3E%3Ctext x=%2260%22 y=%2288%22 text-anchor=%22middle%22 font-family=%22serif%22 font-size=%2212%22 fill=%22%23735a46%22%3EHP%3C/text%3E%3C/svg%3E';

const quickReplies: QuickReply[] = [
  { label: 'Nước hoa nam dưới 800k' },
  { label: 'Tìm mùi vanilla' },
  { label: 'Có chai nào hương gỗ không?' },
  { label: 'Gợi ý nước hoa nữ dễ dùng' },
  { label: 'Nước hoa unisex 100ml' },
];

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createMessage(role: ChatRole, text: string, products?: ChatProduct[]): ChatMessage {
  return {
    id: createId(),
    role,
    text,
    createdAt: Date.now(),
    ...(products?.length ? { products } : {}),
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

function asNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function optionalPositiveNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function normalizeChatProduct(raw: any): ChatProduct | null {
  const id = asNumber(raw?.id);
  if (!id || !raw?.name) return null;
  const price = optionalPositiveNumber(raw?.price);
  const discountPrice = optionalPositiveNumber(raw?.discountPrice);
  const effectivePrice = optionalPositiveNumber(raw?.effectivePrice) ?? discountPrice ?? price;

  return {
    id,
    name: String(raw.name),
    brand: String(raw?.brand || ''),
    price,
    originalPrice: optionalPositiveNumber(raw?.originalPrice),
    discountPrice,
    effectivePrice,
    volumeMl: optionalPositiveNumber(raw?.volumeMl),
    gender: String(raw?.gender || ''),
    scentGroup: String(raw?.scentGroup || ''),
    description: String(raw?.description || '').trim(),
    image: String(raw?.image || ''),
    detailUrl: `/products/${id}`,
    isInStock: Boolean(raw?.isInStock ?? asNumber(raw?.stock) > 0),
    stock: asNumber(raw?.stock),
  };
}

function readStoredMessages(pathname: string): ChatMessage[] {
  try {
    const raw = window.localStorage.getItem(CHAT_HISTORY_KEY);
    if (!raw) return [createGreeting(pathname)];

    const parsed = JSON.parse(raw) as unknown[];
    const validMessages = parsed.reduce<ChatMessage[]>((messages, message: any) => {
      if (
        typeof message?.id === 'string' &&
        (message.role === 'bot' || message.role === 'user') &&
        typeof message.text === 'string' &&
        typeof message.createdAt === 'number'
      ) {
        const products = Array.isArray(message.products)
          ? message.products.map(normalizeChatProduct).filter((product: ChatProduct | null): product is ChatProduct => Boolean(product)).slice(0, 5)
          : [];
        messages.push({
          id: message.id,
          role: message.role,
          text: message.text,
          createdAt: message.createdAt,
          ...(products.length ? { products } : {}),
        });
      }
      return messages;
    }, []);

    return validMessages.length > 0 ? validMessages.slice(-MAX_STORED_MESSAGES) : [createGreeting(pathname)];
  } catch {
    return [createGreeting(pathname)];
  }
}

function formatMessageTime(timestamp: number) {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp);
}

function formatCurrency(value: number | null) {
  return value ? `${value.toLocaleString('vi-VN')}đ` : 'Liên hệ';
}

function formatGender(value: string) {
  const gender = value.toLowerCase();
  if (gender === 'men' || gender === 'male' || gender === 'nam') return 'Nam';
  if (gender === 'women' || gender === 'female' || gender === 'nữ' || gender === 'nu') return 'Nữ';
  if (gender === 'unisex') return 'Unisex';
  return value;
}

function formatScentGroup(value: string) {
  return value.replace(/\s*\|\s*/g, ' / ');
}

function getContextProductId(messages: ChatMessage[], pathname: string) {
  const productRoute = pathname.match(/^\/products\/(\d+)(?:\/|$)/);
  if (productRoute) return Number(productRoute[1]);

  const lastBotMessage = [...messages]
    .reverse()
    .find((message) => message.role === 'bot');
  return lastBotMessage?.products?.length === 1 ? lastBotMessage.products[0].id : null;
}

export function ChatBox() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => readStoredMessages(location.pathname));
  const [typing, setTyping] = useState(false);
  const [nudgeVisible, setNudgeVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const nudgeTimerRef = useRef<number | null>(null);
  const requestSequenceRef = useRef(0);

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

  const sendQuestion = async (question: string) => {
    const requestSequence = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestSequence;
    setMessages((current) => [...current, createMessage('user', question)].slice(-MAX_STORED_MESSAGES));
    setTyping(true);
    setNudgeVisible(false);

    try {
      const contextProductId = getContextProductId(messages, location.pathname);
      const { data } = await api.post('/ai/product-chat', {
        question,
        ...(contextProductId ? { productId: contextProductId } : {}),
      });
      if (requestSequence !== requestSequenceRef.current) return;
      const payload = unwrapApiData<any>(data);
      const products = Array.isArray(payload?.products)
        ? payload.products.map(normalizeChatProduct).filter((product: ChatProduct | null): product is ChatProduct => Boolean(product)).slice(0, 5)
        : [];
      const answer = typeof payload?.answer === 'string' && payload.answer.trim()
        ? payload.answer.trim()
        : 'Mình chưa nhận được câu trả lời phù hợp. Bạn thử lại sau nhé.';
      setMessages((current) => [...current, createMessage('bot', answer, products)].slice(-MAX_STORED_MESSAGES));
    } catch (error) {
      if (requestSequence !== requestSequenceRef.current) return;
      const isConnectionError = error instanceof Error && error.message.includes('Không thể kết nối');
      const message = isConnectionError
        ? CONNECTION_ERROR_MESSAGE
        : 'Mình chưa thể trả lời lúc này. Bạn thử lại sau nhé.';
      setMessages((current) => [...current, createMessage('bot', message)].slice(-MAX_STORED_MESSAGES));
    } finally {
      if (requestSequence !== requestSequenceRef.current) return;
      setTyping(false);
    }
  };

  const handleQuickReply = (item: QuickReply) => {
    setOpen(true);
    void sendQuestion(item.label);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = draft.trim();
    if (!question) return;

    setOpen(true);
    void sendQuestion(question);
    setDraft('');
  };

  const clearConversation = () => {
    requestSequenceRef.current += 1;
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
                <p className="chatbox-message-text">{message.text}</p>
                {message.role === 'bot' && message.products && message.products.length > 0 && (
                  <div className="chatbox-products" aria-label="Sản phẩm được gợi ý">
                    {message.products.map((product) => (
                      <article key={product.id} className="chatbox-product">
                        <img
                          className="chatbox-product-image"
                          src={product.image ? resolveProductImage(product.image) : CHAT_PRODUCT_PLACEHOLDER}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                          onError={(event) => {
                            if (event.currentTarget.src.startsWith('data:image/svg+xml')) return;
                            event.currentTarget.src = CHAT_PRODUCT_PLACEHOLDER;
                          }}
                        />
                        <div className="chatbox-product-body">
                          <div className="chatbox-product-topline">
                            {product.brand && <small>{product.brand}</small>}
                            <span className={`chatbox-stock-badge ${product.isInStock ? 'in-stock' : 'out-of-stock'}`}>
                              {product.isInStock ? 'Còn hàng' : 'Hết hàng'}
                            </span>
                          </div>
                          <strong>{product.name}</strong>
                          <b>{formatCurrency(product.effectivePrice ?? product.discountPrice ?? product.price)}</b>
                          {(product.volumeMl || product.gender) && (
                            <div className="chatbox-product-meta">
                              {product.volumeMl && <span>{product.volumeMl} ml</span>}
                              {product.gender && <span>{formatGender(product.gender)}</span>}
                            </div>
                          )}
                          {product.scentGroup && <p className="chatbox-product-scent">{formatScentGroup(product.scentGroup)}</p>}
                          {product.description && <p className="chatbox-product-description">{product.description}</p>}
                          <Link to={product.detailUrl} className="chatbox-product-link">Xem chi tiết</Link>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
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
