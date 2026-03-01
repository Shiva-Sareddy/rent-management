import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faTrash } from "@fortawesome/free-solid-svg-icons";

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [filteredTenants, setFilteredTenants] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = tenants.filter(
        (t) =>
          t.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.phone?.includes(searchTerm),
      );
      setFilteredTenants(filtered);
    } else {
      setFilteredTenants(tenants);
    }
  }, [searchTerm, tenants]);

  const fetchTenants = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data } = await supabase
      .from("tenants")
      .select("*")
      .eq("user_id", user.id);
    setTenants(data || []);
    setFilteredTenants(data || []);
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this tenant?")) {
      await supabase.from("tenants").delete().eq("id", id);
      fetchTenants();
    }
  };

  return (
    <Layout>
      <div className="py-12 px-2 sm:px-4 md:px-6">
        <div className="mb-6 px-1">
          <input
            type="text"
            placeholder="Search by name or phone..."
            className="input-field"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Desktop View - Table */}
        <div className="hidden md:block overflow-x-auto hide-scrollbar">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Name
                </th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Phone
                </th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Rent
                </th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map((tenant) => (
                <tr
                  key={tenant.id}
                  className="border-b border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="py-3 px-6 text-gray-900 dark:text-gray-100">
                    {tenant.full_name}
                  </td>
                  <td className="py-3 px-6 text-gray-600 dark:text-gray-400">
                    {tenant.phone || "-"}
                  </td>
                  <td className="py-3 px-6 text-gray-600 dark:text-gray-400">
                    ₹{tenant.monthly_rent?.toLocaleString() || "-"}
                  </td>
                  <td className="py-3 px-6">
                    <div className="flex gap-3">
                      <button
                        onClick={() => navigate(`/tenants/${tenant.id}`)}
                        className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:scale-110 flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md">
                        <FontAwesomeIcon
                          icon={faEye}
                          className="w-5 h-5 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                        />
                      </button>
                      <button
                        onClick={() => handleDelete(tenant.id)}
                        className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30 hover:scale-110 flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md">
                        <FontAwesomeIcon
                          icon={faTrash}
                          className="w-5 h-5 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-500"
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View - Simple Cards */}
        <div className="md:hidden space-y-3 px-2">
          {filteredTenants.map((tenant) => (
            <div
              key={tenant.id}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {tenant.full_name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {tenant.phone || "No phone"}
                  </p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    ₹{tenant.monthly_rent?.toLocaleString() || "-"}
                  </p>
                </div>
                <div className="flex gap-2 ml-3">
                  <button
                    onClick={() => navigate(`/tenants/${tenant.id}`)}
                    className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg">
                    <FontAwesomeIcon
                      icon={faEye}
                      className="w-5 h-5 text-white"
                    />
                  </button>
                  <button
                    onClick={() => handleDelete(tenant.id)}
                    className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg">
                    <FontAwesomeIcon
                      icon={faTrash}
                      className="w-5 h-5 text-white"
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTenants.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>No tenants found</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
