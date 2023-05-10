module.exports.calcAccuracyosu = (good, ok, bad, miss, ) => {
	const osuaccuracy = ((parseInt(good) * 300)  + (parseInt(ok) * 100) + (parseInt(bad) * 50)) / (300 * (parseInt(good) + parseInt(ok) + parseInt(bad) + parseInt(miss))) * 100;
		return parseFloat(osuaccuracy.toFixed(2));
}

module.exports.calcAccuracytaiko = (good, ok, miss) => {
	const taikoaccuracy = ((parseInt(good) + parseInt(ok) * 0.5)) / (parseInt(good) + parseInt(ok) + parseInt(miss)) * 100;
		return parseFloat(taikoaccuracy.toFixed(2));
}

module.exports.calcAccuracyctb = (good, ok, bad, miss, countKatu ) => {
	const ctbaccuracy = (parseInt(good) + parseInt(ok) + parseInt(bad)) / ((parseInt(good) + parseInt(ok) + parseInt(bad) + parseInt(miss) + parseInt(countKatu))) * 100;
		return parseFloat(ctbaccuracy.toFixed(2));
}

module.exports.calcAccuracymania = (good, ok, bad, Katu, miss, ) => {
	const maniaaccuracy = ((300 * parseInt(good)) + parseInt(Katu) + parseInt(ok) + parseInt(bad)) / (300 * (parseInt(good) + parseInt(Katu) + parseInt(ok) + parseInt(bad) + parseInt(miss))) * 100
		return parseFloat(maniaaccuracy.toFixed(2));
}




