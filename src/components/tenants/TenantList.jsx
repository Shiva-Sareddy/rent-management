import Card from '../ui/Card'
import Button from '../ui/Button'

export default function TenantList({ tenants, onEdit, onDelete, onView }) {
  const maskAadhar = (aadhar) => {
    if (!aadhar || aadhar.length < 4) return aadhar
    return '****' + aadhar.slice(-4)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tenants.map(tenant => (
        <Card key={tenant.id}>
          <h3 className="text-lg font-bold mb-2">{tenant.full_name}</h3>
          <div className="space-y-1 text-sm text-gray-600 mb-4">
            <p>House: {tenant.house_number}</p>
            <p>Rent: ₹{tenant.monthly_rent}</p>
            <p>Phone: {tenant.phone}</p>
            <p>Aadhar: {maskAadhar(tenant.aadhar)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => onView(tenant)} className="flex-1 text-sm py-2">View</Button>
            <Button onClick={() => onEdit(tenant)} variant="secondary" className="flex-1 text-sm py-2">Edit</Button>
            <Button onClick={() => onDelete(tenant.id)} variant="secondary" className="text-sm py-2">Delete</Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
