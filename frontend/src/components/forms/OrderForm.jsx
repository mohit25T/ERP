import { customerApi, productApi, distanceApi } from "../../api/erpApi";
import { useAuth } from "../../context/AuthContext";
import { Truck, MapPin, Loader2, IndianRupee } from "lucide-react";

const OrderForm = ({ onSubmit, onCancel, loading }) => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    customer: "",
    product: "",
    quantity: 1,
    ewayBillData: {
      active: false,
      distance: 0,
      transporterId: "",
      vehicleNo: "",
      mode: "road"
    }
  });

  const { user } = useAuth();
  const [distanceLoading, setDistanceLoading] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, prodRes] = await Promise.all([
          customerApi.getAll(),
          productApi.getAll()
        ]);
        setCustomers(custRes.data);
        setProducts(prodRes.data); // Support backordering (include items with 0 stock)
      } catch (err) {
        console.error("Error fetching form data", err);
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "product") {
      const prod = products.find(p => p._id === value);
      setSelectedProduct(prod);
    }

    setFormData(prev => ({
      ...prev,
      [name]: name === "quantity" ? parseInt(value) : value
    }));
  };

  const handleEwayChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      ewayBillData: {
        ...prev.ewayBillData,
        [name]: type === 'checkbox' ? checked : value
      }
    }));
  };

  const handleFetchDistance = async () => {
    const customer = customers.find(c => c._id === formData.customer);
    if (!customer?.pincode || !user?.pincode) {
      alert("Both Company Pincode (in Settings) and Customer Pincode must be set.");
      return;
    }

    try {
      setDistanceLoading(true);
      const res = await distanceApi.fetch(user.pincode, customer.pincode);
      setFormData(prev => ({
        ...prev,
        ewayBillData: {
          ...prev.ewayBillData,
          distance: res.data.distance
        }
      }));
    } catch (err) {
      alert("Failed to fetch distance. Please enter manually.");
    } finally {
      setDistanceLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.customer || !formData.product) {
      alert("Please select a customer and product");
      return;
    }
    onSubmit(formData);
  };

  if (fetching) return <p className="text-center py-4 text-gray-500 text-sm italic">Loading master data...</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5 ">Select Customer</label>
          <select
            name="customer"
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition appearance-none"
            value={formData.customer}
            onChange={handleChange}
          >
            <option value="">-- Choose Customer --</option>
            {customers.map(c => (
              <option key={c._id} value={c._id}>{c.name} ({c.company || "Individual"})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Product</label>
          <select
            name="product"
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition appearance-none"
            value={formData.product}
            onChange={handleChange}
          >
            <option value="">-- Choose Product --</option>
            {products.map(p => (
              <option key={p._id} value={p._id}>{p.name} - ₹{p.price} (Stock: {p.stock} | GST: {p.gstRate}%)</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 ">Quantity</label>
            <input
              name="quantity"
              type="number"
              min="1"
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition font-bold"
              value={formData.quantity}
              onChange={handleChange}
            />
          </div>
          
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 shadow-xl shadow-blue-500/20 flex flex-col justify-center mt-4">
            <span className="text-[10px] uppercase font-black text-blue-100 tracking-widest opacity-70">Payable Amount</span>
            <span className="text-2xl font-black text-white tracking-tighter">
               ₹{selectedProduct ? ((selectedProduct.price * formData.quantity) * (1 + (selectedProduct.gstRate || 18)/100)).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : "0.00"}
            </span>
            <div className="flex justify-between items-center mt-1 border-t border-white/10 pt-1">
               <span className="text-[8px] font-bold text-blue-200 uppercase tracking-tighter">Inc. GST ({selectedProduct?.gstRate || 18}%)</span>
            </div>
        </div>

        {/* E-Way Bill Section */}
        <div className="pt-4 border-t border-gray-100">
           <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                 <Truck className="w-5 h-5 text-blue-600" />
                 <span className="text-sm font-black text-gray-900 uppercase italic">E-Way Bill Details</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="active"
                  className="sr-only peer" 
                  checked={formData.ewayBillData.active}
                  onChange={handleEwayChange}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
           </div>

           {formData.ewayBillData.active && (
             <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-2 gap-4 text-left">
                   <div className="space-y-1.5">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Distance (KM)</label>
                        <button 
                          type="button"
                          onClick={handleFetchDistance}
                          disabled={distanceLoading}
                          className="flex items-center gap-1 text-[9px] font-black text-blue-600 uppercase hover:text-blue-700 transition-colors disabled:opacity-50"
                        >
                           {distanceLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <MapPin className="w-2.5 h-2.5" />}
                           Auto Fetch
                        </button>
                      </div>
                      <input 
                        name="distance"
                        type="number"
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500/10 outline-none"
                        value={formData.ewayBillData.distance}
                        onChange={handleEwayChange}
                        placeholder="0"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none ml-1">Transport Mode</label>
                      <select 
                        name="mode"
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500/10 outline-none appearance-none"
                        value={formData.ewayBillData.mode}
                        onChange={handleEwayChange}
                      >
                         <option value="road">Road</option>
                         <option value="rail">Rail</option>
                         <option value="air">Air</option>
                         <option value="ship">Ship</option>
                      </select>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-left">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none ml-1">Vehicle Number</label>
                      <input 
                        name="vehicleNo"
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500/10 outline-none uppercase placeholder:text-gray-300"
                        value={formData.ewayBillData.vehicleNo}
                        onChange={handleEwayChange}
                        placeholder="GJ-01-XX-0000"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none ml-1">Transporter ID</label>
                      <input 
                        name="transporterId"
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500/10 outline-none uppercase placeholder:text-gray-300"
                        value={formData.ewayBillData.transporterId}
                        onChange={handleEwayChange}
                        placeholder="TRNP-XXXX"
                      />
                   </div>
                </div>
             </div>
           )}
        </div>

      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 px-4 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !selectedProduct || (selectedProduct.stock < formData.quantity)}
          className="flex-2 py-2.5 px-8 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition disabled:opacity-50 disabled:bg-gray-400 disabled:shadow-none"
        >
          {loading ? "Processing..." : (selectedProduct?.stock < formData.quantity) ? "Insufficient Stock" : "Confirm Selection & Order"}
        </button>
      </div>
    </form>
  );
};

export default OrderForm;
