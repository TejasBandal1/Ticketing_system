import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const LoginPage = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState("login");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "user", // Default role
    secretKey: "", // For admin/tech team registration
  });
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (endpoint) => {
    setIsLoading(true);

    const { email, password, confirmPassword, role, secretKey } = formData;

    try {
      const payload =
        activeTab === "register"
          ? { email, password, confirm_password: confirmPassword, role, secret_key: secretKey }
          : activeTab === "reset"
          ? { email }
          : { email, password };

      const response = await fetch(`http://localhost:8000/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (activeTab === "login") {
          localStorage.setItem("authToken", data.token); // Store JWT token
          onLogin(data.role); // Pass role from API response
          // Debug log to check the role returned
          console.log("User Role on Login:", data.role);
          // Redirect based on role
          if (data.role === "tech") {
            navigate("/tech-dashboard"); // Redirect to tech dashboard
          } else {
            navigate("/dashboard"); // Redirect to user dashboard
          }
          toast.success("Login successful!");
        } else {
          toast.success(data.message || "Registration successful!");
          if (activeTab === "register") setActiveTab("login");
        }
      } else {
        toast.error(data.detail || "An error occurred");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderForm = () => {
    switch (activeTab) {
      case "login":
        return (
          <>
            <InputField
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
            <InputField
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
            />
            <SubmitButton
              isLoading={isLoading}
              onClick={() => handleSubmit("login")}
              label="Login"
            />
          </>
        );
      case "register":
        return (
          <>
            <InputField
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
            <InputField
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
            />
            <InputField
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            <SelectField
              label="Register As"
              name="role"
              value={formData.role}
              onChange={handleChange}
              options={[
                { value: "user", label: "User" },
                { value: "admin", label: "Admin" },
                { value: "tech", label: "Tech Team" },
              ]}
            />
            {["admin", "tech"].includes(formData.role) && (
              <InputField
                label="Secret Key"
                name="secretKey"
                value={formData.secretKey}
                onChange={handleChange}
              />
            )}
            <SubmitButton
              isLoading={isLoading}
              onClick={() => handleSubmit("register")}
              label="Register"
            />
          </>
        );
      case "reset":
        return (
          <>
            <InputField
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
            <SubmitButton
              isLoading={isLoading}
              onClick={() => handleSubmit("reset-password")}
              label="Send Reset Link"
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-teal-500">
      <div className="bg-white p-8 rounded-lg shadow-xl w-96">
        <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
        <form>{renderForm()}</form>
      </div>
      <ToastContainer />
    </div>
  );
};

const TabBar = ({ activeTab, setActiveTab }) => (
  <div className="flex justify-between mb-6 border-b-2 border-gray-200">
    {["login", "register", "reset"].map((tab) => (
      <button
        key={tab}
        className={`pb-2 transition-colors duration-300 ${activeTab === tab
          ? "text-teal-600 border-b-2 border-teal-600 font-bold"
          : "text-gray-500 hover:text-teal-600"
          }`}
        onClick={() => setActiveTab(tab)}
      >
        {tab.charAt(0).toUpperCase() + tab.slice(1)}
      </button>
    ))}
  </div>
);

const InputField = ({ label, name, type = "text", value, onChange }) => (
  <div className="mb-4">
    <label className="block text-gray-700 mb-2 font-medium">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
    />
  </div>
);

const SelectField = ({ label, name, value, onChange, options }) => (
  <div className="mb-4">
    <label className="block text-gray-700 mb-2 font-medium">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const SubmitButton = ({ isLoading, onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full bg-teal-600 text-white py-2 rounded-lg font-semibold hover:bg-teal-700 transition duration-300"
    disabled={isLoading}
  >
    {isLoading ? "Processing..." : label}
  </button>
);

export default LoginPage;
