import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import Layout from "../components/layout/Layout";
import Card from "../components/ui/Card";

export default function Reports() {
  const [tenants, setTenants] = useState([]);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({
    totalCollected: 0,
    totalPending: 0,
    latePayments: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: tenantsData } = await supabase
      .from("tenants")
      .select("*")
      .eq("user_id", user.id);
    const { data: paymentsData } = await supabase
      .from("rent_payments")
      .select("*");

    setTenants(tenantsData || []);
    setPayments(paymentsData || []);

    const totalCollected =
      paymentsData
        ?.filter((p) => p.paid_date)
        .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
    const totalPending =
      paymentsData
        ?.filter((p) => !p.paid_date)
        .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
    const latePayments =
      paymentsData?.filter(
        (p) => p.paid_date && new Date(p.paid_date) > new Date(p.expected_date),
      ).length || 0;

    setStats({ totalCollected, totalPending, latePayments });
  };

  return (
    <Layout>
      <div className="py-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6">
          Reports
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <Card>
            <p className="text-sm text-gray-600">Total Collected</p>
            <p className="text-2xl lg:text-3xl font-bold mt-2 text-green-600">
              ₹{stats.totalCollected}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600">Total Pending</p>
            <p className="text-2xl lg:text-3xl font-bold mt-2 text-red-600">
              ₹{stats.totalPending}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600">Late Payments</p>
            <p className="text-2xl lg:text-3xl font-bold mt-2 text-orange-600">
              {stats.latePayments}
            </p>
          </Card>
        </div>

        <Card>
          <h2 className="text-lg font-bold mb-4">Tenant Summary</h2>
          <div className="overflow-x-auto hide-scrollbar">
            <table className="w-full min-w-[600px]">
              <thead className="bg-black text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Tenant
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    House
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Monthly Rent
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Total Paid
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Pending
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tenants.map((tenant) => {
                  const tenantPayments = payments.filter(
                    (p) => p.tenant_id === tenant.id,
                  );
                  const totalPaid = tenantPayments
                    .filter((p) => p.paid_date)
                    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
                  const pending = tenantPayments
                    .filter((p) => !p.paid_date)
                    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

                  return (
                    <tr key={tenant.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">
                        {tenant.full_name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {tenant.house_number}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        ₹{tenant.monthly_rent}
                      </td>
                      <td className="px-4 py-3 text-sm text-green-600">
                        ₹{totalPaid}
                      </td>
                      <td className="px-4 py-3 text-sm text-red-600">
                        ₹{pending}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
