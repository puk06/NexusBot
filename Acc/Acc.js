module.exports.calcAccuracyosu = (good, ok, bad, miss) => {
	const osuaccuracy = ((parseInt(good) * 300)  + (parseInt(ok) * 100) + (parseInt(bad) * 50)) / (300 * (parseInt(good) + parseInt(ok) + parseInt(bad) + parseInt(miss))) * 100;
		return parseFloat(osuaccuracy.toFixed(2));
}

module.exports.calcAccuracytaiko = (good, ok, miss) => {
	const taikoaccuracy = ((parseInt(good) + parseInt(ok) * 0.5)) / (parseInt(good) + parseInt(ok) + parseInt(miss)) * 100;
		return parseFloat(taikoaccuracy.toFixed(2));
}

module.exports.calcAccuracyctb = (good, ok, bad, miss, countKatu) => {
	const ctbaccuracy = (parseInt(good) + parseInt(ok) + parseInt(bad)) / ((parseInt(good) + parseInt(ok) + parseInt(bad) + parseInt(miss) + parseInt(countKatu))) * 100;
		return parseFloat(ctbaccuracy.toFixed(2));
}

module.exports.calcAccuracymania = (good, ok, bad, miss, Katu) => {
	const maniaaccuracy = ((300 * parseInt(good)) + parseInt(Katu) + parseInt(ok) + parseInt(bad)) / (300 * (parseInt(good) + parseInt(Katu) + parseInt(ok) + parseInt(bad) + parseInt(miss))) * 100
		return parseFloat(maniaaccuracy.toFixed(2));
}

module.exports.calcAccuracyanymode = (good, ok, bad, miss, countKatu, countgeki, mode) =>{
	let acc
	if(mode == 0){
		acc = calcAccuracyosu(good, ok, bad, miss)
	}else if(mode == 1){
		acc = calcAccuracytaiko(good, ok, miss)
	}else if(mode == 2){
		acc = calcAccuracyctb(good, ok, bad, miss, countKatu, countgeki)
	}else if(mode == 3){
		let goodperfect = parseInt(good) + parseInt(countgeki)
		acc = calcAccuracymania(goodperfect, ok, bad, miss, Katu)
	}
	return acc
}

function calcAccuracyosu(good, ok, bad, miss){
	const osuaccuracy = ((parseInt(good) * 300)  + (parseInt(ok) * 100) + (parseInt(bad) * 50)) / (300 * (parseInt(good) + parseInt(ok) + parseInt(bad) + parseInt(miss))) * 100;
		return parseFloat(osuaccuracy.toFixed(2));
}

function calcAccuracytaiko(good, ok, miss){
	const taikoaccuracy = ((parseInt(good) + parseInt(ok) * 0.5)) / (parseInt(good) + parseInt(ok) + parseInt(miss)) * 100;
		return parseFloat(taikoaccuracy.toFixed(2));
}

function calcAccuracyctb(good, ok, bad, miss, countKatu){
	const ctbaccuracy = (parseInt(good) + parseInt(ok) + parseInt(bad)) / ((parseInt(good) + parseInt(ok) + parseInt(bad) + parseInt(miss) + parseInt(countKatu))) * 100;
		return parseFloat(ctbaccuracy.toFixed(2));
}

function calcAccuracymania(good, ok, bad, miss, Katu){
	const maniaaccuracy = ((300 * parseInt(good)) + parseInt(Katu) + parseInt(ok) + parseInt(bad)) / (300 * (parseInt(good) + parseInt(Katu) + parseInt(ok) + parseInt(bad) + parseInt(miss))) * 100
		return parseFloat(maniaaccuracy.toFixed(2));
}




