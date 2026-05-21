import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function unwrapApiData(payload) {
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
}

export function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .get('/admin/users')
      .then((res) => {
        const data = unwrapApiData(res.data);
        setUsers(Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : []);
      })
      .catch((err) => setError(err?.response?.data?.message || 'Không tải được danh sách người dùng.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-5"><div className="spinner-border" /></div>;

  return (
    <div className="container py-4">
      <h3 className="mb-4">Admin - Người dùng</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="table-responsive">
        <table className="table table-hover table-sm">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Tên</th>
              <th>Email</th>
              <th>SĐT</th>
              <th>Vai trò</th>
              <th>Ngày tạo</th>
              <th>Đơn hàng</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>#{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.phone || '-'}</td>
                <td>{user.role}</td>
                <td>{user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '-'}</td>
                <td>
                  <Link
                    to={`/orders?userId=${user.id}&userName=${encodeURIComponent(user.name || user.email || '')}`}
                    className="btn btn-sm btn-outline-dark"
                  >
                    Xem
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
