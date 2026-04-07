const getSeed = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getDistanceLogic = (from, to) => {
  const seed = getSeed(from + to);
  const deterministicRandom = (max, min = 0) => {
    return (seed % (max - min + 1)) + min;
  };

  const getRegion = (addr) => {
    const a = addr.toLowerCase();
    const pinMatch = a.match(/\b\d{6}\b/);
    if (pinMatch) {
       const pin = pinMatch[0];
       if (pin.startsWith('1') || pin.startsWith('2')) return 2;
       if (pin.startsWith('3')) return 6;
       if (pin.startsWith('4')) return 1;
    }
    if (a.includes("mumbai")) return 1;
    if (a.includes("rajkot")) return 8;
    return 0;
  };

  const getCityMatch = (addr1, addr2) => {
    const commonCities = ["rajkot", "mumbai"];
    const a1 = addr1.toLowerCase();
    const a2 = addr2.toLowerCase();
    for (const city of commonCities) {
      if (a1.includes(city) && a2.includes(city)) return city;
    }
    return null;
  };

  const fromRegion = getRegion(from);
  const toRegion = getRegion(to);
  const cityMatch = getCityMatch(from, to);

  let distance = 0;
  if (cityMatch) {
    distance = deterministicRandom(45, 15);
  } else if (fromRegion === toRegion && fromRegion !== 0) {
    distance = deterministicRandom(150, 40);
  } else {
    distance = deterministicRandom(800, 200);
  }
  return distance;
};

// Test with only Pincodes
const d1 = getDistanceLogic("360001", "360020");
const d2 = getDistanceLogic("360001", "360020");
// Test with Pincode - cross state (3 to 1)
const d3 = getDistanceLogic("360001", "400001");

console.log(`Rajkot Pincode to Pincode (360001 to 360020): ${d1} km`);
console.log(`Stability Check: ${d1 === d2 ? "PASS" : "FAIL"}`);
console.log(`Rajkot to Mumbai (360001 to 400001): ${d3} km`);
