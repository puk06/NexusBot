//require ribrary
const axios = require("axios");

module.exports.Recentplay = async (apikey, player, mode) => {
    const response = await axios.get(
        `https://osu.ppy.sh/api/get_user_recent?k=${apikey}&u=${player}&limit=1&m=1&a=1&type=string`
    )
    const re = response.data

    return{
        
            "beatmap_id"   : re[0].beatmap_id,
            "score"        : re[0].score,
            "maxcombo"     : re[0].maxcombo,
            "count50"      : re[0].count50,
            "count100"     : re[0].count100,
            "count300"     : re[0].count300,
            "countmiss"    : re[0].countmiss,
            "countkatu"    : re[0].countkatu,
            "countgeki"    : re[0].countgeki,
            "perfect"      : re[0].perfect,
            "enabled_mods" : re[0].enabled_mods,
            "user_id"      : re[0].user_id,
            "date"         : re[0].date,
            "rank"         : re[0].rank,
            "totalhitcount": (parseInt(re[0].count300) + parseInt(re[0].count100) + parseInt(re[0].countmiss))

    }

};
