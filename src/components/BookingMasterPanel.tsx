import React, { useState } from 'react';

interface Booking {
  id: number;
  customerName: string;
  mobile: string;
  service: string;
  date: string;
  status: 'Pending' | 'In Progress' | 'Completed';
}

const BookingMasterPanel: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: 1,
      customerName: 'Ramesh Kumar',
      mobile: '9876543210',
      service: 'Suit Stitching',
      date: '2025-01-10',
      status: 'Pending',
    },
    {
      id: 2,
      customerName: 'Amit Sharma',
      mobile: '9123456789',
      service: 'Sherwani',
      date: '2025-01-12',
      status: 'In Progress',
    },
  ]);

  const updateStatus = (id: number, status: Booking['status']) => {
    setBookings(prev =>
      prev.map(b =>
        b.id === id ? { ...b, status } : b
      )
    );
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>📋 Booking Master Panel</h2>

      <table width="100%" border={1} cellPadding={8} style={{ marginTop: 15 }}>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Mobile</th>
            <th>Service</th>
            <th>Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map(b => (
            <tr key={b.id}>
              <td>{b.customerName}</td>
              <td>{b.mobile}</td>
              <td>{b.service}</td>
              <td>{b.date}</td>
              <td>{b.status}</td>
              <td>
                <select
                  value={b.status}
                  onChange={e =>
                    updateStatus(b.id, e.target.value as Booking['status'])
                  }
                >
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BookingMasterPanel;
