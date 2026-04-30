import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Cpu, ShieldAlert, Lock, Phone, KeyRound, 
  ArrowRight, ShieldCheck, Database, Activity 
} from "lucide-react";
import { authApi } from "../api/erpApi";
import { useAuth } from "../context/AuthContext";

/**
 * Login: The Identity Firewall & Security Entry Node
 * Designed with a high-fidelity industrial aesthetic for an elite first impression.
 */
const Login = () => {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [emailMasked, setEmailMasked] = useState("");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleStep1 = async (e) => {
    e.preventDefault();
    if (!mobile || !password) {
      setError("MANDATORY_FIELD_VOID");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await authApi.loginStep1({ mobile, password });
      setEmailMasked(res.data.emailMasked);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.msg || "AUTH_PROTOCOL_DENIED");
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError("VERIFICATION_NULL");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await authApi.loginStep2({ mobile, otp });
      login(res.data.user, res.data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.msg || "INVALID_CIPHER_NODE");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative overflow-hidden font-sans selection:bg-indigo-100">
      
      {/* Decorative Flux Background (Desktop Only) */}
      <div className="hidden lg:block absolute top-0 left-0 w-full h-full pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full filter blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-900/5 rounded-full filter blur-[120px]"></div>
      </div>

      {/* Brand Matrix Side */}
      <div className="w-full lg:w-[40%] bg-slate-900 p-12 lg:p-24 flex flex-col justify-between relative overflow-hidden shrink-0">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
             <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`, backgroundSize: '24px 24px' }}></div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10"
          >
             <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
                   <Cpu className="w-8 h-8 text-slate-900" />
                </div>
                <div>
                   <h1 className="text-3xl font-black text-white tracking-tightest leading-none italic">APEX<span className="text-slate-500 not-italic">_ERP</span></h1>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">Industrial Intelligence</p>
                </div>
             </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative z-10 space-y-8"
          >
             <h2 className="text-3xl lg:text-7xl font-black text-white leading-[0.9] tracking-tightest italic">
                SECURE<br/>
                IDENTITY<br/>
                <span className="text-slate-600">FIREWALL</span>
             </h2>
             <div className="flex flex-col gap-4 max-w-xs">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Global Access Reconciliation Active</span>
                </div>
                <div className="flex items-center gap-3 opacity-40">
                   <div className="w-1.5 h-1.5 bg-slate-700 rounded-full"></div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">AES-256 Protocol Synchronized</span>
                </div>
             </div>
          </motion.div>

          <div className="relative z-10 pt-12 border-t border-slate-800">
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] leading-relaxed italic">
                Authorized access only. All sessions are monitored via the central telemetry core.
             </p>
          </div>
      </div>

      {/* Auth Control Hub */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-24 relative z-10">
         <div className="w-full max-w-lg">
            
            {/* Context Heading */}
            <div className="mb-12">
               <h3 className="text-4xl font-black text-slate-900 tracking-tightest uppercase italic mb-2 leading-none">
                  {step === 1 ? 'Initialization' : 'Verification'}
               </h3>
               <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  {step === 1 ? 'Synchronize your credentials to access the hub' : 'Multi-factor authentication required for clearance'}
               </p>
            </div>

            {/* Error Alert Box */}
            <AnimatePresence>
               {error && (
                 <motion.div 
                   initial={{ opacity: 0, y: -10, height: 0 }}
                   animate={{ opacity: 1, y: 0, height: 'auto' }}
                   exit={{ opacity: 0, y: -10, height: 0 }}
                   className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-8 flex items-center gap-4 overflow-hidden"
                 >
                    <div className="w-8 h-8 bg-rose-500 text-white rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-rose-200">
                       <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest leading-none mb-1">Security Alert</p>
                       <p className="text-xs font-black text-rose-900 uppercase italic tracking-tightest">{error}</p>
                    </div>
                 </motion.div>
               )}
            </AnimatePresence>

            {/* Auth Interaction Layer */}
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl shadow-slate-900/5 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-1000">
                  <Lock className="w-48 h-48 rotate-12" />
               </div>

               <AnimatePresence mode="wait">
                  {step === 1 ? (
                    <motion.form 
                      key="step1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-10 relative z-10" 
                      onSubmit={handleStep1}
                    >
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 italic">Telemetry Node (Mobile)</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none group/icon">
                             <Phone className="w-5 h-5 text-slate-300 group-focus-within/icon:text-indigo-600 transition-colors" />
                          </div>
                          <input
                            type="tel"
                            className="erp-input !py-5 !pl-16 !bg-slate-50 focus:!bg-white"
                            placeholder="OPERATIONAL_NODE_UID"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 italic">Master Credentials</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                             <KeyRound className="w-5 h-5 text-slate-300" />
                          </div>
                          <input
                            type="password"
                            className="erp-input !py-5 !pl-16 !bg-slate-50 focus:!bg-white font-mono tracking-widest"
                            placeholder="SECURE_CIPHER_STRING"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full erp-button-primary !py-7 !bg-slate-900 !rounded-[2.5rem] hover:!bg-black group"
                      >
                         <span className="flex items-center gap-3">
                            {loading ? "Capturing Node..." : "Initiate Authorization"}
                            {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" /> }
                         </span>
                      </button>
                    </motion.form>
                  ) : (
                    <motion.form 
                      key="step2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-10 flex flex-col items-center text-center relative z-10"
                      onSubmit={handleStep2}
                    >
                      <div className="w-14 h-14 bg-indigo-50 rounded-[2rem] flex items-center justify-center mb-4 border border-indigo-100 shadow-xl shadow-indigo-500/10">
                         <ShieldCheck className="w-10 h-10 text-indigo-600 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tightest">Clearance Required</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3 leading-loose italic max-w-xs">
                           A security cipher has been transmitted to your linked relay node:<br/>
                           <span className="text-indigo-600 not-italic border-b border-indigo-200">{emailMasked}</span>
                        </p>
                      </div>

                      <div className="w-full">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 block italic">Enter 6-Digit Cipher</label>
                         <input
                           type="text"
                           maxLength="6"
                           className="w-full text-center text-3xl font-black italic tracking-[0.5em] py-3 bg-slate-50 border-none rounded-[2.5rem] text-indigo-600 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                           placeholder="000000"
                           value={otp}
                           onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                         />
                      </div>

                      <div className="w-full flex gap-4">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="flex-1 py-6 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 tracking-widest italic"
                        >
                          Abort Flow
                        </button>
                        <button
                          type="submit"
                          disabled={loading || otp.length < 6}
                          className="flex-[2] erp-button-primary !py-6 !bg-indigo-600 !rounded-[2rem] hover:!bg-indigo-700 shadow-indigo-200"
                        >
                          {loading ? "Verifying..." : "Confirm Clearance"}
                        </button>
                      </div>
                    </motion.form>
                  )}
               </AnimatePresence>
            </div>
            
            {/* System Telemetry Footer */}
            <div className="mt-12 flex justify-between items-center opacity-40">
               <div className="flex items-center gap-3">
                  <Database className="w-3 h-3 text-slate-400" />
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Operational Cluster: IN-WEST-1</span>
               </div>
               <div className="flex items-center gap-3">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Latency: 14MS</span>
                  <Activity className="w-3 h-3 text-emerald-500" />
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Login;
