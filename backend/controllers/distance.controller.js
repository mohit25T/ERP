
// Simple Mock Distance Calculation for Indian Pincodes
// In a real application, you would use Google Distance Matrix API or NIC E-Way Bill API
export const getDistance = async (req, res) => {
  try {
    const { fromPin, toPin } = req.query;

    if (!fromPin || !toPin) {
      return res.status(400).json({ msg: "Both from and to pincodes are required" });
    }

    // Logic: If they are the same, distance is minimal
    if (fromPin === toPin) {
      return res.json({ distance: 1, unit: "km" });
    }

    // Simulated calculation based on first two digits (State/Region)
    const fromRegion = parseInt(fromPin.substring(0, 2));
    const toRegion = parseInt(toPin.substring(0, 2));

    let distance = 0;
    if (fromRegion === toRegion) {
      // Same state: 50 - 300 km
      distance = Math.floor(Math.random() * 250) + 50;
    } else {
      // Different states: 300 - 1500 km
      const diff = Math.abs(fromRegion - toRegion);
      distance = diff * 150 + Math.floor(Math.random() * 100);
    }

    // Ensure it's never too small for different pins
    if (distance < 20) distance = 25;

    // Simulate network delay
    setTimeout(() => {
      res.json({ 
        fromPin, 
        toPin, 
        distance, 
        unit: "km",
        status: "success",
        note: "This is a simulated distance based on regional codes." 
      });
    }, 800);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
