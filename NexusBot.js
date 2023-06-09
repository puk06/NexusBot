//require library
const { Client, Intents,  MessageEmbed } = require("discord.js");
require('dotenv').config();
const fs = require("fs")
const tools = require("osu-api-extended")

//requireFIle
const { calculateSR, calculateSRwithacc } = require("./CalculateSR/CalculateSRPP")
const { modeconvert } = require("./Mode/Mode")
const { getMapInfo, mapstatus, getMapforRecent, getMapInfowithoutmods } = require("./GetmapInfo/GetMapInfo")
const { GetMapScore } = require("./GetmapInfo/GetMapScore")
const { Recentplay } = require("./GetmapInfo/GetRecentScore")
const { parseModString, parseMods, splitString } = require("./Modsconvert/Mods")
const { getplayersdata, getplayerscore } = require("./GetUser/userplays")
const { numDigits } = require("./numDigit/numDigit");
const { ODscaled } = require("./OD/ODscaled")
const { getOsuBeatmapFile, checkStream } = require("./Streamcheck/Streamcheck")

//apikeys
const apikey = process.env.APIKEY
const token = process.env.TOKEN


//discord.js require Intents
const client = new Client({ intents: Intents.ALL });

//ready to use
client.on("ready", () => {
    console.log(`Success Logged in to NexusBot V1.0.0`);
    client.user.setActivity('register = !reg ')
	}
);

try{
	client.on("message", async(message) =>
		{
			if(message.content.startsWith("!mapl")){
				try{
					if(message.content == "!mapl"){
						message.reply("How to use: !mapl <Maplink> <Mods(optional)>")
					}else{
						const MessageMaplink = message.content.split(" ")[1]
						let Mods = []
						if(message.content.substring(4).split(/\s+/).slice(2).length === 0){
							Mods.push("NM")
						}else{
						Mods = splitString(message.content.substring(4).split(/\s+/).slice(2))
							if (Mods.includes("NC")) {
								Mods.push("DT")
								let modsnotNC = Mods.filter((item) => item.match("NC") == null);
								Mods = modsnotNC;
							}
						}
						const MapInfo = await getMapInfo(MessageMaplink, apikey, Mods)
						let BPM = MapInfo.bpm
						if(Mods.includes("DT")){
							BPM *= 1.5
						}else if(Mods.includes("HT")){
							BPM *= 0.75;
						}
						const mapperdata = await getplayersdata(apikey, MapInfo.mapper)
						const Modsconverted = parseModString(Mods)
						const srpps = await calculateSR(MapInfo.beatmapId, Modsconverted, modeconvert(MapInfo.mode))
						const Mapstatus = mapstatus(MapInfo.approved)

						//lengthsec to string and return 2 => 02
						let lengthsec
						if (numDigits(parseFloat(MapInfo.lengthsec).toFixed(0)) === 1){
							lengthsec = ('00' + parseFloat(MapInfo.lengthsec).toFixed(0)).slice( -2 );
						}else{
							lengthsec = parseFloat(MapInfo.lengthsec).toFixed(0)
						}

						//PP lane fix
						for (let i = 0; i < 4; i++) {
							const value = parseFloat(srpps['S' + i]).toFixed(2);
							const numDigits = value.length;
							let result = '';

							if (numDigits >= 7) {
								result = `  ${value} `;
							} else if (numDigits == 6) {
								result = `  ${value}  `;
							} else if (numDigits == 5) {
								result = `  ${value}   `;
							} else if (numDigits == 4) {
								result = `   ${value}   `;
							}
							srpps['S' + i] = result;
						}
						let showonlymodsdata = message.content.substring(4).split(/\s+/).slice(2)
						let Showonlymods = []
						if(showonlymodsdata.length === 0){
						Showonlymods.push("NM")
						}else{
							Showonlymods = showonlymodsdata
						}

						let od = ODscaled(MapInfo.od, Mods)

						//make Discord.js EmbedMessage
						const maplembed = new MessageEmbed()
						.setColor("BLUE")
						.setTitle(`${MapInfo.artist} - ${MapInfo.title}`)
						.setURL(MapInfo.maplink)
						.addField("Music and Backgroud",`:musical_note:[Song Preview](https://b.ppy.sh/preview/${MapInfo.beatmapset_id}.mp3) :frame_photo:[Full background](https://assets.ppy.sh/beatmaps/${MapInfo.beatmapset_id}/covers/raw.jpg)`)
						.setAuthor(`Created by ${MapInfo.mapper}`, mapperdata.iconurl, mapperdata.playerurl)
						.addField(`[**__${MapInfo.version}__**] **+${Showonlymods.join("")}**`, `Combo: \`${MapInfo.combo}\` Stars: \`${parseFloat(srpps.sr).toFixed(2)}\` \n Length: \`${MapInfo.lengthmin}:${lengthsec}\` BPM: \`${parseFloat(BPM).toFixed(1)}\` Objects: \`${MapInfo.combo}\` \n CS: \`${MapInfo.cs}\` AR: \`${MapInfo.ar}\` OD: \`${parseFloat(od).toFixed(2)}\` HP: \`${MapInfo.hp}\` Spinners: \`${MapInfo.countspinner}\``, true)
						.addField("**Download**", `[Official](https://osu.ppy.sh/beatmapsets/${MapInfo.beatmapset_id}/download)\n[Nerinyan(no video)](https://api.nerinyan.moe/d/${MapInfo.beatmapset_id}?nv=1)\n[Beatconnect](https://beatconnect.io/b/${MapInfo.beatmapset_id})\n[chimu.moe](https://api.chimu.moe/v1/download/${MapInfo.beatmapset_id}?n=1)`, true)
						.addField(`:heart: ${MapInfo.favouritecount} :play_pause: ${MapInfo.playcount}`,`\`\`\` Acc |    98%   |    99%   |   99.5%  |   100%   | \n ----+----------+----------+----------+----------+  \n  PP |${srpps.S3}|${srpps.S2}|${srpps.S1}|${srpps.S0}|\`\`\``, false)
						.setImage(`https://assets.ppy.sh/beatmaps/${MapInfo.beatmapset_id}/covers/cover.jpg`)
						.setFooter(`${Mapstatus} mapset of ${MapInfo.mapper}`)
						message.channel.send(maplembed)
					}
				}catch(e){
					console.log(e)
				}
			}

			if(message.content.startsWith("!ro")){
				try {
					let playername;
					if(message.content.split(" ")[1] === undefined){
						try{
							let username = message.author.username;
							let osuid = fs.readFileSync(`./Player infomation/${username}.txt`, "utf-8");
							playername = osuid;
						}catch(e){
							console.log(e);
							message.reply("Error")
						}
					}else {
						playername = message.content.split(" ")[1];
						if(playername === undefined){
						message.reply("Error")
						return
						}
					}
					const recentplay = await Recentplay(apikey, playername, 0);
						if(recentplay == 0){
						message.reply("No records found for this player within 24 hours")
						return
						}
					let mods = parseMods(recentplay.enabled_mods)
					let modforresult = parseMods(recentplay.enabled_mods)
					const GetMapInfo = await getMapforRecent(recentplay.beatmap_id, apikey, mods);
					const playersdata = await getplayersdata(apikey, playername, GetMapInfo.mode);
					const mappersdata = await getplayersdata(apikey, GetMapInfo.mapper);
					const acc = tools.tools.accuracy({300: recentplay.count300, 100: recentplay.count100, 50: recentplay.count50, 0: recentplay.countmiss, geki: recentplay.countgeki, katu: recentplay.countkatu}, "osu")
					let BPM = GetMapInfo.bpm;
					let modsforcalc = parseModString(mods)
					if (mods.includes("NC")) {
						let modsnotNC = mods.filter((item) => item.match("NC") == null);
						mods = modsnotNC;
						modsforcalc = parseModString(mods)
						BPM *= 1.5
					}else if(mods.includes("HT")) {
						BPM *= 0.75;
					}
					let sr = await calculateSR(recentplay.beatmap_id, modsforcalc, modeconvert(GetMapInfo.mode))
					let ifFC100;
					if ((recentplay.countmiss === "0")) {
						ifFC100 = parseInt(recentplay.count100) + parseInt(recentplay.count50)
					}else{
						ifFC100 = parseInt(recentplay.count100) + parseInt(recentplay.countmiss) + parseInt(recentplay.count50);
					}

					let ifFC300
					if(recentplay.countmiss > "0"){
						ifFC300 = (parseInt(GetMapInfo.combo) - (parseInt(recentplay.count300) + (parseInt(recentplay.count100)))) + parseInt(recentplay.count300) - parseInt(recentplay.countmiss) 
					}else{
						ifFC300 = (parseInt(GetMapInfo.combo) - (parseInt(recentplay.count300) + (parseInt(recentplay.count100)))) + parseInt(recentplay.count300)
					}
					const ifFCacc = tools.tools.accuracy({300: ifFC300, 100: ifFC100, 50: 0, 0: 0, geki: 0, katu:0}, "osu")
					const percentage = parseFloat((parseInt(recentplay.totalhitcount) / parseInt(GetMapInfo.combo)) * 100).toFixed(0);
					const Mapstatus = mapstatus(GetMapInfo.approved);
					const recentpp = await calculateSRwithacc(recentplay.beatmap_id, modsforcalc, modeconvert(GetMapInfo.mode), acc, parseInt(recentplay.countmiss))
					const iffcpp = await calculateSRwithacc(recentplay.beatmap_id, modsforcalc, modeconvert(GetMapInfo.mode), ifFCacc, 0)
					let lengthsec
					if (numDigits(parseFloat(GetMapInfo.lengthsec).toFixed(0)) === 1){
						lengthsec = ('00' + parseFloat(GetMapInfo.lengthsec).toFixed(0)).slice( -2 );
					}else{
						lengthsec = parseFloat(GetMapInfo.lengthsec).toFixed(0)
					}

					if (modforresult.includes("DT") && modforresult.includes("NC")) {
						let modsnotDT = modforresult.filter((item) => item.match("DT") == null);
						modforresult = modsnotDT;
					}

					let odscaled = ODscaled(GetMapInfo.od, mods);
					if(modforresult.length === 0){
						modforresult = "NM"
					}

					const embed = new MessageEmbed()
						.setColor("BLUE")
						.setTitle(`${GetMapInfo.artist} - ${GetMapInfo.title} [${GetMapInfo.version}]`)
						.setURL(GetMapInfo.maplink)
						.setAuthor(`${playersdata.username}: ${playersdata.pp_raw}pp (#${playersdata.pp_rank} ${playersdata.country}${playersdata.pp_country_rank})`,playersdata.iconurl,playersdata.playerurl)
						.addField("`Grade`", `**${recentplay.rank}** (${percentage}%) + ${modforresult}`, true)
						.addField("`Score`", recentplay.score, true)
						.addField("`Acc`", `${acc}%`, true)
						.addField("`PP`", `**${parseFloat(recentpp.ppwithacc).toFixed(2)}** / ${parseFloat(iffcpp.SSPP).toFixed(2)}PP`, true)
						.addField("`Combo`",`${recentplay.maxcombo}x / ${GetMapInfo.combo}x`,true)
						.addField("`Hits`",`{${recentplay.count300}/${recentplay.count100}/${recentplay.countmiss}}`,true)
						.addField("`If FC`", `**${parseFloat(iffcpp.ppwithacc).toFixed(2)}** / ${parseFloat(iffcpp.SSPP).toFixed(2)}PP`, true)
						.addField("`Acc`", `${ifFCacc}%`, true)
						.addField("`Hits`", `{${ifFC300}/${ifFC100}/0}`, true)
						.addField("`Map Info`", `Length:\`${GetMapInfo.lengthmin}:${lengthsec}\` BPM:\`${parseFloat(BPM).toFixed(0)}\` Objects:\`${GetMapInfo.combo}\` \n  CS:\`${GetMapInfo.cs}\` AR:\`${GetMapInfo.ar}\` OD:\`${parseFloat(odscaled).toFixed(1)}\` HP:\`${GetMapInfo.hp}\` Stars:\`${parseFloat(sr.sr).toFixed(2)}\``, true)
						.setImage(`https://assets.ppy.sh/beatmaps/${GetMapInfo.beatmapset_id}/covers/cover.jpg`)
						.setTimestamp()
						.setFooter(`${Mapstatus} mapset of ${GetMapInfo.mapper}`, mappersdata.iconurl);
						await message.channel.send(embed).then((sentMessage) => {
							setTimeout(() => {
								const embednew = new MessageEmbed()
								.setColor("BLUE")
								.setTitle(`${GetMapInfo.artist} - ${GetMapInfo.title} [${GetMapInfo.version}] [${parseFloat(sr.sr).toFixed(2)}★]`)
								.setThumbnail(`https://b.ppy.sh/thumb/${GetMapInfo.beatmapset_id}l.jpg`)
								.setURL(GetMapInfo.maplink)
								.setAuthor(`${playersdata.username}: ${playersdata.pp_raw}pp (#${playersdata.pp_rank} ${playersdata.country}${playersdata.pp_country_rank})`, playersdata.iconurl,playersdata.playerurl)
								.addField("`Result`",`**${recentplay.rank}** (**${percentage}%**) + **${modforresult}**   **Score**:**${recentplay.score}** (**ACC**:**${acc}%**) \n  **PP**:**${parseFloat(recentpp.ppwithacc).toFixed(2)}** / ${parseFloat(iffcpp.SSPP).toFixed(2)}   [**${recentplay.maxcombo}**x / ${GetMapInfo.combo}x]   {${recentplay.count300}/${recentplay.count100}/${recentplay.countmiss}}`, true)
								sentMessage.edit(embednew)
								}, 20000
							)
						}
					)
				}catch (e) {
					console.log(e);
				}
			}

			if(message.content.startsWith("!rt")){
				try {
					let playername;
					if(message.content.split(" ")[1] === undefined){
						try{
							let username = message.author.username;
							let osuid = fs.readFileSync(`./Player infomation/${username}.txt`, "utf-8");
							playername = osuid;
						}catch(e){
							console.log(e);
							message.reply("Error")
						}
					}else {
						playername = message.content.split(" ")[1];
						if(playername === undefined){
						message.reply("Error")
						return
						}
					}
					const recentplay = await Recentplay(apikey, playername, 1);
						if(recentplay == 0){
							message.reply("No records found for this player within 24 hours")
							return
						}
					let mods = parseMods(recentplay.enabled_mods)
					let modforresult = parseMods(recentplay.enabled_mods)
					const GetMapInfo = await getMapforRecent(recentplay.beatmap_id, apikey, mods);
					const playersdata = await getplayersdata(apikey, playername, GetMapInfo.mode);
					const mappersdata = await getplayersdata(apikey, GetMapInfo.mapper);
					const acc = tools.tools.accuracy({300: recentplay.count300, 100: recentplay.count100, 50: recentplay.count50, 0: recentplay.countmiss, geki: recentplay.countgeki, katu: recentplay.countkatu}, "taiko")
					let BPM = GetMapInfo.bpm;
					let modsforcalc = parseModString(mods)
					if (mods.includes("NC")) {
						let modsnotNC = mods.filter((item) => item.match("NC") == null);
						mods = modsnotNC;
						modsforcalc = parseModString(mods)
						BPM *= 1.5
					}else if(mods.includes("HT")) {
						BPM *= 0.75;
					}
					let sr = await calculateSR(recentplay.beatmap_id, modsforcalc, modeconvert(GetMapInfo.mode))
					let ifFC100;
					if ((recentplay.countmiss === "0")) {
						ifFC100 = parseInt(recentplay.count100);
					}else{
						ifFC100 = parseInt(recentplay.count100) + parseInt(recentplay.countmiss);
					}

					let ifFC300
					if(recentplay.countmiss === "0"){
						ifFC300 = parseInt(GetMapInfo.combo) - parseInt(recentplay.count100)
					}else{
						ifFC300 = parseInt(GetMapInfo.combo) - parseInt(recentplay.count100) - parseInt(recentplay.countmiss)
					}
					const ifFCacc = tools.tools.accuracy({300: ifFC300, 100: ifFC100, 50: 0, 0: 0, geki: 0, katu: 0}, "taiko")
					const percentage = parseFloat((parseInt(recentplay.totalhitcount) / parseInt(GetMapInfo.combo)) * 100).toFixed(0);
					const Mapstatus = mapstatus(GetMapInfo.approved);
					const recentpp = await calculateSRwithacc(recentplay.beatmap_id, modsforcalc, modeconvert(GetMapInfo.mode), acc, parseInt(recentplay.countmiss))
					const iffcpp = await calculateSRwithacc(recentplay.beatmap_id, modsforcalc, modeconvert(GetMapInfo.mode), ifFCacc, 0)
					let lengthsec
					if (numDigits(parseFloat(GetMapInfo.lengthsec).toFixed(0)) === 1){
						lengthsec = ('00' + parseFloat(GetMapInfo.lengthsec).toFixed(0)).slice( -2 );
					}else{
						lengthsec = parseFloat(GetMapInfo.lengthsec).toFixed(0)
					}

					if (modforresult.includes("DT") && modforresult.includes("NC")) {
						let modsnotDT = modforresult.filter((item) => item.match("DT") == null);
						modforresult = modsnotDT;
					}

					let odscaled = ODscaled(GetMapInfo.od, mods);
					if(modforresult.length === 0){
						modforresult = "NM"
					}

					const embed = new MessageEmbed()
						.setColor("BLUE")
						.setTitle(`${GetMapInfo.artist} - ${GetMapInfo.title} [${GetMapInfo.version}]`)
						.setURL(GetMapInfo.maplink)
						.setAuthor(`${playersdata.username}: ${playersdata.pp_raw}pp (#${playersdata.pp_rank} ${playersdata.country}${playersdata.pp_country_rank})`,playersdata.iconurl,playersdata.playerurl)
						.addField("`Grade`", `**${recentplay.rank}** (${percentage}%) + ${modforresult}`, true)
						.addField("`Score`", recentplay.score, true)
						.addField("`Acc`", `${acc}%`, true)
						.addField("`PP`", `**${parseFloat(recentpp.ppwithacc).toFixed(2)}** / ${parseFloat(iffcpp.SSPP).toFixed(2)}PP`, true)
						.addField("`Combo`",`${recentplay.maxcombo}x / ${GetMapInfo.combo}x`,true)
						.addField("`Hits`",`{${recentplay.count300}/${recentplay.count100}/${recentplay.countmiss}}`,true)
						.addField("`If FC`", `**${parseFloat(iffcpp.ppwithacc).toFixed(2)}** / ${parseFloat(iffcpp.SSPP).toFixed(2)}PP`, true)
						.addField("`Acc`", `${ifFCacc}%`, true)
						.addField("`Hits`", `{${ifFC300}/${ifFC100}/0}`, true)
						.addField("`Map Info`", `Length:\`${GetMapInfo.lengthmin}:${lengthsec}\` BPM:\`${parseFloat(BPM).toFixed(0)}\` Objects:\`${GetMapInfo.combo}\` \n  CS:\`${GetMapInfo.cs}\` AR:\`${GetMapInfo.ar}\` OD:\`${parseFloat(odscaled).toFixed(1)}\` HP:\`${GetMapInfo.hp}\` Stars:\`${parseFloat(sr.sr).toFixed(2)}\``, true)
						.setImage(`https://assets.ppy.sh/beatmaps/${GetMapInfo.beatmapset_id}/covers/cover.jpg`)
						.setTimestamp()
						.setFooter(`${Mapstatus} mapset of ${GetMapInfo.mapper}`, mappersdata.iconurl);
						await message.channel.send(embed).then((sentMessage) => {
							setTimeout(() => {
								const embednew = new MessageEmbed()
								.setColor("BLUE")
								.setTitle(`${GetMapInfo.artist} - ${GetMapInfo.title} [${GetMapInfo.version}] [${parseFloat(sr.sr).toFixed(2)}★]`)
								.setThumbnail(`https://b.ppy.sh/thumb/${GetMapInfo.beatmapset_id}l.jpg`)
								.setURL(GetMapInfo.maplink)
								.setAuthor(`${playersdata.username}: ${playersdata.pp_raw}pp (#${playersdata.pp_rank} ${playersdata.country}${playersdata.pp_country_rank})`, playersdata.iconurl,playersdata.playerurl)
								.addField("`Result`",`**${recentplay.rank}** (**${percentage}%**) + **${modforresult}**   **Score**:**${recentplay.score}** (**ACC**:**${acc}%**) \n  **PP**:**${parseFloat(recentpp.ppwithacc).toFixed(2)}** / ${parseFloat(iffcpp.SSPP).toFixed(2)}   [**${recentplay.maxcombo}**x / ${GetMapInfo.combo}x]   {${recentplay.count300}/${recentplay.count100}/${recentplay.countmiss}}`, true)
								sentMessage.edit(embednew)
								}, 20000
							)
						}
					)
				}catch (e) {
					console.log(e);
				}
			}

			if(message.content.startsWith("!rc")){
				try {
					let playername;
					if(message.content.split(" ")[1] === undefined){
						try{
							let username = message.author.username;
							let osuid = fs.readFileSync(`./Player infomation/${username}.txt`, "utf-8");
							playername = osuid;
						}catch(e){
							console.log(e);
							message.reply("Error")
						}
					}else {
						playername = message.content.split(" ")[1];
						if(playername === undefined){
						message.reply("Error")
						return
						}
					}
					const recentplay = await Recentplay(apikey, playername, 2);
						if(recentplay == 0){
						message.reply("No records found for this player within 24 hours")
						return
						}
					let mods = parseMods(recentplay.enabled_mods)
					let modforresult = parseMods(recentplay.enabled_mods)
					const GetMapInfo = await getMapforRecent(recentplay.beatmap_id, apikey, mods);
					const playersdata = await getplayersdata(apikey, playername, GetMapInfo.mode);
					const mappersdata = await getplayersdata(apikey, GetMapInfo.mapper);
					const acc = tools.tools.accuracy({300: recentplay.count300, 100: recentplay.count100, 50: recentplay.count50, 0: recentplay.countmiss, geki: recentplay.countgeki, katu: recentplay.countkatu}, "fruits")
					let BPM = GetMapInfo.bpm;
					let modsforcalc = parseModString(mods)
					if (mods.includes("NC")) {
						let modsnotNC = mods.filter((item) => item.match("NC") == null);
						mods = modsnotNC;
						modsforcalc = parseModString(mods)
						BPM *= 1.5
					}else if(mods.includes("HT")) {
						BPM *= 0.75;
					}
					let sr = await calculateSR(recentplay.beatmap_id, modsforcalc, modeconvert(GetMapInfo.mode))
					let ifFC100;
					if ((recentplay.countmiss === "0")) {
						ifFC100 = parseInt(recentplay.count100)
					}else{
						ifFC100 = parseInt(recentplay.count100) + parseInt(recentplay.countmiss)
					}

					let ifFC50;
					if ((recentplay.countkatu === "0")) {
						ifFC50 = parseInt(recentplay.count50)
					}else{
						ifFC50 = parseInt(recentplay.count50) + parseInt(recentplay.countkatu)
					}

					let ifFC300
					if(recentplay.countmiss === "0"){
						ifFC300 = parseInt(GetMapInfo.combo) - parseInt(recentplay.count100)
					}else{
						ifFC300 = parseInt(GetMapInfo.combo) - parseInt(recentplay.count100) - parseInt(recentplay.countmiss)
					}
					const ifFCacc = tools.tools.accuracy({300: ifFC300, 100: ifFC100, 50: ifFC50, 0: 0, geki: 0, katu: 0}, "fruits")
					const percentage = parseFloat((parseInt(recentplay.totalhitcount) / parseInt(GetMapInfo.combo)) * 100).toFixed(0);
					const Mapstatus = mapstatus(GetMapInfo.approved);
					const recentpp = await calculateSRwithacc(recentplay.beatmap_id, modsforcalc, modeconvert(GetMapInfo.mode), acc, parseInt(recentplay.countmiss))
					const iffcpp = await calculateSRwithacc(recentplay.beatmap_id, modsforcalc, modeconvert(GetMapInfo.mode), ifFCacc, 0)
					let lengthsec
					if (numDigits(parseFloat(GetMapInfo.lengthsec).toFixed(0)) === 1){
						lengthsec = ('00' + parseFloat(GetMapInfo.lengthsec).toFixed(0)).slice( -2 );
					}else{
						lengthsec = parseFloat(GetMapInfo.lengthsec).toFixed(0)
					}

					if (modforresult.includes("DT") && modforresult.includes("NC")) {
						let modsnotDT = modforresult.filter((item) => item.match("DT") == null);
						modforresult = modsnotDT;
					}

					let odscaled = ODscaled(GetMapInfo.od, mods);
					if(modforresult.length === 0){
						modforresult = "NM"
					}

					const embed = new MessageEmbed()
						.setColor("BLUE")
						.setTitle(`${GetMapInfo.artist} - ${GetMapInfo.title} [${GetMapInfo.version}]`)
						.setURL(GetMapInfo.maplink)
						.setAuthor(`${playersdata.username}: ${playersdata.pp_raw}pp (#${playersdata.pp_rank} ${playersdata.country}${playersdata.pp_country_rank})`,playersdata.iconurl,playersdata.playerurl)
						.addField("`Grade`", `**${recentplay.rank}** (${percentage}%) + ${modforresult}`, true)
						.addField("`Score`", recentplay.score, true)
						.addField("`Acc`", `${acc}%`, true)
						.addField("`PP`", `**${parseFloat(recentpp.ppwithacc).toFixed(2)}** / ${parseFloat(iffcpp.SSPP).toFixed(2)}PP`, true)
						.addField("`Combo`",`${recentplay.maxcombo}x / ${GetMapInfo.combo}x`,true)
						.addField("`Hits`",`{${recentplay.count300}/${recentplay.count100}/${recentplay.count50}/${recentplay.countmiss}}`,true)
						.addField("`If FC`", `**${parseFloat(iffcpp.ppwithacc).toFixed(2)}** / ${parseFloat(iffcpp.SSPP).toFixed(2)}PP`, true)
						.addField("`Acc`", `${ifFCacc}%`, true)
						.addField("`Hits`", `{${ifFC300}/${ifFC100}/${ifFC50}/0}`, true)
						.addField("`Map Info`", `Length:\`${GetMapInfo.lengthmin}:${lengthsec}\` BPM:\`${parseFloat(BPM).toFixed(0)}\` Objects:\`${GetMapInfo.combo}\` \n  CS:\`${GetMapInfo.cs}\` AR:\`${GetMapInfo.ar}\` OD:\`${parseFloat(odscaled).toFixed(1)}\` HP:\`${GetMapInfo.hp}\` Stars:\`${parseFloat(sr.sr).toFixed(2)}\``, true)
						.setImage(`https://assets.ppy.sh/beatmaps/${GetMapInfo.beatmapset_id}/covers/cover.jpg`)
						.setTimestamp()
						.setFooter(`${Mapstatus} mapset of ${GetMapInfo.mapper}`, mappersdata.iconurl);
						await message.channel.send(embed).then((sentMessage) => {
							setTimeout(() => {
								const embednew = new MessageEmbed()
								.setColor("BLUE")
								.setTitle(`${GetMapInfo.artist} - ${GetMapInfo.title} [${GetMapInfo.version}] [${parseFloat(sr.sr).toFixed(2)}★]`)
								.setThumbnail(`https://b.ppy.sh/thumb/${GetMapInfo.beatmapset_id}l.jpg`)
								.setURL(GetMapInfo.maplink)
								.setAuthor(`${playersdata.username}: ${playersdata.pp_raw}pp (#${playersdata.pp_rank} ${playersdata.country}${playersdata.pp_country_rank})`, playersdata.iconurl,playersdata.playerurl)
								.addField("`Result`",`**${recentplay.rank}** (**${percentage}%**) + **${modforresult}**   **Score**:**${recentplay.score}** (**ACC**:**${acc}%**) \n  **PP**:**${parseFloat(recentpp.ppwithacc).toFixed(2)}** / ${parseFloat(iffcpp.SSPP).toFixed(2)}   [**${recentplay.maxcombo}**x / ${GetMapInfo.combo}x]   {${recentplay.count300}/${recentplay.count100}/${recentplay.count50}/${recentplay.countmiss}}`, true)
								sentMessage.edit(embednew)
								}, 20000
							)
						}
					)
				}catch (e) {
					console.log(e);
				}
			}

			if(message.content.startsWith("!rm")){
				try {
					let playername;
					if(message.content.split(" ")[1] === undefined){
						try{
							let username = message.author.username;
							let osuid = fs.readFileSync(`./Player infomation/${username}.txt`, "utf-8");
							playername = osuid;
						}catch(e){
							console.log(e);
							message.reply("Error")
						}
					}else {
						playername = message.content.split(" ")[1];
						if(playername === undefined){
						message.reply("Error")
						return
						}
					}
					const recentplay = await Recentplay(apikey, playername, 3);
						if(recentplay == 0){
						message.reply("No records found for this player within 24 hours")
						return
						}
					let mods = parseMods(recentplay.enabled_mods)
					let modforresult = parseMods(recentplay.enabled_mods)
					const GetMapInfo = await getMapforRecent(recentplay.beatmap_id, apikey, mods);
					const playersdata = await getplayersdata(apikey, playername, GetMapInfo.mode);
					const mappersdata = await getplayersdata(apikey, GetMapInfo.mapper);
					const acc = tools.tools.accuracy({300: recentplay.count300, 100: recentplay.count100, 50: recentplay.count50, 0: recentplay.countmiss, geki: recentplay.countgeki, katu: recentplay.countkatu}, "mania")
					let BPM = GetMapInfo.bpm;
					let modsforcalc = parseModString(mods)
					if (mods.includes("NC")) {
						let modsnotNC = mods.filter((item) => item.match("NC") == null);
						mods = modsnotNC;
						modsforcalc = parseModString(mods)
						BPM *= 1.5
					}else if(mods.includes("HT")) {
						BPM *= 0.75;
					}
					let sr = await calculateSR(recentplay.beatmap_id, modsforcalc, modeconvert(GetMapInfo.mode))

					let ifFC100;
					if ((recentplay.countmiss === "0")) {
						ifFC100 = parseInt(recentplay.count100)
					}else{
						ifFC100 = parseInt(recentplay.count100) + parseInt(recentplay.countmiss)
					}

					let ifFC50 = parseInt(recentplay.count50)

					let ifFC200;
					if ((recentplay.countmiss === "0")) {
						ifFC200 = parseInt(recentplay.countkatu)
					}else{
						ifFC200 = parseInt(recentplay.countkatu) + parseInt(recentplay.countmiss)
					}

					let ifFC300
					if(recentplay.countmiss === "0"){
						ifFC300 = parseInt(GetMapInfo.combo) - parseInt(recentplay.countkatu) - parseInt(recentplay.count100) - parseInt(recentplay.count50)
					}else{
						ifFC300 = parseInt(GetMapInfo.combo) - parseInt(recentplay.countkatu) - parseInt(recentplay.count100) - parseInt(recentplay.count50) - parseInt(recentplay.countmiss)
					}
					const ifFCacc = tools.tools.accuracy({300: ifFC300, 100: ifFC100, 50: ifFC50, 0: 0, geki: 0, katu: ifFC200}, "mania")
					const percentage = parseFloat((parseInt(recentplay.totalhitcount) / parseInt(GetMapInfo.combo)) * 100).toFixed(0);
					const Mapstatus = mapstatus(GetMapInfo.approved);
					const recentpp = await calculateSRwithacc(recentplay.beatmap_id, modsforcalc, modeconvert(GetMapInfo.mode), acc, parseInt(recentplay.countmiss))
					const iffcpp = await calculateSRwithacc(recentplay.beatmap_id, modsforcalc, modeconvert(GetMapInfo.mode), ifFCacc, 0)
					let lengthsec
					if (numDigits(parseFloat(GetMapInfo.lengthsec).toFixed(0)) === 1){
						lengthsec = ('00' + parseFloat(GetMapInfo.lengthsec).toFixed(0)).slice( -2 );
					}else{
						lengthsec = parseFloat(GetMapInfo.lengthsec).toFixed(0)
					}

					if (modforresult.includes("DT") && modforresult.includes("NC")) {
						let modsnotDT = modforresult.filter((item) => item.match("DT") == null);
						modforresult = modsnotDT;
					}

					let odscaled = ODscaled(GetMapInfo.od, mods);
					if(modforresult.length === 0){
						modforresult = "NM"
					}

					let recent300 = parseInt(recentplay.count300) + parseInt(recentplay.countgeki)

					const embed = new MessageEmbed()
						.setColor("BLUE")
						.setTitle(`${GetMapInfo.artist} - ${GetMapInfo.title} [${GetMapInfo.version}]`)
						.setURL(GetMapInfo.maplink)
						.setAuthor(`${playersdata.username}: ${playersdata.pp_raw}pp (#${playersdata.pp_rank} ${playersdata.country}${playersdata.pp_country_rank})`,playersdata.iconurl,playersdata.playerurl)
						.addField("`Grade`", `**${recentplay.rank}** (${percentage}%) + ${modforresult}`, true)
						.addField("`Score`", recentplay.score, true)
						.addField("`Acc`", `${acc}%`, true)
						.addField("`PP`", `**${parseFloat(recentpp.ppwithacc).toFixed(2)}** / ${parseFloat(iffcpp.SSPP).toFixed(2)}PP`, true)
						.addField("`Combo`",`${recentplay.maxcombo}x / ${GetMapInfo.combo}x`,true)
						.addField("`Hits`",`{${recent300}/${recentplay.countkatu}/${recentplay.count100}/${recentplay.count50}/${recentplay.countmiss}}`,true)
						.addField("`If FC`", `**${parseFloat(iffcpp.ppwithacc).toFixed(2)}** / ${parseFloat(iffcpp.SSPP).toFixed(2)}PP`, true)
						.addField("`Acc`", `${ifFCacc}%`, true)
						.addField("`Hits`", `{${ifFC300}/${ifFC100}/${ifFC50}/0}`, true)
						.addField("`Map Info`", `Length:\`${GetMapInfo.lengthmin}:${lengthsec}\` BPM:\`${parseFloat(BPM).toFixed(0)}\` Objects:\`${GetMapInfo.combo}\` \n  CS:\`${GetMapInfo.cs}\` AR:\`${GetMapInfo.ar}\` OD:\`${parseFloat(odscaled).toFixed(1)}\` HP:\`${GetMapInfo.hp}\` Stars:\`${parseFloat(sr.sr).toFixed(2)}\``, true)
						.setImage(`https://assets.ppy.sh/beatmaps/${GetMapInfo.beatmapset_id}/covers/cover.jpg`)
						.setTimestamp()
						.setFooter(`${Mapstatus} mapset of ${GetMapInfo.mapper}`, mappersdata.iconurl);
						await message.channel.send(embed).then((sentMessage) => {
							setTimeout(() => {
								const embednew = new MessageEmbed()
								.setColor("BLUE")
								.setTitle(`${GetMapInfo.artist} - ${GetMapInfo.title} [${GetMapInfo.version}] [${parseFloat(sr.sr).toFixed(2)}★]`)
								.setThumbnail(`https://b.ppy.sh/thumb/${GetMapInfo.beatmapset_id}l.jpg`)
								.setURL(GetMapInfo.maplink)
								.setAuthor(`${playersdata.username}: ${playersdata.pp_raw}pp (#${playersdata.pp_rank} ${playersdata.country}${playersdata.pp_country_rank})`, playersdata.iconurl,playersdata.playerurl)
								.addField("`Result`",`**${recentplay.rank}** (**${percentage}%**) + **${modforresult}**   **Score**:**${recentplay.score}** (**ACC**:**${acc}%**) \n  **PP**:**${parseFloat(recentpp.ppwithacc).toFixed(2)}** / ${parseFloat(iffcpp.SSPP).toFixed(2)}   [**${recentplay.maxcombo}**x / ${GetMapInfo.combo}x]   {${recent300}/${recentplay.countkatu}/${recentplay.count100}/${recentplay.count50}/${recentplay.countmiss}}`, true)
								sentMessage.edit(embednew)
								}, 20000
							)
						}
					)
				}catch (e) {
					console.log(e);
				}
			}

			if (message.content === "!r") {
				message.reply("How to use: !r(o, t, c, m) <Username(optional)>")
				return
			}

			if (message.content.startsWith("!reg")) {
				if(message.content === "!reg"){
					message.reply("How to use: !reg <osu!username>")
				}else{
					const username = message.author.username;
					const osuid = message.content.split(" ")[1];
					console.log(`登録履歴 ${username}: ${osuid}`);
					try {
						fs.writeFileSync(`./Player infomation/${username}.txt`, osuid, "utf-8");
						message.reply(`${username}is saved as ${osuid}!`);
					} catch (e) {
						console.log(e);
					}
				}
			}

			if(message.content.startsWith("!ispp")){
				try{
					if(message.content === "!ispp"){
						message.reply("How to use: !ispp <Maplink> <Mods(Optional)>")
					}else{
						const args = message.content.substring(4).split(/\s+/);
						let mods
						let modsforcalc
						if (args.slice(2).length == 0) {
							mods = "NM"
							modsforcalc = 0
						}else{
							mods = splitString(args.slice(2))
							if (mods.includes("NC")) {
								let modsnotDT = mods.filter((item) => item.match("NC") == null);
								modsnotDT.push("DT")
							modsforcalc = parseModString(modsnotDT)
							}else{
								modsforcalc = parseModString(mods)
							}
						}
						const maplink = message.content.split(" ")[1]

						let data = await getMapInfo(maplink, apikey, mods);
						let sr = await calculateSR(data.beatmapId, modsforcalc, modeconvert(data.mode))
						const Mapstatus = mapstatus(data.approved);
						const FP = parseFloat(parseInt(sr.S0) / parseInt(data.totallength) * 100).toFixed(1)
						let FPmessage
						let rankplayer
						if(FP >= 700){
							FPmessage = "**This is SO GOOD PP map**"
						}else if(FP >= 400){
							FPmessage = "**This is PP map**"
						}else if(FP >= 200){
							FPmessage = "**This is PP map...?idk**"
						}else if(FP >= 100){
							FPmessage = "This is no PP map ;-;"
						}else{
							FPmessage = "This is no PP map ;-;"
						}

						if(sr.S0 >= 750){
							rankplayer = "**High rank player**"
						}else if(sr.S0 >= 500){
							rankplayer = "**Middle rank player**"
						}else if(sr.S0 >= 350){
							rankplayer = "**Funny map player**"
						}else{
							rankplayer = "**Beginner player**"
						}

						const ppdevidetotallength = (parseInt(sr.S0) / parseInt(data.totallength))
						const ppdevideparsefloat = parseFloat(ppdevidetotallength).toFixed(1)
						message.reply(`Totalpp : **${parseFloat(sr.S0).toFixed(2)}** (**${Mapstatus}**) | Farmscore : **${FP}** For ${rankplayer} | ${FPmessage} (${ppdevideparsefloat} pp/s)`)
					}
				}catch(e){
					console.log(e)
					message.reply("Error")
				}
			}

			if (message.content.startsWith("!lb")) {
				try{
					if(message.content === "!lb"){
						message.reply("How to use: !lb <Maplink> <Mods(Optional)>")
						return
					}else{
						const maplink = message.content.split(" ")[1]
						const beatmapid = maplink.split("/")[5].split(" ")[0]
						const args = message.content.substring(4).split(/\s+/);
						let mods = []
						if(args.slice(1).length === 0){
							mods.push("NM")
						}else{
							mods = splitString(args.slice(1))
						}

						let modsnotNC = mods
						if(mods.includes("NC")) {
							mods.push("DT")
							modsnotNC = mods.filter((item) => item.match("NC") == null);
						}
						const Mapinfo = await getMapInfo(maplink, apikey, mods)
						const mapperinfo = await getplayersdata(apikey, Mapinfo.mapper, Mapinfo.mode)
						const mapsetlink = Mapinfo.maplink.split("/")[4].split("#")[0];
						let SR = await calculateSR(beatmapid, parseModString(modsnotNC), modeconvert(Mapinfo.mode))
						let BPM = Mapinfo.bpm
						if (mods.includes('NC')) {
							mods.push('DT');
						}
						if (mods.includes("NC") || mods.includes("DT")){
							BPM *= 1.5
						}else if(mods.includes("HT")){
							BPM *= 0.75
						}
						const resulttop5 = await GetMapScore(beatmapid, parseModString(mods), apikey, Mapinfo.mode)
						if (mods.includes("DT") && mods.includes("NC")) {
							let modsnotDT = mods.filter((item) => item.match("DT") == null);
							mods = modsnotDT;
						}
						let acc0
						let acc1
						let acc2
						let acc3
						let acc4
						if (resulttop5.length === 5){
							acc0 = tools.tools.accuracy({300: resulttop5[0].count300, 100: resulttop5[0].count100, 50: resulttop5[0].count50, 0: resulttop5[0].countmiss, geki:  resulttop5[0].countgeki, katu: resulttop5[0].countkatu}, modeconvert(Mapinfo.mode))
							acc1 = tools.tools.accuracy({300: resulttop5[1].count300, 100: resulttop5[1].count100, 50: resulttop5[1].count50, 0: resulttop5[1].countmiss, geki:  resulttop5[1].countgeki, katu: resulttop5[1].countkatu}, modeconvert(Mapinfo.mode))
							acc2 = tools.tools.accuracy({300: resulttop5[2].count300, 100: resulttop5[2].count100, 50: resulttop5[2].count50, 0: resulttop5[2].countmiss, geki:  resulttop5[2].countgeki, katu: resulttop5[2].countkatu}, modeconvert(Mapinfo.mode))
							acc3 = tools.tools.accuracy({300: resulttop5[3].count300, 100: resulttop5[3].count100, 50: resulttop5[3].count50, 0: resulttop5[3].countmiss, geki:  resulttop5[3].countgeki, katu: resulttop5[3].countkatu}, modeconvert(Mapinfo.mode))
							acc4 = tools.tools.accuracy({300: resulttop5[4].count300, 100: resulttop5[4].count100, 50: resulttop5[4].count50, 0: resulttop5[4].countmiss, geki:  resulttop5[4].countgeki, katu: resulttop5[4].countkatu}, modeconvert(Mapinfo.mode))
								const embed = new MessageEmbed()
									.setColor("BLUE")
									.setTitle(`Map leaderboard:${Mapinfo.artist} - ${Mapinfo.title} [${Mapinfo.version}]`)
									.setURL(maplink)
									.setAuthor(`Mapped by ${mapperinfo.username}`, mapperinfo.iconurl, `https://osu.ppy.sh/users/${mapperinfo.user_id}`)
									.addField("**MapInfo**", `\`Mods\`: **${mods.join("")}** \`SR\`: **${parseFloat(SR.sr).toFixed(1)}** \`BPM\`: **${parseFloat(BPM).toFixed(1)}**`, true)
									.addField("\`#1\`", `**Rank**: \`${resulttop5[0].rank}\` **Player**: \`${resulttop5[0].username}\` **Score**: ${resulttop5[0].score} \n [\`${resulttop5[0].maxcombo}\`combo] \`${acc0}\`% \`${resulttop5[0].pp}\`pp miss:${resulttop5[0].countmiss}`,false)
									.addField("\`#2\`", `**Rank**: \`${resulttop5[1].rank}\` **Player**: \`${resulttop5[1].username}\` **Score**: ${resulttop5[1].score} \n [\`${resulttop5[1].maxcombo}\`combo] \`${acc1}\`% \`${resulttop5[1].pp}\`pp miss:${resulttop5[1].countmiss}`,false)
									.addField("\`#3\`", `**Rank**: \`${resulttop5[2].rank}\` **Player**: \`${resulttop5[2].username}\` **Score**: ${resulttop5[2].score} \n [\`${resulttop5[2].maxcombo}\`combo] \`${acc2}\`% \`${resulttop5[2].pp}\`pp miss:${resulttop5[2].countmiss}`,false)
									.addField("\`#4\`", `**Rank**: \`${resulttop5[3].rank}\` **Player**: \`${resulttop5[3].username}\` **Score**: ${resulttop5[3].score} \n [\`${resulttop5[3].maxcombo}\`combo] \`${acc3}\`% \`${resulttop5[3].pp}\`pp miss:${resulttop5[3].countmiss}`,false)
									.addField("\`#5\`", `**Rank**: \`${resulttop5[4].rank}\` **Player**: \`${resulttop5[4].username}\` **Score**: ${resulttop5[4].score} \n [\`${resulttop5[4].maxcombo}\`combo] \`${acc4}\`% \`${resulttop5[4].pp}\`pp miss:${resulttop5[2].countmiss}`,false)
									.setImage(`https://assets.ppy.sh/beatmaps/${mapsetlink}/covers/cover.jpg`)
							message.channel.send(embed)
						}else if(resulttop5.length === 4){
							acc0 = tools.tools.accuracy({300: resulttop5[0].count300, 100: resulttop5[0].count100, 50: resulttop5[0].count50, 0: resulttop5[0].countmiss, geki:  resulttop5[0].countgeki, katu: resulttop5[0].countkatu}, modeconvert(Mapinfo.mode))
							acc1 = tools.tools.accuracy({300: resulttop5[1].count300, 100: resulttop5[1].count100, 50: resulttop5[1].count50, 0: resulttop5[1].countmiss, geki:  resulttop5[1].countgeki, katu: resulttop5[1].countkatu}, modeconvert(Mapinfo.mode))
							acc2 = tools.tools.accuracy({300: resulttop5[2].count300, 100: resulttop5[2].count100, 50: resulttop5[2].count50, 0: resulttop5[2].countmiss, geki:  resulttop5[2].countgeki, katu: resulttop5[2].countkatu}, modeconvert(Mapinfo.mode))
							acc3 = tools.tools.accuracy({300: resulttop5[3].count300, 100: resulttop5[3].count100, 50: resulttop5[3].count50, 0: resulttop5[3].countmiss, geki:  resulttop5[3].countgeki, katu: resulttop5[3].countkatu}, modeconvert(Mapinfo.mode))
								const embed = new MessageEmbed()
									.setColor("BLUE")
									.setTitle(`Map leaderboard:${Mapinfo.artist} - ${Mapinfo.title} [${Mapinfo.version}]`)
									.setURL(maplink)
									.setAuthor(`Mapped by ${mapperinfo.username}`, mapperinfo.iconurl, `https://osu.ppy.sh/users/${mapperinfo.user_id}`)
									.addField("**MapInfo**", `\`Mods\`: **${mods.join("")}** \`SR\`: **${parseFloat(SR.sr).toFixed(1)}** \`BPM\`: **${parseFloat(BPM).toFixed(1)}**`, true) 
									.addField("\`#1\`", `**Rank**: \`${resulttop5[0].rank}\` **Player**: \`${resulttop5[0].username}\` **Score**: ${resulttop5[0].score} \n [\`${resulttop5[0].maxcombo}\`combo] \`${acc0}\`% \`${resulttop5[0].pp}\`pp miss:${resulttop5[0].countmiss}`,false)
									.addField("\`#2\`", `**Rank**: \`${resulttop5[1].rank}\` **Player**: \`${resulttop5[1].username}\` **Score**: ${resulttop5[1].score} \n [\`${resulttop5[1].maxcombo}\`combo] \`${acc1}\`% \`${resulttop5[1].pp}\`pp miss:${resulttop5[1].countmiss}`,false)
									.addField("\`#3\`", `**Rank**: \`${resulttop5[2].rank}\` **Player**: \`${resulttop5[2].username}\` **Score**: ${resulttop5[2].score} \n [\`${resulttop5[2].maxcombo}\`combo] \`${acc2}\`% \`${resulttop5[2].pp}\`pp miss:${resulttop5[2].countmiss}`,false)
									.addField("\`#4\`", `**Rank**: \`${resulttop5[3].rank}\` **Player**: \`${resulttop5[3].username}\` **Score**: ${resulttop5[3].score} \n [\`${resulttop5[3].maxcombo}\`combo] \`${acc3}\`% \`${resulttop5[3].pp}\`pp miss:${resulttop5[3].countmiss}`,false)
									.setImage(`https://assets.ppy.sh/beatmaps/${mapsetlink}/covers/cover.jpg`)
							message.channel.send(embed)
						}else if (resulttop5.length === 3){
							acc0 = tools.tools.accuracy({300: resulttop5[0].count300, 100: resulttop5[0].count100, 50: resulttop5[0].count50, 0: resulttop5[0].countmiss, geki:  resulttop5[0].countgeki, katu: resulttop5[0].countkatu}, modeconvert(Mapinfo.mode))
							acc1 = tools.tools.accuracy({300: resulttop5[1].count300, 100: resulttop5[1].count100, 50: resulttop5[1].count50, 0: resulttop5[1].countmiss, geki:  resulttop5[1].countgeki, katu: resulttop5[1].countkatu}, modeconvert(Mapinfo.mode))
							acc2 = tools.tools.accuracy({300: resulttop5[2].count300, 100: resulttop5[2].count100, 50: resulttop5[2].count50, 0: resulttop5[2].countmiss, geki:  resulttop5[2].countgeki, katu: resulttop5[2].countkatu}, modeconvert(Mapinfo.mode))
								const embed = new MessageEmbed()
									.setColor("BLUE")
									.setTitle(`Map leaderboard:${Mapinfo.artist} - ${Mapinfo.title} [${Mapinfo.version}]`)
									.setURL(maplink)
									.setAuthor(`Mapped by ${mapperinfo.username}`, mapperinfo.iconurl, `https://osu.ppy.sh/users/${mapperinfo.user_id}`)
									.addField("**MapInfo**", `\`Mods\`: **${mods.join("")}** \`SR\`: **${parseFloat(SR.sr).toFixed(1)}** \`BPM\`: **${parseFloat(BPM).toFixed(1)}**`, true) 
									.addField("\`#1\`", `**Rank**: \`${resulttop5[0].rank}\` **Player**: \`${resulttop5[0].username}\` **Score**: ${resulttop5[0].score} \n [\`${resulttop5[0].maxcombo}\`combo] \`${acc0}\`% \`${resulttop5[0].pp}\`pp miss:${resulttop5[0].countmiss}`,false)
									.addField("\`#2\`", `**Rank**: \`${resulttop5[1].rank}\` **Player**: \`${resulttop5[1].username}\` **Score**: ${resulttop5[1].score} \n [\`${resulttop5[1].maxcombo}\`combo] \`${acc1}\`% \`${resulttop5[1].pp}\`pp miss:${resulttop5[1].countmiss}`,false)
									.addField("\`#3\`", `**Rank**: \`${resulttop5[2].rank}\` **Player**: \`${resulttop5[2].username}\` **Score**: ${resulttop5[2].score} \n [\`${resulttop5[2].maxcombo}\`combo] \`${acc2}\`% \`${resulttop5[2].pp}\`pp miss:${resulttop5[2].countmiss}`,false)
									.setImage(`https://assets.ppy.sh/beatmaps/${mapsetlink}/covers/cover.jpg`)
							message.channel.send(embed)
						}else if(resulttop5.length === 2){
							acc0 = tools.tools.accuracy({300: resulttop5[0].count300, 100: resulttop5[0].count100, 50: resulttop5[0].count50, 0: resulttop5[0].countmiss, geki:  resulttop5[0].countgeki, katu: resulttop5[0].countkatu}, modeconvert(Mapinfo.mode))
							acc1 = tools.tools.accuracy({300: resulttop5[1].count300, 100: resulttop5[1].count100, 50: resulttop5[1].count50, 0: resulttop5[1].countmiss, geki:  resulttop5[1].countgeki, katu: resulttop5[1].countkatu}, modeconvert(Mapinfo.mode))
								const embed = new MessageEmbed()
									.setColor("BLUE")
									.setTitle(`Map leaderboard:${Mapinfo.artist} - ${Mapinfo.title} [${Mapinfo.version}]`)
									.setURL(maplink)
									.setAuthor(`Mapped by ${mapperinfo.username}`, mapperinfo.iconurl, `https://osu.ppy.sh/users/${mapperinfo.user_id}`)
									.addField("**MapInfo**", `\`Mods\`: **${mods.join("")}** \`SR\`: **${parseFloat(SR.sr).toFixed(1)}** \`BPM\`: **${parseFloat(BPM).toFixed(1)}**`, true) 
									.addField("\`#1\`", `**Rank**: \`${resulttop5[0].rank}\` **Player**: \`${resulttop5[0].username}\` **Score**: ${resulttop5[0].score} \n [\`${resulttop5[0].maxcombo}\`combo] \`${acc0}\`% \`${resulttop5[0].pp}\`pp miss:${resulttop5[0].countmiss}`,false)
									.addField("\`#2\`", `**Rank**: \`${resulttop5[1].rank}\` **Player**: \`${resulttop5[1].username}\` **Score**: ${resulttop5[1].score} \n [\`${resulttop5[1].maxcombo}\`combo] \`${acc1}\`% \`${resulttop5[1].pp}\`pp miss:${resulttop5[1].countmiss}`,false)
									.setImage(`https://assets.ppy.sh/beatmaps/${mapsetlink}/covers/cover.jpg`)
							message.channel.send(embed)
						}else if(resulttop5.length === 1){
							acc0 = tools.tools.accuracy({300: resulttop5[0].count300, 100: resulttop5[0].count100, 50: resulttop5[0].count50, 0: resulttop5[0].countmiss, geki:  resulttop5[0].countgeki, katu: resulttop5[0].countkatu}, modeconvert(Mapinfo.mode))
							const embed = new MessageEmbed()
								.setColor("BLUE")
								.setTitle(`Map leaderboard:${Mapinfo.artist} - ${Mapinfo.title} [${Mapinfo.version}]`)
								.setURL(maplink)
								.setAuthor(`Mapped by ${mapperinfo.username}`, mapperinfo.iconurl, `https://osu.ppy.sh/users/${mapperinfo.user_id}`)
								.addField("**MapInfo**", `\`Mods\`: **${mods.join("")}** \`SR\`: **${parseFloat(SR.sr).toFixed(1)}** \`BPM\`: **${parseFloat(BPM).toFixed(1)}**`, true) 
								.addField("\`#1\`", `**Rank**: \`${resulttop5[0].rank}\` **Player**: \`${resulttop5[0].username}\` **Score**: ${resulttop5[0].score} \n [\`${resulttop5[0].maxcombo}\`combo] \`${acc0}\`% \`${resulttop5[0].pp}\`pp miss:${resulttop5[0].countmiss}`,false)
								.setImage(`https://assets.ppy.sh/beatmaps/${mapsetlink}/covers/cover.jpg`)
							message.channel.send(embed)
						}else{
							message.channel.send("No score found")
						}
					}
				}catch(e){
					console.log(e)
					message.reply("エラーが発生したよ！")
				}
			}

			if(message.content === "!help"){
				message.reply("How to use command \n 1: `!mapl <maplink> <mods(optional)>` You can get more information about the map. By adding mods to the command, you can see the SR, PP, and BPM when the mods are applied. \n 2:`!r<mode(o, t, c, m)> <username(optional)>` You can view the most recent your record for each mode. \n 3:`!reg <osu!username>` It will be possible to link Discord username to osu!username and omit usernames when sending commands(!rt command). \n 4:`!ispp <maplink> <mods(optional)>` It calculates the pp per song total time and tells you if it is efficient. \n 5:`!lb <maplink> <mods(optional)>` You can view the top 5 rankings by mods.\n 6:`!s <maplink> <username(optional)>` You can view your best score at the map.\n 7: `!check <maplink>` It show the map's max stream length!")
			}

			if(message.content.startsWith("!s")){
				try{
					if(message.content === "!s"){
						message.reply("How to use: !s <Maplink> <username(optional)>")
						return
					}
					let playername;
					if(message.content.split(" ")[2] === undefined){
						try{
							let username = message.author.username;
							let osuid = fs.readFileSync(`./Player infomation/${username}.txt`, "utf-8");
							playername = osuid;
						}catch(e){
							console.log(e);
							message.reply("Error")
						}
					}else {
						playername = message.content.split(" ")[2];
						if(playername === undefined){
							message.reply("Error")
							return
						}
					}
					const beatmapId = message.content.split("#")[1].split("/")[1].split(" ")[0];
					const maplink = message.content.split(" ")[1]
					const Mapinfo = await getMapInfowithoutmods(maplink, apikey)
					const playersscore = await getplayerscore(apikey, beatmapId, playername, Mapinfo.mode)
					if(playersscore == 0){
						message.reply("No score found. Is this convertmap? convertmap is incompatible!")
						return
					}
					const Playersinfo = await getplayersdata(apikey, playername, Mapinfo.mode)
					const Mapperinfo = await getplayersdata(apikey, Mapinfo.mapper, Mapinfo.mode)
					const acc = tools.tools.accuracy({300: playersscore.count300, 100: playersscore.count100, 50: playersscore.count50, 0: playersscore.countmiss, geki : playersscore.countgeki, katu: playersscore.countgeki}, modeconvert(Mapinfo.mode))

					let stringmods = parseMods(playersscore.enabled_mods)
					if(stringmods.includes("DT") && stringmods.includes("NC")){
						let modsnotNC = stringmods.filter((item) => item.match("NC") == null);
						stringmods = modsnotNC;
					}

					const srpp = await calculateSRwithacc(beatmapId, parseModString(stringmods), modeconvert(Mapinfo.mode), acc, parseInt(playersscore.countmiss))

					let Hits
					if(Mapinfo.mode == 0 || 1){
						Hits = `{${playersscore.count300}/${playersscore.count100}/${playersscore.countmiss}}`
					}else if(Mapinfo.mode == 2){
						Hits = `{${playersscore.count300}/${playersscore.count100}/${playersscore.count50}/${playersscore.countmiss}}`
					}else if(Mapinfo.mode == 3){
						let maniascore300 = parseInt(playersscore.count300) + parseInt(playersscore.countgeki)
						Hits `{${maniascore300}/${playersscore.countkatu}/${playersscore.count100}/${playersscore.count50}/${playersscore.countmiss}}`
					}

					let showonlymods = parseMods(playersscore.enabled_mods)
					if(showonlymods.includes("DT") && showonlymods.includes("NC")){
						let modsnotDT = showonlymods.filter((item) => item.match("DT") == null);
						showonlymods = modsnotDT;
					}else if(showonlymods.length == 0){
						showonlymods.push("NM")
					}

					let bpm = Mapinfo.bpm
					if (stringmods.includes("DT") || stringmods.includes("NC")) {
						bpm *= 1.5;
					}else if(stringmods.includes("HT")){
						bpm *= 0.75
					}

					const embed = new MessageEmbed()
						.setColor("BLUE")
						.setTitle(`${Mapinfo.artist} - ${Mapinfo.title} [${Mapinfo.version}]`)
						.setURL(maplink)
						.setAuthor(`Mapped by ${Mapinfo.mapper}`, Mapperinfo.iconurl, `https://osu.ppy.sh/users/${Mapperinfo.user_id}`)
						.addField("Player name",`[${playername}](https://osu.ppy.sh/users/${playername})`,true)
						.addField("SR", `\`★${parseFloat(srpp.sr).toFixed(2)}\``, true)
						.addField("BPM", `\`${bpm}\``, true)
						.addField("Rank", `\`${playersscore.rank}\``, true)
						.addField("Hits", Hits, true)
						.addField("Mods", `\`${showonlymods.join("")}\``, true)
						.addField("Accuracy", `\`${acc}%\``, true)
						.addField("PP", `**${parseFloat(srpp.ppwithacc).toFixed(2)}** / ${parseFloat(srpp.SSPP).toFixed(2)} `, true)
						.addField("Mirror Download link",`[Nerinyan](https://api.nerinyan.moe/d/${Mapinfo.beatmapset_id}?nv=1) \n [Beatconnect](https://beatconnect.io/b/${Mapinfo.beatmapset_id})`, true)
						.setImage(`https://assets.ppy.sh/beatmaps/${Mapinfo.beatmapset_id}/covers/cover.jpg`)
						.setFooter(`Played by ${playername}  #${Playersinfo.pp_rank} (${Playersinfo.country}${Playersinfo.pp_country_rank})`, Playersinfo.iconurl);
						message.channel.send(embed);
				}catch(e){
					console.log(e)
					message.reply("Error")
				}
			}

			if(message.content.startsWith("!check")){
				try{
					if(message.content == "!check"){
						message.reply("How to use: !check <Maplink>")
						return
					}
					const beatmapId = message.content.split(" ")[1].split("/")[5]
					const bpm = await getMapInfowithoutmods(message.content.split(" ")[1], apikey)
					await getOsuBeatmapFile(beatmapId)
					const streamdata = await checkStream(beatmapId, bpm.bpm)
					await message.reply(`Streamlength: ${streamdata} `)
					try {
						fs.unlinkSync(`./BeatmapFolder/${beatmapId}.txt`);
					}catch(e) {
						console.log(e)
					}
				}catch(e){
					message.reply("Error")
					console.log(e)
				}
			}
		}
	)
}catch(e){
	console.log(e)
}

//discord bot login
client.login(token);
