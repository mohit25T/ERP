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

  const getRegionInfo = (addr) => {
    const a = addr.toLowerCase();
    if (a.includes("ahmedabad") || a.includes("gujarat")) return { id: 6, state: "gujarat" };
    if (a.includes("rajkot")) return { id: 8, state: "gujarat" };
    return { id: 0, state: "other" };
  };

  const fromInfo = getRegionInfo(from);
  const toInfo = getRegionInfo(to);

  let distance = 0;
  if (fromInfo.state === toInfo.state && fromInfo.state !== "other") {
    distance = deterministicRandom(180, 60);
  } else {
    distance = deterministicRandom(800, 200);
  }
  return distance;
};

const dist = getDistanceLogic("Gujarat", "APMC Market, Rajkot");
console.log(`Gujarat to Rajkot: ${dist} km`);
