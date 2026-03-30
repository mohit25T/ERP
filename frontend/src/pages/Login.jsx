import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/erpApi";
import { useAuth } from "../context/AuthContext";
import { KeyRound, Phone, AlertCircle, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Login = () => {
  // Step 1 State
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  
  // Step 2 State
  const [otp, setOtp] = useState("");
  const [emailMasked, setEmailMasked] = useState("");

  // Flow State
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleStep1 = async (e) => {
    e.preventDefault();
    if (!mobile || !password) {
      setError("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await authApi.loginStep1({ mobile, password });
      setEmailMasked(res.data.emailMasked);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError("Please enter the verification code");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await authApi.loginStep2({ mobile, otp });
      
      // Successfully authenticated
      login(res.data.user, res.data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.msg || "Invalid OTP code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          NexusERP Sign In
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 1 ? "Enter your mobile number to get started" : "Security Verification required"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md overflow-hidden">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100 min-h-[360px] flex flex-col">
          
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-center gap-2 text-sm font-medium mb-6">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 flex-1" 
                onSubmit={handleStep1}
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="e.g. 1234567890"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} // numbers only
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
                  >
                    {loading ? "Authenticating..." : "Continue"}
                  </button>
                </div>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form 
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 flex-1 flex flex-col items-center text-center"
                onSubmit={handleStep2}
              >
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                   <ShieldCheck className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">2-Step Verification</h3>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                    We sent an authentication code to your registered email <br />(<span className="font-semibold text-gray-700">{emailMasked}</span>).
                  </p>
                </div>

                <div className="w-full pt-4">
                  <input
                    type="text"
                    maxLength="6"
                    className="appearance-none block w-full text-center text-2xl tracking-[0.5em] py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="------"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                <div className="w-full pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    className="flex-[2] flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
                  >
                    {loading ? "Verifying..." : "Verify Code"}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
};

export default Login;
