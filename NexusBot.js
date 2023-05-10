//require library
const { Client, Intents,  MessageEmbed } = require("discord.js");
require('dotenv').config();
const axios = require("axios");
const fs = require("fs")

//requireFIle
const { calculateSR, calculateSRwithacc } = require("./CalculateSR/CalculateSRPP")
const { modeconvert } = require("./Mode/Mode")
const { calcAccuracyosu, calcAccuracytaiko, calcAccuracyctb, calcAccuracymania } = require("./Acc/Acc")
const { getMapInfo, mapstatus, getMapforRecent  } = require("./GetmapInfo/GetMapInfo")
const { Recentplay } = require("./GetmapInfo/GetRecentScore")
const { parseModString, parseMods, splitString } = require("./Modsconvert/Mods")
const { getplayersdata} = require("./GetUser/userplays")
const { numDigits } = require("./numDigit/numDigit");
const { ODscaled } = require("./OD/ODscaled")

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
						message.reply("How to use: !mapl maplink mods(optional)")
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
							BPM /= 0.75;
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
						.addField(`[**__${MapInfo.version}__**] **+${Showonlymods.join("")}**`, `Combo: \`${MapInfo.combo}\` Stars: \`${parseFloat(srpps.sr).toFixed(2)}\` \n Length: \`${MapInfo.lengthmin}:${lengthsec}\` BPM: \`${parseFloat(BPM).toFixed(1)}\` Objects: \`${MapInfo.combo}\` \n CS: \`${MapInfo.cs}\` AR: \`${MapInfo.ar}\` OD: \`${od}\` HP: \`${MapInfo.hp}\` Spinners: \`${MapInfo.countspinner}\``, true)
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
					const acc = calcAccuracyosu(parseInt(recentplay.count300), parseInt(recentplay.count100), parseInt(recentplay.count50), parseInt(recentplay.countmiss));
					let BPM = GetMapInfo.bpm;
					let modsforcalc
					if (mods.includes("NC")) {
						let modsnotNC = mods.filter((item) => item.match("NC") == null);
						mods = modsnotNC;
						modsforcalc = parseModString(mods)
						BPM *= 1.5
					}else if(mods.includes("HT")) {
						BPM /= 0.75;
					}
					let sr = await calculateSR(recentplay.beatmap_id, modsforcalc, getMapforRecent.mode)
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
					const ifFCacc = calcAccuracyosu(ifFC300, ifFC100, 0, 0);
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
								.setThumbnail(`https://b.ppy.sh/thumb/${getMapInfo.beatmapset_id}l.jpg`)
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
					const acc = calcAccuracytaiko(parseInt(recentplay.count300), parseInt(recentplay.count100), parseInt(recentplay.countmiss));
					let BPM = GetMapInfo.bpm;
					let modsforcalc
					if (mods.includes("NC")) {
						let modsnotNC = mods.filter((item) => item.match("NC") == null);
						mods = modsnotNC;
						modsforcalc = parseModString(mods)
						BPM *= 1.5
					}else if(mods.includes("HT")) {
						BPM /= 0.75;
					}
					let sr = await calculateSR(recentplay.beatmap_id, modsforcalc, getMapforRecent.mode)
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
					const ifFCacc = calcAccuracytaiko(ifFC300, ifFC100, 0);
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
								.setThumbnail(`https://b.ppy.sh/thumb/${getMapInfo.beatmapset_id}l.jpg`)
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
					const acc = calcAccuracyctb(parseInt(recentplay.count300), parseInt(recentplay.count100), parseInt(recentplay.count50), parseInt(recentplay.countmiss), parseInt(recentplay.countkatu));
					let BPM = GetMapInfo.bpm;
					let modsforcalc
					if (mods.includes("NC")) {
						let modsnotNC = mods.filter((item) => item.match("NC") == null);
						mods = modsnotNC;
						modsforcalc = parseModString(mods)
						BPM *= 1.5
					}else if(mods.includes("HT")) {
						BPM /= 0.75;
					}
					let sr = await calculateSR(recentplay.beatmap_id, modsforcalc, getMapforRecent.mode)
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
					const ifFCacc = calcAccuracyctb(ifFC300, ifFC100, ifFC50, 0, 0);
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
								.setThumbnail(`https://b.ppy.sh/thumb/${getMapInfo.beatmapset_id}l.jpg`)
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
					const mania300 = parseInt(recentplay.count300) + parseInt(recentplay.countgeki)
					const acc = calcAccuracymania(mania300, parseInt(recentplay.count100), parseInt(recentplay.count50), parseInt(recentplay.countkatu), parseInt(recentplay.countmiss));
					let BPM = GetMapInfo.bpm;
					let modsforcalc
					if (mods.includes("NC")) {
						let modsnotNC = mods.filter((item) => item.match("NC") == null);
						mods = modsnotNC;
						modsforcalc = parseModString(mods)
						BPM *= 1.5
					}else if(mods.includes("HT")) {
						BPM /= 0.75;
					}
					let sr = await calculateSR(recentplay.beatmap_id, modsforcalc, getMapforRecent.mode)

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
					const ifFCacc = calcAccuracymania(ifFC300, ifFC100, ifFC50, ifFC200, 0);
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
								.setThumbnail(`https://b.ppy.sh/thumb/${getMapInfo.beatmapset_id}l.jpg`)
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
				message.reply("How to use: !r(o, t, c, m) username(optional)")
				return
			}

			if (message.content.startsWith("!reg")) {
				if(message.content === "!reg"){
					message.reply("How to use: !reg osu!username")
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
					message.reply("使い方: !ispp [maplink] [mods(Optional)]")
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
		}
	)
}catch(e){
	console.log(e)
}

//discord bot login
client.login(token);
