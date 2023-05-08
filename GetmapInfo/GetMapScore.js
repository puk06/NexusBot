//require ribrary
const axios = require("axios");

module.exports.GetMapScore = async (beatmapid, mods, apikey) => {
    const scorelink = `https://osu.ppy.sh/api/get_scores?k=${apikey}&b=${beatmapid}&m=1&a=1&mods=${mods}&limit=5`
    const responce = await axios.get(scorelink);
    if (responce.data.length === "0"){
        return 0
    }else{
        return responce.data
    }
}
