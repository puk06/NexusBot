const axios = require("axios");

module.exports.userTop100Scores = async (apiKey, username, mode) => {
    const endpoint = 'https://osu.ppy.sh/api/get_user_best';
    const params = {
        k: apiKey,
        u: username,
        limit: 100,
        m: mode
    };

    try {
        const response = await axios.get(endpoint, { params });
        const data = response.data;
        const scores = data.map((score) => ({ pp: score.pp }));
        return scores;
    } catch (error) {
        console.error('APIリクエストエラー:', error);
        return [];
    }
}


  // グローバルppの計算関数
function calculateGlobalPP(scores){
    let globalPP = 0;

    for (let i = 0; i < scores.length; i++) {
        const scorePP = scores[i].pp * Math.pow(0.95, i);
        globalPP += scorePP;
    }
    return globalPP;
}
function addPPToScores(newScore, scores) {
    scores.push({ pp: newScore });
    scores.sort((a, b) => b.pp - a.pp);

    if (scores.length > 100) {
        scores.pop();
    }
}

module.exports.calculateAndPrintPPChange = (newScore, scores) => {
    const currentGlobalPP = calculateGlobalPP(scores);

    if (newScore <= scores[scores.length - 1].pp) {
        console.log("ppの変化はありません");
        return;
    }

    addPPToScores(newScore, scores);
    const newGlobalPP = calculateGlobalPP(scores);
    const ppChange = newGlobalPP - currentGlobalPP;

    console.log(`現在のグローバルpp: ${currentGlobalPP}`);
    console.log(`新しいppを追加した後のグローバルpp: ${newGlobalPP}`);
    console.log(`ppの変化: ${ppChange}`);
}
