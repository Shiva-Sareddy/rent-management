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

  // Array of avatar color classes
  const avatarColors = [
    "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300",
    "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
    "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300",
    "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300",
    "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300",
    "bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-300",
    "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300",
    "bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-300",
    "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300",
    "bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-300",
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300",
    "bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300",
  ];

  // Get color based on tenant name
  const getAvatarColor = (name) => {
    const index = name.charCodeAt(0) % avatarColors.length;
    return avatarColors[index];
  };

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

        {/* Table View - Horizontally scrollable on mobile */}
        <div className="overflow-x-auto hide-scrollbar [-ms-overflow-style:'scrollbar'] [scrollbar-width:'thin']">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="py-3 px-4 text-left text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Name
                </th>
                <th className="py-3 px-4 text-left text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Phone
                </th>
                <th className="py-3 px-4 text-left text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Rent
                </th>
                <th className="py-3 px-4 text-left text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map((tenant) => (
                <tr
                  key={tenant.id}
                  className="border-b border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-4 border-white dark:border-gray-700 ${getAvatarColor(tenant.full_name)}`}>
                        {tenant.full_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {tenant.full_name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {tenant.phone || "-"}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    ₹{tenant.monthly_rent?.toLocaleString() || "-"}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/tenants/${tenant.id}`)}
                        className="w-9 h-9 rounded-full bg-black dark:bg-gray-700 flex items-center justify-center">
                        <FontAwesomeIcon
                          icon={faEye}
                          className="w-4.1 h-4.1 text-white"
                        />
                      </button>
                      <button
                        onClick={() => handleDelete(tenant.id)}
                        className="w-9 h-9 rounded-full bg-red-500 dark:bg-red-600 flex items-center justify-center">
                        <FontAwesomeIcon
                          icon={faTrash}
                          className="w-4.1 h-4.1 text-white"
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
