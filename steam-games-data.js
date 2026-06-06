(function () {
    const DEFAULT_PRICE_DZD = 500;

    function steamImage(appId) {
        return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
    }

    function steamUrl(appId) {
        return `https://store.steampowered.com/app/${appId}/`;
    }

    const games = [
        { id: '007-first-light', steamAppId: 3768760, name: '007 First Light', releaseYear: 2026, tags: ['New', 'Action', 'Adventure'], imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3768760/dbe86ebd2edb4c77d113e9e2feefeb90189fabc9/header.jpg?t=1780705646' },
        { id: 'lego-batman-legacy-of-the-dark-knight', steamAppId: 2215200, name: 'LEGO Batman: Legacy of the Dark Knight', releaseYear: 2026, tags: ['New', 'Open World', 'Action'], imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2215200/a07a9a6c0c9c1225f5b260b4f29fe40e6f099f6b/header.jpg?t=1780591479' },
        { id: 'resident-evil-requiem', steamAppId: 3764200, name: 'Resident Evil Requiem', releaseYear: 2026, tags: ['New', 'Horror', 'Action'], imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3764200/ce5437442768e38eb575f205ab9397d0264017b0/header.jpg?t=1779840172' },
        { id: 'subnautica-2', steamAppId: 1962700, name: 'Subnautica 2', releaseYear: 2026, tags: ['New', 'Survival', 'Adventure'], imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1962700/header.jpg?t=1780372044' },
        { id: 'slay-the-spire-2', steamAppId: 2868840, name: 'Slay the Spire 2', releaseYear: 2026, tags: ['New', 'Roguelike', 'Strategy'], imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2868840/b0958d387dc366211e0f353443710cfcf9fdb020/header.jpg?t=1776735385' },
        { id: 'crimson-desert', steamAppId: 3321460, name: 'Crimson Desert', releaseYear: 2026, tags: ['New', 'Open World', 'Action'], imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3321460/abd7dbdeaede8b6c9a6d40bf116ff2b883f2dd45/header.jpg?t=1777016399' },
        { id: 'dragon-quest-vii-reimagined', steamAppId: 2499860, name: 'DRAGON QUEST VII Reimagined', releaseYear: 2026, tags: ['New', 'RPG', 'JRPG'], imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2499860/ea0c655407c078a8994b7e91256c79d90169133a/header.jpg?t=1772804835' },
        { id: 'pragmata', steamAppId: 3357650, name: 'PRAGMATA', releaseYear: 2026, tags: ['New', 'Action', 'Adventure'], imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3357650/e32e168b25ed68a0cf6264c220c07e96c2abfb56/header.jpg?t=1777351016' },
        { id: 'nioh-3', steamAppId: 3681010, name: 'Nioh 3', releaseYear: 2026, tags: ['New', 'Soulslike', 'Action'], imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3681010/a21264e9fd476dcb2901c2432b598107d024c5a8/header.jpg?t=1772090941' },
        { id: 'the-blood-of-dawnwalker', steamAppId: 3751260, name: 'The Blood of Dawnwalker', releaseYear: 2026, tags: ['New', 'RPG', 'Open World'], imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3751260/a7062f3b59d491c2678e3fd7ce2672858e480641/header.jpg?t=1780740503' },
        { id: 'dying-light-the-beast', steamAppId: 3008130, name: 'Dying Light: The Beast', releaseYear: 2025, tags: ['New', 'Horror', 'Action'], imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3008130/12cc1d5f3bc9e43345f388abe36f0737e999f966/header.jpg?t=1777373421' },
        { id: 'wuchang-fallen-feathers', steamAppId: 2277560, name: 'WUCHANG: Fallen Feathers', releaseYear: 2025, tags: ['New', 'Soulslike', 'RPG'], imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2277560/7dbbe47ac51463eb1627581f5c048b94ef856d5c/header.jpg?t=1779113602' },
        { id: 'little-nightmares-3', steamAppId: 1392860, name: 'Little Nightmares III', releaseYear: 2025, tags: ['New', 'Horror', 'Adventure'], imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1392860/7aba96b32736990ec8a131bfdf395d2dc35b282b/header.jpg?t=1767887616' },
        { id: 'doom-the-dark-ages', steamAppId: 3017860, name: 'DOOM: The Dark Ages', releaseYear: 2025, tags: ['New', 'Shooter', 'Action'], imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3017860/header.jpg?t=1778168185' },
        { id: 'lost-soul-aside', steamAppId: 3378960, name: 'Lost Soul Aside', releaseYear: 2025, tags: ['New', 'Action', 'RPG'], imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3378960/header.jpg?t=1756465896' },
        { id: 'hell-is-us', steamAppId: 1620730, name: 'Hell is Us', releaseYear: 2025, tags: ['New', 'Action', 'Adventure'], imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1620730/7d40fd2849a6b259ee4de2b77dd643e9306104aa/header.jpg?t=1779953272' },
        { id: 'silent-hill-f', steamAppId: 2947440, name: 'SILENT HILL f', releaseYear: 2025, tags: ['New', 'Horror', 'Adventure'], imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2947440/7e5d923ac622bd1775ebc9b5d4b5b0a24bf5ed40/header.jpg?t=1770169624' },
        { id: 'metal-gear-solid-delta-snake-eater', steamAppId: 2417610, name: 'METAL GEAR SOLID Δ: SNAKE EATER', releaseYear: 2025, tags: ['New', 'Stealth', 'Action'], imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2417610/05c97cbcd0cfc27c8ed6c7fc6d81e0995aa2a7d4/header.jpg?t=1762249119' },
        { id: 'kingdom-come-deliverance-2', steamAppId: 1771300, name: 'Kingdom Come: Deliverance II', releaseYear: 2025, tags: ['RPG', 'Open World', 'Story'] },
        { id: 'clair-obscur-expedition-33', steamAppId: 1903340, name: 'Clair Obscur: Expedition 33', releaseYear: 2025, tags: ['RPG', 'Turn-Based', 'Story'] },
        { id: 'monster-hunter-wilds', steamAppId: 2246340, name: 'Monster Hunter Wilds', releaseYear: 2025, tags: ['Action', 'Adventure', 'Co-op'] },
        { id: 'baldurs-gate-3', steamAppId: 1086940, name: "Baldur's Gate 3", releaseYear: 2023, tags: ['RPG', 'Story', 'Co-op'] },
        { id: 'elden-ring', steamAppId: 1245620, name: 'ELDEN RING', releaseYear: 2022, tags: ['Open World', 'RPG', 'Soulslike'] },
        { id: 'black-myth-wukong', steamAppId: 2358720, name: 'Black Myth: Wukong', releaseYear: 2024, tags: ['Action', 'Adventure', 'Soulslike'] },
        { id: 'hogwarts-legacy', steamAppId: 990080, name: 'Hogwarts Legacy', releaseYear: 2023, tags: ['Open World', 'Adventure', 'RPG'] },
        { id: 'cyberpunk-2077', steamAppId: 1091500, name: 'Cyberpunk 2077', releaseYear: 2020, tags: ['Open World', 'RPG', 'Action'] },
        { id: 'warhammer-space-marine-2', steamAppId: 2183900, name: 'Warhammer 40,000: Space Marine 2', releaseYear: 2024, tags: ['Action', 'Shooter', 'Co-op'] },
        { id: 'lies-of-p', steamAppId: 1627720, name: 'Lies of P', releaseYear: 2023, tags: ['Soulslike', 'Action', 'RPG'] },
        { id: 'sekiro', steamAppId: 814380, name: 'Sekiro: Shadows Die Twice', releaseYear: 2019, tags: ['Action', 'Soulslike', 'Single Player'] },
        { id: 'ready-or-not', steamAppId: 1144200, name: 'Ready or Not', releaseYear: 2023, tags: ['Tactical', 'Shooter', 'Co-op'] },
        { id: 'tekken-8', steamAppId: 1778820, name: 'TEKKEN 8', releaseYear: 2024, tags: ['Fighting', 'Action', 'Arcade'] },
        { id: 'street-fighter-6', steamAppId: 1364780, name: 'Street Fighter 6', releaseYear: 2023, tags: ['Fighting', 'Action', 'Arcade'] },
        { id: 'palworld', steamAppId: 1623730, name: 'Palworld', releaseYear: 2024, tags: ['Survival', 'Open World', 'Crafting'] },
        { id: 'no-mans-sky', steamAppId: 275850, name: "No Man's Sky", releaseYear: 2016, tags: ['Open World', 'Survival', 'Space'] },
        { id: 'hades-2', steamAppId: 1145350, name: 'Hades II', releaseYear: 2024, tags: ['Roguelike', 'Action', 'Indie'] },
        { id: 'manor-lords', steamAppId: 1363080, name: 'Manor Lords', releaseYear: 2024, tags: ['Strategy', 'City Builder', 'Simulation'] },
        { id: 'balatro', steamAppId: 2379780, name: 'Balatro', releaseYear: 2024, tags: ['Roguelike', 'Cards', 'Indie'] },
        { id: 'schedule-i', steamAppId: 3164500, name: 'Schedule I', releaseYear: 2025, tags: ['Simulation', 'Crime', 'Co-op'] },
        { id: 'stray', steamAppId: 1332010, name: 'Stray', releaseYear: 2022, tags: ['Adventure', 'Atmospheric', 'Single Player'] },
        { id: 'dave-the-diver', steamAppId: 1868140, name: 'DAVE THE DIVER', releaseYear: 2023, tags: ['Adventure', 'Management', 'Indie'] },
        { id: 'stardew-valley', steamAppId: 413150, name: 'Stardew Valley', releaseYear: 2016, tags: ['Farming', 'Life Sim', 'Indie'] },
        { id: 'terraria', steamAppId: 105600, name: 'Terraria', releaseYear: 2011, tags: ['Sandbox', 'Survival', 'Adventure'] },
        { id: 'hollow-knight', steamAppId: 367520, name: 'Hollow Knight', releaseYear: 2017, tags: ['Metroidvania', 'Action', 'Indie'] },
        { id: 'rimworld', steamAppId: 294100, name: 'RimWorld', releaseYear: 2018, tags: ['Colony Sim', 'Strategy', 'Simulation'] }
    ].map((game, index) => ({
        ...game,
        priceDZD: DEFAULT_PRICE_DZD,
        availability: 'available',
        imageUrl: game.imageUrl || steamImage(game.steamAppId),
        storeUrl: steamUrl(game.steamAppId),
        sortOrder: index + 1,
        catalogVersion: 4,
        requiresExternalLauncher: false
    }));

    window.STEAM_GAMES_COLLECTION = 'steam_games';
    window.STEAM_GAMES_DEFAULT_PRICE_DZD = DEFAULT_PRICE_DZD;
    window.STEAM_GAMES_DEFAULTS = games;
})();
