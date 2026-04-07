const fromAddress = "Mumbai, Maharashtra";
const toAddress = "Delhi, NCR";

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
    if (a.includes("delhi") || a.includes("ncr")) return 2;
    return 0;
  };

  const fromRegion = getRegion(from);
  const toRegion = getRegion(to);

  let distance = 0;
  if (fromRegion === toRegion && fromRegion !== 0) {
    distance = deterministicRandom(80, 10);
  } else if (fromRegion !== 0 && toRegion !== 0) {
    const diff = Math.abs(fromRegion - toRegion);
    distance = diff * 350 + deterministicRandom(200);
  } else {
    distance = deterministicRandom(500, 120);
  }
  return distance;
};

const d1 = getDistanceLogic(fromAddress, toAddress);
const d2 = getDistanceLogic(fromAddress, toAddress);
const d3 = getDistanceLogic("Bangalore, KA", "Chennai, TN");
const d4 = getDistanceLogic("Bangalore, KA", "Chennai, TN");

console.log(`Test 1 (Mumbai to Delhi): ${d1}`);
console.log(`Test 2 (Mumbai to Delhi): ${d2}`);
console.log(`Result: ${d1 === d2 ? "PASS (Deterministic)" : "FAIL (Random)"}`);

console.log(`Test 3 (Bangalore to Chennai): ${d3}`);
console.log(`Test 4 (Bangalore to Chennai): ${d4}`);
console.log(`Result: ${d3 === d4 ? "PASS (Deterministic)" : "FAIL (Random)"}`);
