import { useState } from "react";
import Button from "../ui/Button";

export default function RentForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    month: "",
    expected_date: "",
    paid_date: "",
    amount: "",
    payment_mode: "Cash",
    remarks: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2 ml-1">Month *</label>
          <input
            type="month"
            required
            className="input-field"
            value={formData.month}
            onChange={(e) =>
              setFormData({ ...formData, month: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 ml-1">
            Expected Date *
          </label>
          <input
            type="date"
            required
            className="input-field"
            value={formData.expected_date}
            onChange={(e) =>
              setFormData({ ...formData, expected_date: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 ml-1">
            Paid Date
          </label>
          <input
            type="date"
            className="input-field"
            value={formData.paid_date}
            onChange={(e) =>
              setFormData({ ...formData, paid_date: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 ml-1">
            Amount *
          </label>
          <input
            type="number"
            required
            className="input-field"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 ml-1">
            Payment Mode
          </label>
          <select
            className="input-field"
            value={formData.payment_mode}
            onChange={(e) =>
              setFormData({ ...formData, payment_mode: e.target.value })
            }>
            <option>Cash</option>
            <option>UPI</option>
            <option>Bank Transfer</option>
            <option>Cheque</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 ml-1">Remarks</label>
        <textarea
          className="input-field"
          rows="2"
          value={formData.remarks}
          onChange={(e) =>
            setFormData({ ...formData, remarks: e.target.value })
          }
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button type="submit" className="w-full sm:w-auto">
          Save
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="w-full sm:w-auto">
          Cancel
        </Button>
      </div>
    </form>
  );
}
