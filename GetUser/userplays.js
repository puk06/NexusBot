//require ribrary
const axios = require("axios");

module.exports.getplayersdata = async (apikey, username, mode) =>{
    try{
    const response = await axios.get(
        `https://osu.ppy.sh/api/get_user?&k=${apikey}&type=string&m=${mode}&u=${username}`
    );
    const playerdata = response.data;
    const data = playerdata[0];
    return{
        "user_id"              : data.user_id,
        "username"             : data.username,
        "join_date"            : data.join_date,
        "count300"             : data.count300,
        "count100"             : data.count100,
        "count50"              : data.count50,
        "playcount"            : data.playcount,
        "ranked_score"         : data.ranked_score,
        "total_score"          : data.total_score,
        "pp_rank"              : data.pp_rank,
        "pp_raw"               : data.pp_raw,
        "accuracy"             : data.accuracy,
        "count_rank_ss"        : data.count_rank_ss,
        "count_rank_ssh"       : data.count_rank_ssh,
        "count_rank_s"         : data.count_rank_s,
        "count_rank_sh"        : data.count_rank_sh,
        "count_rank_a"         : data.count_rank_a,
        "country"              : data.country,
        "total_seconds_played" : data.total_seconds_played,
        "pp_country_rank"      : data.pp_country_rank,
        "iconurl"              : `https://a.ppy.sh/${data.user_id}`,
        "playerurl"            : `https://osu.ppy.sh/users/${data.user_id}`
    }}catch(e){
        return 0
    }

}

module.exports.getplayerscore = async (apikey, beatmapId, username) => {
    const response = await axios.get(
        `https://osu.ppy.sh/api/get_scores?b=${beatmapId}&k=${apikey}&type=string&u=${username}`
    );
    const responsedata = response.data
    const responsescore = responsedata[0]
    if(responsescore === undefined){
        return 0
    }

    return {
        "score_id"         : responsescore.score_id,
        "score"            : responsescore.score,
        "username"         : responsescore.username,
        "count300"         : responsescore.count300,
        "count100"         : responsescore.count100,
        "count50"          : responsescore.count50,
        "countmiss"        : responsescore.countmiss,
        "maxcombo"         : responsescore.maxcombo,
        "countkatu"        : responsescore.countkatu,
        "countgeki"        : responsescore.countgeki,
        "perfect"          : responsescore.perfect,
        "enabled_mods"     : responsescore.enabled_mods,
        "user_id"          : responsescore.user_id,
        "date"             : responsescore.date,
        "rank"             : responsescore.rank,
        "pp"               : responsescore.pp,
        "replay_available" : responsescore.replay_available,
        "maplink"          : `https://osu.ppy.sh/beatmapsets/${beatmapId}`
    }
}
