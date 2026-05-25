function splitNotes(value) {
  return String(value || '')
    .split(/[,/|•]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ProductStorytelling({ product }) {
  const notes = splitNotes(product?.scentNotes);
  const topNotes = notes.slice(0, 3);
  const mood = product?.gender
    ? `${product.gender} · ${product.brand?.name || 'Signature scent'}`
    : 'Curated to feel intimate, elegant, and memorable';

  const occasionList = [
    'Buổi tối sang trọng',
    'Hẹn hò tinh tế',
    'Sự kiện quan trọng',
    'Nét chấm phá hằng ngày',
  ];

  return (
    <section className="luxury-surface product-storytelling-section mt-4">
      <div className="storytelling-grid">
        <article className="storytelling-panel storytelling-panel-large">
          <span className="story-eyebrow">Fragrance narrative</span>
          <h2 className="story-title">Cảm được mùi hương trước cả khi chạm vào da.</h2>
          <p className="story-copy">
            {product?.description || 'Tầng hương mở ra như một khung cảnh sang trọng: mượt, tinh tế và đầy cảm xúc.'}
          </p>
          <div className="story-atmosphere">
            <div>
              <strong>Mood</strong>
              <span>{mood}</span>
            </div>
            <div>
              <strong>Longevity</strong>
              <span>{product?.rating ? `Cảm nhận nổi bật ${Math.min(10, Math.max(6, Math.round(product.rating * 2)))}h` : 'Tỏa hương bền bỉ'}</span>
            </div>
            <div>
              <strong>Projection</strong>
              <span>{product?.soldCount ? 'Elegant sillage' : 'Near-to-medium aura'}</span>
            </div>
          </div>
        </article>

        <article className="storytelling-panel">
          <span className="story-eyebrow">Scent pyramid</span>
          <h3 className="story-subtitle">Tầng hương</h3>
          <div className="scent-pyramid">
            <div>
              <strong>Top notes</strong>
              <span>{topNotes.length > 0 ? topNotes.join(', ') : 'Fresh opening'}</span>
            </div>
            <div>
              <strong>Heart notes</strong>
              <span>{notes[3] || notes[0] || 'Velvety floral core'}</span>
            </div>
            <div>
              <strong>Base notes</strong>
              <span>{notes[4] || notes[1] || 'Warm sensual trail'}</span>
            </div>
          </div>
        </article>

        <article className="storytelling-panel storytelling-panel-wide">
          <span className="story-eyebrow">Occasion fit</span>
          <h3 className="story-subtitle">Gợi ý thời điểm sử dụng</h3>
          <div className="occasion-chips">
            {occasionList.map((item) => (
              <span key={item} className="occasion-chip">{item}</span>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
