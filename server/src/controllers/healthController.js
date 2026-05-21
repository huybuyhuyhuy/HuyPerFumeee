export function healthController(_req, res) {
  res.json({
    ok: true,
    service: 'huyperfume-server',
    phase: 1,
  });
}
