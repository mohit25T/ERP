import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Cpu, ShieldAlert, Lock, Phone, KeyRound, 
  ArrowRight, ShieldCheck, Database, Activity, Sun, Moon
} from "lucide-react";
import { authApi } from "../api/erpApi";
import { useAuth } from "../context/AuthContext";

/**
 * Login: Enterprise Identity Gateway
 * Refined for professional density and dark mode support.
 */
const Login = () => {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [emailMasked, setEmailMasked] = useState("");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

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
    <div className="min-h-screen bg-background flex flex-col md:flex-row relative overflow-hidden font-sans selection:bg-primary/20 text-foreground transition-colors duration-300">
      
      {/* Theme Toggle */}
      <button 
        onClick={toggleTheme}
        className="absolute top-6 right-6 z-50 p-2 bg-card border border-border rounded-md shadow-sm hover:bg-muted transition-colors"
      >
        {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
      </button>

      {/* Brand Side - More Professional / Solid */}
      <div className="w-full lg:w-[40%] bg-slate-950 p-12 lg:p-20 flex flex-col justify-between relative overflow-hidden shrink-0 border-r border-white/5">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
             <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '32px 32px' }}></div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10"
          >
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
                   <Cpu className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                   <h1 className="text-xl font-black text-white tracking-tighter uppercase">Mohit<span className="text-primary">_ERP</span></h1>
                   <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em]">Enterprise Resource Operating System</p>
                </div>
             </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="relative z-10 space-y-6"
          >
             <h2 className="text-4xl lg:text-6xl font-black text-white leading-tight tracking-tighter uppercase">
                Secure<br/>
                Access<br/>
                Gateway
             </h2>
             <div className="h-1 w-20 bg-primary"></div>
             <div className="space-y-3">
                <div className="flex items-center gap-2">
                   <ShieldCheck className="w-4 h-4 text-primary" />
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End-to-End Encryption Active</span>
                </div>
                <div className="flex items-center gap-2">
                   <Database className="w-4 h-4 text-slate-600" />
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Multi-Cluster Data Redundancy</span>
                </div>
             </div>
          </motion.div>

          <div className="relative z-10 pt-8 border-t border-white/5">
             <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                Property of Mohit Industries. Authorized access only.
             </p>
          </div>
      </div>

      {/* Auth Control Hub */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10 bg-background border-l border-border">
         <div className="w-full max-w-md">
            
            <div className="mb-8">
               <h3 className="text-2xl font-black text-foreground tracking-tight uppercase mb-1">
                  {step === 1 ? 'Authentication' : 'Verification'}
               </h3>
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                  {step === 1 ? 'Input administrative credentials' : 'Multi-factor validation required'}
               </p>
            </div>

            {/* Error Alert */}
            <AnimatePresence>
               {error && (
                 <motion.div 
                   initial={{ opacity: 0, y: -4 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0 }}
                   className="bg-destructive/10 border border-destructive/20 rounded p-3 mb-6 flex items-center gap-3"
                 >
                    <ShieldAlert className="w-4 h-4 text-destructive" />
                    <p className="text-[10px] font-bold text-destructive uppercase tracking-widest">{error}</p>
                 </motion.div>
               )}
            </AnimatePresence>

            {/* Auth Card */}
            <div className="bg-card p-8 lg:p-10 rounded border border-border shadow-xl relative overflow-hidden group">
               <AnimatePresence mode="wait">
                  {step === 1 ? (
                    <motion.form 
                      key="step1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-6 relative z-10" 
                      onSubmit={handleStep1}
                    >
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Mobile Number</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                             <Phone className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <input
                            type="tel"
                            className="erp-input !pl-10"
                            placeholder="9999999999"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Master Password</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                             <KeyRound className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <input
                            type="password"
                            className="erp-input !pl-10 font-mono"
                            placeholder="••••••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full erp-button-primary !py-4 group"
                      >
                         <span className="flex items-center gap-2">
                            {loading ? "Authorizing..." : "Initiate Login"}
                            {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /> }
                         </span>
                      </button>
                    </motion.form>
                  ) : (
                    <motion.form 
                      key="step2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-6 flex flex-col items-center text-center relative z-10"
                      onSubmit={handleStep2}
                    >
                      <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center mb-2 border border-primary/20">
                         <ShieldCheck className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Validation Required</h4>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-2 leading-relaxed opacity-70">
                           A security code has been sent to:<br/>
                           <span className="text-primary font-bold">{emailMasked}</span>
                        </p>
                      </div>

                      <div className="w-full">
                         <input
                           type="text"
                           maxLength="6"
                           className="w-full text-center text-2xl font-black tracking-[0.5em] py-3 bg-muted/50 border border-border rounded text-primary outline-none focus:bg-background focus:ring-1 focus:ring-primary transition-all"
                           placeholder="000000"
                           value={otp}
                           onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                         />
                      </div>

                      <div className="w-full flex gap-3">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="flex-1 py-3 text-[10px] font-bold uppercase text-muted-foreground hover:text-foreground tracking-widest transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading || otp.length < 6}
                          className="flex-[2] erp-button-primary !py-3"
                        >
                          {loading ? "Verifying..." : "Confirm"}
                        </button>
                      </div>
                    </motion.form>
                  )}
               </AnimatePresence>
            </div>
            
            <div className="mt-8 flex justify-between items-center opacity-30">
               <div className="flex items-center gap-2">
                  <Database className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Node: IN-W-1</span>
               </div>
               <div className="flex items-center gap-2">
                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Secure Handshake</span>
                  <Activity className="w-3 h-3 text-emerald-500" />
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Login;
