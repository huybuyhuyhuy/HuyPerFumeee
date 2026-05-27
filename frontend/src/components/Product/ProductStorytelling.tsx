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
    : 'Tuyển chọn để mang lại cảm giác gần gũi, thanh lịch và đáng nhớ';

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
          <span className="story-eyebrow">Câu chuyện mùi hương</span>
          <h2 className="story-title">Cảm được mùi hương trước cả khi chạm vào da.</h2>
          <p className="story-copy">
            {product?.description || 'Tầng hương mở ra như một khung cảnh sang trọng: mượt, tinh tế và đầy cảm xúc.'}
          </p>
          <div className="story-atmosphere">
            <div>
              <strong>Tâm trạng</strong>
              <span>{mood}</span>
            </div>
            <div>
              <strong>Độ lưu hương</strong>
              <span>{product?.rating ? `Cảm nhận nổi bật ${Math.min(10, Math.max(6, Math.round(product.rating * 2)))}h` : 'Tỏa hương bền bỉ'}</span>
            </div>
            <div>
              <strong>Độ tỏa hương</strong>
              <span>{product?.soldCount ? 'Vệt hương thanh lịch' : 'Độ tỏa gần đến trung bình'}</span>
            </div>
          </div>
        </article>

        <article className="storytelling-panel">
          <span className="story-eyebrow">Tầng hương</span>
          <h3 className="story-subtitle">Tầng hương</h3>
          <div className="scent-pyramid">
            <div>
              <strong>Hương đầu</strong>
              <span>{topNotes.length > 0 ? topNotes.join(', ') : 'Mở đầu tươi mát'}</span>
            </div>
            <div>
              <strong>Hương giữa</strong>
              <span>{notes[3] || notes[0] || 'Tầng hoa nhung lụa'}</span>
            </div>
            <div>
              <strong>Hương cuối</strong>
              <span>{notes[4] || notes[1] || 'Dấu ấn ấm áp quyến rũ'}</span>
            </div>
          </div>
        </article>

        <article className="storytelling-panel storytelling-panel-wide">
          <span className="story-eyebrow">Dịp phù hợp</span>
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
