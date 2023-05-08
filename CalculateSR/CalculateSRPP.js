//require ribrary
const { Beatmap, Calculator } = require("rosu-pp");
const axios = require("axios");

module.exports.calculateSR = async (beatmapId, mods, mode) => {

	try {
		const beatmapFile = await getOsuBeatmapFile(beatmapId);
		const srppdata = calculateStarRating(beatmapFile, mods, mode);
		return {
			sr: srppdata.sr,
			S0: srppdata.S0,
			S1: srppdata.S1,
			S2: srppdata.S2,
			S3: srppdata.S3,
			S4: srppdata.S4,
			S5: srppdata.S5,
		}
	} catch(e) {
		console.log(e)
		return 0; // fallback to 0 if you get error
	}

}
function getOsuBeatmapFile (beatmapId) {
	return axios(`https://osu.ppy.sh/osu/${beatmapId}`, {
		responseType: "arrayBuffer", // ? Same thing as buffer
	})
}

function calculateStarRating (beatmap, mods, mode) {
	let map = new Beatmap({ bytes: new Uint8Array(Buffer.from(beatmap.data)) }); // yea its simple to convert it

	let score = {
		mode: mode,
		mods: mods,
	}
	let calc = new Calculator(score);
	let Calculated = calc.performance(map);
	return {
		sr: Calculated.difficulty.stars,
		S0: calc.acc(100).performance(map).pp,
		S1: calc.acc(99.5).performance(map).pp,
		S2: calc.acc(99).performance(map).pp,
		S3: calc.acc(98).performance(map).pp,
		S4: calc.acc(97).performance(map).pp,
		S5: calc.acc(95).performance(map).pp
	}
}
