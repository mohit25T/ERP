const fromAddress = "SHREEJI INDUSTRIAL AREA, RAJKOT";
const toAddress = "APMC Market Yard, Rajkot";

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
  
  const getCityMatch = (addr1, addr2) => {
    const commonCities = ["rajkot", "surat", "ahmedabad", "morbi", "mumbai", "delhi", "bangalore"];
    const a1 = addr1.toLowerCase();
    const a2 = addr2.toLowerCase();
    for (const city of commonCities) {
      if (a1.includes(city) && a2.includes(city)) return city;
    }
    return null;
  };

  const cityMatch = getCityMatch(from, to);

  if (cityMatch) {
    // Focus on the 'Shortest Route' (5 - 35 km)
    const shortestSeed = seed % 100 < 60 ? (seed % 20) + 5 : (seed % 10) + 25;
    return shortestSeed;
  }
  return 0;
};

const rajkotDist = getDistanceLogic(fromAddress, toAddress);

console.log(`Rajkot to Rajkot (Shortest Route Simulation): ${rajkotDist} km`);
