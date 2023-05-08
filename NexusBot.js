//require library
const { Client, Intents,  MessageEmbed } = require("discord.js");
require('dotenv').config();
const axios = require("axios");

//requireFIle
const { calculateSR } = require("./CalculateSR/CalculateSRPP")
const { modeconvert } = require("./Mode/Mode")
const { calcAccuracy } = require("./Acc/Acc")
const { getMapInfo, mapstatus } = require("./GetmapInfo/GetMapInfo")
const { parseModString, parseMods, splitString } = require("./Modsconvert/Mods")
const { getplayersdata, getplayerscore } = require("./GetUser/userplays")
const { numDigits } = require("./numDigit/numDigit");
const { accuracy } = require("osu-api-extended/dist/utility/tools");

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

client.on("message", async(message) =>
	{
		if(message.content.startsWith("!mapl")){
			try{
				if(message.content == "!mapl"){
					message.reply("How to use: !mapl maplink mods")
				}else{
					const MessageMaplink = message.content.split(" ")[1]
					let Mods
					if(message.content.substring(4).split(/\s+/).slice(2).length === 0){
						Mods = ['NM']
					}else{
					Mods = splitString(message.content.substring(4).split(/\s+/).slice(2))
					}
					const MapInfo = await getMapInfo(MessageMaplink, apikey, Mods)
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

					//make Discord.js EmbedMessage
					const maplembed = new MessageEmbed()
					.setColor("BLUE")
					.setTitle(`${MapInfo.artist} - ${MapInfo.title}`)
					.setURL(MapInfo.maplink)
					.addField("Music and Backgroud",`:musical_note:[Song Preview](https://b.ppy.sh/preview/${MapInfo.beatmapset_id}.mp3) :frame_photo:[Full background](https://assets.ppy.sh/beatmaps/${MapInfo.beatmapset_id}/covers/raw.jpg)`)
					.setAuthor(`Created by ${MapInfo.mapper}`, mapperdata.iconurl, mapperdata.playerurl)
					.addField(`[**__${MapInfo.version}__**] **+${Mods.join("")}**`, `Combo: \`${MapInfo.combo}\` Stars: \`${parseFloat(srpps.sr).toFixed(2)}\` \n Length: \`${MapInfo.lengthmin}:${lengthsec}\` BPM: \`${MapInfo.bpm}\` Objects: \`${MapInfo.combo}\` \n CS: \`${MapInfo.cs}\` AR: \`${MapInfo.ar}\` OD: \`${MapInfo.od}\` HP: \`${MapInfo.hp}\` Spinners: \`${MapInfo.countspinner}\``, true)
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
	}
)

//discord bot login
client.login(token);
