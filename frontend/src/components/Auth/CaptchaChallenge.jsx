import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../services/api';

const EMPTY_PROOF = { captchaToken: '', captchaAnswer: '' };

export function CaptchaChallenge({ purpose, proof, onChange, refreshKey = 0 }) {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const requestId = useRef(0);

  const loadChallenge = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    setLoading(true);
    setLoadError('');
    try {
      const { data } = await api.get('/auth/captcha', { params: { purpose } });
      if (currentRequestId !== requestId.current) return;
      const nextChallenge = data?.data ?? data;
      setChallenge(nextChallenge);
      onChange({ captchaToken: nextChallenge.captchaToken, captchaAnswer: '' });
    } catch (error) {
      if (currentRequestId !== requestId.current) return;
      setChallenge(null);
      onChange(EMPTY_PROOF);
      setLoadError(error?.message || 'Không thể tải mã xác nhận.');
    } finally {
      if (currentRequestId === requestId.current) setLoading(false);
    }
  }, [onChange, purpose]);

  useEffect(() => {
    loadChallenge();
  }, [loadChallenge, refreshKey]);

  const imageSource = challenge?.imageSvg
    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(challenge.imageSvg)}`
    : '';

  return (
    <section className="auth-captcha-card mb-4" aria-label="Xác minh CAPTCHA">
      <div className="auth-captcha-heading">
        <span className="auth-captcha-kicker">Bảo mật</span>
        <strong>Xác nhận bạn không phải robot</strong>
      </div>
      <div className="auth-captcha-visual">
        {loading ? (
          <div className="auth-captcha-loading" aria-live="polite">Đang tạo mã...</div>
        ) : imageSource ? (
          <img className="auth-captcha-image" src={imageSource} alt="Mã xác nhận CAPTCHA" />
        ) : (
          <div className="auth-captcha-loading text-danger">Chưa tải được mã</div>
        )}
        <button
          type="button"
          className="auth-captcha-refresh"
          onClick={loadChallenge}
          disabled={loading}
          aria-label="Tạo mã CAPTCHA mới"
        >
          ↻
        </button>
      </div>
      <label className="form-label auth-captcha-label" htmlFor={`${purpose}-captcha-answer`}>
        Nhập mã trong hình
      </label>
      <input
        id={`${purpose}-captcha-answer`}
        className="form-control form-control-lg rounded-4 auth-captcha-input"
        value={proof.captchaAnswer}
        onChange={(event) => onChange({
          captchaToken: challenge?.captchaToken || '',
          captchaAnswer: event.target.value,
        })}
        placeholder="Ví dụ: 4KX8M"
        autoComplete="off"
        spellCheck={false}
        required
        disabled={loading || !challenge}
      />
      {loadError && <small className="text-danger d-block mt-2">{loadError}</small>}
    </section>
  );
}
