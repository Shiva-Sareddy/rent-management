export default function PaymentTable({ payments }) {
  const getStatus = (payment) => {
    if (!payment.paid_date) return "Pending";
    return new Date(payment.paid_date) > new Date(payment.expected_date)
      ? "Late"
      : "Paid";
  };

  const getStatusColor = (status) => {
    if (status === "Paid") return "text-green-600 bg-green-100";
    if (status === "Late") return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto hide-scrollbar">
        <table className="w-full min-w-[600px]">
          <thead className="bg-indigo-600 text-white">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Month</th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Expected
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">Paid</th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">Mode</th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payments.map((payment) => {
              const status = getStatus(payment);
              return (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    {new Date(payment.month).toLocaleDateString("en-IN", {
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(payment.expected_date).toLocaleDateString(
                      "en-IN",
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {payment.paid_date
                      ? new Date(payment.paid_date).toLocaleDateString("en-IN")
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    ₹{payment.amount}
                  </td>
                  <td className="px-4 py-3 text-sm">{payment.payment_mode}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
