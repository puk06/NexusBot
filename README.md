# NexusBot
This is a bot for all mode player. Easy to use some Bathbot command.

# IMPORTANT
The information sent to Discord is similar, as it is based on Bathbot, but the code is completely different. I wrote everything from beginning to end.

This bot is a rewritten code of AeroBot a.k.a. Hoshino Bot to support all modes. the layout of the one sent to Discord (Embed) is almost all the same.

### Embed based [Bathbot](https://github.com/MaxOhn/Bathbot)

### If you want to add this bot use this [link](https://discord.com/api/oauth2/authorize?client_id=1105049601762930738&permissions=92160&scope=bot)

# How to use

start 
```
NexusBot.js
```

# REQUIRED LIBRARY

[Node.js](https://nodejs.org/ja)

[rosu-pp-js](https://github.com/MaxOhn/rosu-pp-js)

[osu-api-extended](https://github.com/cyperdark/osu-api-extended)

[discord.js](https://discord.js.org/#/)

[axios](https://www.npmjs.com/package/axios)

[dotenv](https://github.com/motdotla/dotenv)

```
npm i
```

# COMMAND

1: `!mapl <maplink> <mods>` 
You can view about the map with mod(If you want Mods to be NM, please leave the Mods field blank)

Example ```!mapl https://osu.ppy.sh/beatmapsets/1895850#taiko/3907074 HDNC```

![maplcommand](https://i.imgur.com/1f9UUi1.png)

2: `!ro(osu!standard) !rt(taiko) !rc(ctb) !rm(mania) <username(optional)>`
You can view your recently score!

Username can be omitted if you are using the !reg command

Example ```!rt (Hoshino1)```

![rtcommand](https://i.imgur.com/bRwwBIz.png)

3:`!reg <osu!username>`
Connect your Discord name to your osu!username, allowing you to omit your osu!username

Message reply
```<Discord name>is saved as <osu!username>!```


4:`!ispp <maplink> <mods(optional)>`
It will tell you if the map is pp

Example ```!ispp https://osu.ppy.sh/beatmapsets/1875669#taiko/3859915 HDNCHR```

![isppcommand](https://i.imgur.com/TeyaAmE.png)

5:`!lb <maplink> <mods(optional)>`
You can see the ranking by mod for that map

Example ```!lb https://osu.ppy.sh/beatmapsets/1717748#fruits/3510391 HDHR```

![lbcommand](https://i.imgur.com/ZYLUt9n.png)

6:`!s <maplink> <username(optional)>`
You can see your best record on that map.(Converted scores are not supported)

Example```!s https://osu.ppy.sh/beatmapsets/1402249#taiko/2892814 (Hoshino1)```

![!scommand](https://i.imgur.com/wcJyx3J.png)



