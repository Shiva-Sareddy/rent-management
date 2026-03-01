import { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faUser,
  faUsers,
  faCheck,
  faChevronRight,
  faChevronLeft,
  faUpload,
  faMinus,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";

export default function AddTenant() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    house_number: "",
    house_location: "",
    monthly_rent: "",
    advance_amount: "",
    agreement_start_date: "",
    full_name: "",
    phone: "",
    aadhar_number: "",
    aadhar_file: null,
    pan_number: "",
    pan_file: null,
    has_spouse: false,
    has_children: false,
    children_count: 0,
  });

  const totalSteps = 4;

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, [field]: file }));
    }
  };

  const validateStep = (step) => {
    setError("");
    if (step === 1) {
      if (!formData.house_number.trim()) {
        setError("Please enter house number");
        return false;
      }
      if (!formData.monthly_rent.trim()) {
        setError("Please enter monthly rent");
        return false;
      }
    }
    if (step === 2) {
      if (!formData.full_name.trim()) {
        setError("Please enter full name");
        return false;
      }
      if (!formData.phone.trim()) {
        setError("Please enter phone number");
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError("");
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;
    setIsSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let aadharUrl = "";
      let panUrl = "";

      // Upload Aadhar file to Supabase Storage
      if (formData.aadhar_file) {
        const fileName = `aadhar/${user.id}/${Date.now()}-${formData.aadhar_file.name}`;
        console.log("Uploading Aadhar file:", fileName);

        const { data: aadharData, error: aadharError } = await supabase.storage
          .from("tenant-files")
          .upload(fileName, formData.aadhar_file);

        console.log("Aadhar upload response:", aadharData);
        console.log("Aadhar upload error:", aadharError);

        if (aadharError) {
          console.error("Aadhar upload failed:", aadharError);
          setError("Failed to upload Aadhar file. Please try again.");
          setIsSubmitting(false);
          return;
        }

        if (aadharData) {
          // Get signed URL after successful upload (valid for 1 hour)
          const { data: signedUrlData } = await supabase.storage
            .from("tenant-files")
            .createSignedUrl(aadharData.path, 60 * 60);

          aadharUrl = signedUrlData.signedUrl;
          console.log("Aadhar signed URL:", aadharUrl);
        }
      }

      // Upload PAN file to Supabase Storage
      if (formData.pan_file) {
        const fileName = `pan/${user.id}/${Date.now()}-${formData.pan_file.name}`;
        console.log("Uploading PAN file:", fileName);

        const { data: panData, error: panError } = await supabase.storage
          .from("tenant-files")
          .upload(fileName, formData.pan_file);

        console.log("PAN upload response:", panData);
        console.log("PAN upload error:", panError);

        if (panError) {
          console.error("PAN upload failed:", panError);
          setError("Failed to upload PAN file. Please try again.");
          setIsSubmitting(false);
          return;
        }

        if (panData) {
          // Get signed URL after successful upload (valid for 1 hour)
          const { data: signedUrlData } = await supabase.storage
            .from("tenant-files")
            .createSignedUrl(panData.path, 60 * 60);

          panUrl = signedUrlData.signedUrl;
          console.log("PAN signed URL:", panUrl);
        }
      }

      // Prepare tenant data with file URLs
      const tenantData = {
        user_id: user.id,
        house_number: formData.house_number,
        house_location: formData.house_location,
        monthly_rent: formData.monthly_rent,
        advance_amount: formData.advance_amount,
        agreement_start_date: formData.agreement_start_date,
        full_name: formData.full_name,
        phone: formData.phone,
        aadhar_number: formData.aadhar_number,
        aadhar_file_url: aadharUrl,
        pan_number: formData.pan_number,
        pan_file_url: panUrl,
        has_spouse: formData.has_spouse,
        has_children: formData.has_children,
        children_count: formData.has_children ? formData.children_count : 0,
        rent_due_day: 5,
      };

      console.log("Inserting tenant data:", tenantData);

      // Save to database
      const { data: insertData, error: insertError } = await supabase
        .from("tenants")
        .insert([tenantData]);

      console.log("Database insert response:", insertData);
      console.log("Database insert error:", insertError);

      if (insertError) {
        console.error("Database insert failed:", insertError);
        setError("Failed to save tenant. Please try again.");
        setIsSubmitting(false);
        return;
      }

      console.log("Tenant saved successfully!");
      navigate("/tenants");
    } catch (err) {
      console.error("Error submitting form:", err);
      setError("Failed to save tenant. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepLabels = ["Property", "Personal", "Family", "Review"];

  return (
    <Layout hideSidebarToggle>
      <div className="py-12 px-5 sm:px-8 lg:px-12 min-h-screen">
        <div className="max-w-3xl lg:max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-10">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-5">
              <div
                className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
                }}
              />
            </div>
            <div className="flex justify-between">
              {stepLabels.map((label, index) => (
                <div
                  key={index}
                  className={`flex flex-col items-center ${index + 1 <= currentStep ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400"}`}>
                  <div
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-base md:text-lg font-bold ${index + 1 < currentStep ? "bg-green-500 text-white" : index + 1 === currentStep ? "bg-indigo-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500"}`}>
                    {index + 1 < currentStep ? "✓" : index + 1}
                  </div>
                  <span className="text-xs md:text-sm font-medium hidden sm:block mt-2">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 ml-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          {/* Form Card - Larger for laptop */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-10 relative">
            {/* Step 1: Property Details */}
            {currentStep === 1 && (
              <div className="space-y-5 pl-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <FontAwesomeIcon
                      icon={faHome}
                      className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
                    />
                  </div>
                  <h2 className="text-lg font-semibold dark:text-white">
                    Property Details
                  </h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                      House Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.house_number}
                      onChange={(e) =>
                        updateFormData("house_number", e.target.value)
                      }
                      placeholder="e.g., A-101"
                      className="w-full px-4 py-3 text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                      House Location
                    </label>
                    <input
                      type="text"
                      value={formData.house_location}
                      onChange={(e) =>
                        updateFormData("house_location", e.target.value)
                      }
                      placeholder="e.g., Main Street, City"
                      className="w-full px-4 py-3 text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                        Monthly Rent <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.monthly_rent}
                        onChange={(e) =>
                          updateFormData("monthly_rent", e.target.value)
                        }
                        placeholder="e.g., 15000"
                        className="w-full px-4 py-3 text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                        Advance Amount
                      </label>
                      <input
                        type="number"
                        value={formData.advance_amount}
                        onChange={(e) =>
                          updateFormData("advance_amount", e.target.value)
                        }
                        placeholder="e.g., 30000"
                        className="w-full px-4 py-3 text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                      Rent Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.agreement_start_date}
                      onChange={(e) =>
                        updateFormData("agreement_start_date", e.target.value)
                      }
                      className="w-full px-4 py-3 text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Personal Details */}
            {currentStep === 2 && (
              <div className="space-y-5 pl-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <FontAwesomeIcon
                      icon={faUser}
                      className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
                    />
                  </div>
                  <h2 className="text-lg font-semibold dark:text-white">
                    Personal Details
                  </h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) =>
                        updateFormData("full_name", e.target.value)
                      }
                      placeholder="John Smith"
                      className="w-full px-4 py-3 text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateFormData("phone", e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-4 py-3 text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                      Aadhar Number
                    </label>
                    <input
                      type="text"
                      value={formData.aadhar_number}
                      onChange={(e) =>
                        updateFormData("aadhar_number", e.target.value)
                      }
                      placeholder="e.g., 1234 5678 9012"
                      className="w-full px-4 py-3 text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                      Aadhar File
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, "aadhar_file")}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex items-center px-4 py-3 text-base rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-indigo-500 cursor-pointer">
                        <FontAwesomeIcon
                          icon={faUpload}
                          className="w-5 h-5 text-gray-400 mr-3"
                        />
                        <span className="text-sm text-gray-500">
                          {formData.aadhar_file
                            ? formData.aadhar_file.name
                            : "Click to upload Aadhar"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                        PAN Number{" "}
                        <span className="text-gray-400 text-xs">
                          (Optional)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={formData.pan_number}
                        onChange={(e) =>
                          updateFormData("pan_number", e.target.value)
                        }
                        placeholder="e.g., ABCDE1234F"
                        className="w-full px-4 py-3 text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                        PAN File{" "}
                        <span className="text-gray-400 text-xs">
                          (Optional)
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileChange(e, "pan_file")}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex items-center px-4 py-3 text-base rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-indigo-500 cursor-pointer">
                          <FontAwesomeIcon
                            icon={faUpload}
                            className="w-5 h-5 text-gray-400 mr-3"
                          />
                          <span className="text-sm text-gray-500 truncate">
                            {formData.pan_file
                              ? formData.pan_file.name
                              : "Click to upload"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Family Details */}
            {currentStep === 3 && (
              <div className="space-y-5 pl-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <FontAwesomeIcon
                      icon={faUsers}
                      className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
                    />
                  </div>
                  <h2 className="text-lg font-semibold dark:text-white">
                    Family Details
                  </h2>
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-600 ml-1">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-base font-medium text-gray-700 dark:text-gray-300">
                        Spouse
                      </span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={formData.has_spouse}
                          onChange={(e) =>
                            updateFormData("has_spouse", e.target.checked)
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 rounded-full bg-gray-200 dark:bg-gray-600 peer-checked:bg-indigo-600 transition-colors cursor-pointer flex items-center px-0.5">
                          <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform peer-checked:translate-x-5 flex items-center justify-center">
                            <FontAwesomeIcon
                              icon={faCheck}
                              className="w-3 h-3 text-indigo-600 opacity-0 peer-checked:opacity-100"
                            />
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                  <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-600 ml-1">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-base font-medium text-gray-700 dark:text-gray-300">
                        Children
                      </span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={formData.has_children}
                          onChange={(e) =>
                            updateFormData("has_children", e.target.checked)
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 rounded-full bg-gray-200 dark:bg-gray-600 peer-checked:bg-indigo-600 transition-colors cursor-pointer flex items-center px-0.5">
                          <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform peer-checked:translate-x-5 flex items-center justify-center">
                            <FontAwesomeIcon
                              icon={faCheck}
                              className="w-3 h-3 text-indigo-600 opacity-0 peer-checked:opacity-100"
                            />
                          </div>
                        </div>
                      </div>
                    </label>
                    {formData.has_children && (
                      <div className="mt-3 flex items-center gap-3 ml-1">
                        <span className="text-sm text-gray-500">Count:</span>
                        <button
                          type="button"
                          onClick={() =>
                            updateFormData(
                              "children_count",
                              Math.max(0, formData.children_count - 1),
                            )
                          }
                          className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                          <FontAwesomeIcon icon={faMinus} className="w-5 h-5" />
                        </button>
                        <span className="text-base font-medium w-8 text-center">
                          {formData.children_count}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateFormData(
                              "children_count",
                              formData.children_count + 1,
                            )
                          }
                          className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                          <FontAwesomeIcon icon={faPlus} className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-4 pl-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <FontAwesomeIcon
                      icon={faCheck}
                      className="w-5 h-5 text-green-600 dark:text-green-400"
                    />
                  </div>
                  <h2 className="text-lg font-semibold dark:text-white">
                    Review Details
                  </h2>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg ml-1">
                    <span className="font-semibold text-gray-600 dark:text-gray-300">
                      Property:
                    </span>{" "}
                    {formData.house_number || "-"}, ₹
                    {formData.monthly_rent || "-"}
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg ml-1">
                    <span className="font-semibold text-gray-600 dark:text-gray-300">
                      Personal:
                    </span>{" "}
                    {formData.full_name || "-"}, {formData.phone || "-"}
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg ml-1">
                    <span className="font-semibold text-gray-600 dark:text-gray-300">
                      Family:
                    </span>{" "}
                    Spouse: {formData.has_spouse ? "Yes" : "No"}, Children:{" "}
                    {formData.has_children ? formData.children_count : "No"}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-6 pl-2">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2.5 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600">
                  Back
                </button>
              )}
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 px-6 py-2.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-2.5 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
                  {isSubmitting ? "Saving..." : "Save Tenant"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
