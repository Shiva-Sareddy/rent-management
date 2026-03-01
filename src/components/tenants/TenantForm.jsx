import { useState } from "react";
import Button from "../ui/Button";

export default function TenantForm({ tenant, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(
    tenant || {
      full_name: "",
      phone: "",
      aadhar: "",
      pan: "",
      family_details: "",
      house_number: "",
      monthly_rent: "",
      advance_amount: "",
      agreement_start_date: "",
      rent_due_day: 5,
    },
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2 ml-1">
            Full Name *
          </label>
          <input
            type="text"
            required
            className="input-field"
            value={formData.full_name}
            onChange={(e) =>
              setFormData({ ...formData, full_name: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 ml-1">Phone</label>
          <input
            type="tel"
            className="input-field"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 ml-1">
            Aadhar Number
          </label>
          <input
            type="text"
            className="input-field"
            value={formData.aadhar}
            onChange={(e) =>
              setFormData({ ...formData, aadhar: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 ml-1">
            PAN Number
          </label>
          <input
            type="text"
            className="input-field"
            value={formData.pan}
            onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 ml-1">
            House Number *
          </label>
          <input
            type="text"
            required
            className="input-field"
            value={formData.house_number}
            onChange={(e) =>
              setFormData({ ...formData, house_number: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 ml-1">
            Monthly Rent *
          </label>
          <input
            type="number"
            required
            className="input-field"
            value={formData.monthly_rent}
            onChange={(e) =>
              setFormData({ ...formData, monthly_rent: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 ml-1">
            Advance Amount
          </label>
          <input
            type="number"
            className="input-field"
            value={formData.advance_amount}
            onChange={(e) =>
              setFormData({ ...formData, advance_amount: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 ml-1">
            Agreement Start Date
          </label>
          <input
            type="date"
            className="input-field"
            value={formData.agreement_start_date}
            onChange={(e) =>
              setFormData({ ...formData, agreement_start_date: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 ml-1">
            Rent Due Day
          </label>
          <input
            type="number"
            min="1"
            max="31"
            className="input-field"
            value={formData.rent_due_day}
            onChange={(e) =>
              setFormData({ ...formData, rent_due_day: e.target.value })
            }
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 ml-1">
          Family Details
        </label>
        <textarea
          className="input-field"
          rows="3"
          value={formData.family_details}
          onChange={(e) =>
            setFormData({ ...formData, family_details: e.target.value })
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
