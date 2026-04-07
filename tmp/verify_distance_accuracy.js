const fromAddress = "SHREEJI INDUSTRIAL AREA, 0, NR FALCON PUMP PLOT NO 1 SURVEY NO 55 1 8B NATIONAL HIGHWAY, RAJKOT, Rajkot";
const toAddress = "APMC (AGRICULTURE PRODUCE MARKET COMMITTE), 0, BEDI, Rajkot, Rajkot";

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
    if (a.includes("mumbai") || a.includes("maharashtra")) return 1;
    if (a.includes("ahmedabad") || a.includes("gujarat")) return 6;
    if (a.includes("rajkot")) return 8;
    return 0;
  };

  const fromRegion = getRegion(from);
  const toRegion = getRegion(to);

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

  let distance = 0;
  if (cityMatch) {
    distance = deterministicRandom(45, 15);
  } else if (fromRegion === toRegion && fromRegion !== 0) {
    distance = deterministicRandom(150, 40);
  } else if (fromRegion !== 0 && toRegion !== 0) {
    const diff = Math.abs(fromRegion - toRegion);
    distance = diff * 350 + deterministicRandom(250);
  } else {
    distance = deterministicRandom(800, 200);
  }
  return distance;
};

const rajkotDist = getDistanceLogic(fromAddress, toAddress);
const ahmedabadDist = getDistanceLogic("Ahmedabad, Gujarat", "Surat, Gujarat");

console.log(`Rajkot to Rajkot: ${rajkotDist} km`);
console.log(`Ahmedabad to Surat: ${ahmedabadDist} km`);
