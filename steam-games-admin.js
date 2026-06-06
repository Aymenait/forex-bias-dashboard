(function () {
    const COLLECTION = window.STEAM_GAMES_COLLECTION || 'steam_games';
    let steamGames = [];
    let steamGamesLoaded = false;

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function notify(message, type = 'success') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            alert(message);
        }
    }

    function getDefaultGameById(id) {
        return (window.STEAM_GAMES_DEFAULTS || []).find(game => game.id === id);
    }

    function slugify(value, fallback = 'steam-game') {
        const slug = String(value || '')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        return slug || fallback;
    }

    function steamImageUrl(appId) {
        return appId ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg` : '';
    }

    function steamStoreUrl(appId) {
        return appId ? `https://store.steampowered.com/app/${appId}/` : '';
    }

    function parseTags(value) {
        return String(value || '')
            .split(',')
            .map(tag => tag.trim())
            .filter(Boolean);
    }

    function nextSortOrder() {
        return steamGames.reduce((max, game) => Math.max(max, Number(game.sortOrder || 0)), 0) + 1;
    }

    function normalizeGame(docId, data) {
        const fallback = getDefaultGameById(docId) || {};
        const steamAppId = Number(data.steamAppId || fallback.steamAppId || 0);
        return {
            id: docId || data.id || fallback.id,
            ...fallback,
            ...data,
            steamAppId,
            priceDZD: Number(data.priceDZD ?? data.price_dzd ?? fallback.priceDZD ?? window.STEAM_GAMES_DEFAULT_PRICE_DZD ?? 500),
            sortOrder: Number(data.sortOrder ?? fallback.sortOrder ?? 999),
            availability: data.availability || fallback.availability || 'available',
            imageUrl: data.imageUrl || fallback.imageUrl || (steamAppId ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamAppId}/header.jpg` : ''),
            storeUrl: data.storeUrl || fallback.storeUrl || (steamAppId ? `https://store.steampowered.com/app/${steamAppId}/` : ''),
            requiresExternalLauncher: data.requiresExternalLauncher === true
        };
    }

    async function ensureDefaultSteamGames() {
        if (!window.db || !window.firebaseModules) return;
        const { collection, getDocs, setDoc, doc, serverTimestamp } = window.firebaseModules;
        const snapshot = await getDocs(collection(window.db, COLLECTION));
        const existingById = new Map();
        snapshot.forEach(item => existingById.set(item.id, item.data()));

        const writes = [];
        for (const game of (window.STEAM_GAMES_DEFAULTS || [])) {
            const existing = existingById.get(game.id);
            if (!existing) {
                writes.push(setDoc(doc(window.db, COLLECTION, game.id), {
                    ...game,
                    createdAt: serverTimestamp ? serverTimestamp() : new Date(),
                    updatedAt: serverTimestamp ? serverTimestamp() : new Date()
                }));
                continue;
            }

            const existingVersion = Number(existing.catalogVersion || 0);
            const nextVersion = Number(game.catalogVersion || 0);
            if (nextVersion > existingVersion) {
                writes.push(setDoc(doc(window.db, COLLECTION, game.id), {
                    ...game,
                    priceDZD: Number(existing.priceDZD ?? existing.price_dzd ?? game.priceDZD),
                    price_dzd: Number(existing.priceDZD ?? existing.price_dzd ?? game.priceDZD),
                    availability: existing.availability || game.availability,
                    catalogVersion: nextVersion,
                    createdAt: existing.createdAt || (serverTimestamp ? serverTimestamp() : new Date()),
                    updatedAt: serverTimestamp ? serverTimestamp() : new Date()
                }, { merge: true }));
            }
        }

        if (writes.length) await Promise.all(writes);
    }

    async function loadSteamGames(force = false) {
        if (!force && steamGamesLoaded) {
            renderSteamGamesAdmin();
            return;
        }
        if (!window.db || !window.firebaseModules) {
            notify('Firebase غير جاهز بعد، أعد المحاولة بعد ثواني.', 'error');
            return;
        }

        const tbody = document.getElementById('steam-games-table-body');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-gray-400">جاري تحميل الألعاب...</td></tr>';
        }

        try {
            await ensureDefaultSteamGames();

            const { collection, getDocs } = window.firebaseModules;
            const snapshot = await getDocs(collection(window.db, COLLECTION));
            steamGames = [];
            snapshot.forEach(item => {
                steamGames.push(normalizeGame(item.id, item.data()));
            });
            steamGames.sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999) || a.name.localeCompare(b.name));
            steamGamesLoaded = true;
            renderSteamGamesAdmin();
        } catch (error) {
            console.error('Error loading Steam games:', error);
            notify('حدث خطأ أثناء تحميل ألعاب Steam.', 'error');
        }
    }

    function getFilteredSteamGames() {
        const search = String(document.getElementById('steam-games-search')?.value || '').trim().toLowerCase();
        const status = document.getElementById('steam-games-status-filter')?.value || 'all';

        return steamGames.filter(game => {
            const matchesSearch = !search || `${game.name} ${game.tags?.join(' ') || ''}`.toLowerCase().includes(search);
            const matchesStatus = status === 'all' || game.availability === status;
            return matchesSearch && matchesStatus;
        });
    }

    function renderSteamGamesAdmin() {
        const tbody = document.getElementById('steam-games-table-body');
        const total = document.getElementById('steam-games-total');
        const visible = document.getElementById('steam-games-visible');
        const hidden = document.getElementById('steam-games-hidden');
        if (!tbody) return;

        const filteredGames = getFilteredSteamGames();
        if (total) total.textContent = String(steamGames.length);
        if (visible) visible.textContent = String(steamGames.filter(game => game.availability === 'available').length);
        if (hidden) hidden.textContent = String(steamGames.filter(game => game.availability !== 'available').length);

        if (!filteredGames.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-gray-400">لا توجد ألعاب مطابقة.</td></tr>';
            return;
        }

        tbody.innerHTML = filteredGames.map(game => {
            const tags = Array.isArray(game.tags) ? game.tags.join(', ') : '';
            return `
                <tr class="border-t border-gray-700 hover:bg-gray-800/50 transition-colors" data-steam-game-id="${escapeHtml(game.id)}">
                    <td class="px-4 py-3">
                        <img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.name)}" class="w-24 h-11 object-cover rounded bg-gray-800 border border-gray-700"
                            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="w-24 h-11 rounded bg-gray-800 border border-gray-700 hidden items-center justify-center text-xs text-gray-400">Steam</div>
                    </td>
                    <td class="px-4 py-3">
                        <div class="font-bold text-white">${escapeHtml(game.name)}</div>
                        <div class="text-xs text-gray-400">AppID: ${escapeHtml(game.steamAppId)} · ${escapeHtml(game.releaseYear || '')}</div>
                        <div class="text-xs text-blue-300">${escapeHtml(tags)}</div>
                    </td>
                    <td class="px-4 py-3">
                        <input type="number" min="0" step="50" class="steam-game-price w-28 px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white focus:border-blue-400 focus:outline-none"
                            value="${Number(game.priceDZD || 500)}">
                    </td>
                    <td class="px-4 py-3 text-blue-200 font-bold">$${(Number(game.priceDZD || 0) / 250).toFixed(2)}</td>
                    <td class="px-4 py-3">
                        <select class="steam-game-status px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white focus:border-blue-400 focus:outline-none">
                            <option value="available" ${game.availability === 'available' ? 'selected' : ''}>متوفرة</option>
                            <option value="hidden" ${game.availability === 'hidden' ? 'selected' : ''}>مخفية</option>
                            <option value="unavailable" ${game.availability === 'unavailable' ? 'selected' : ''}>غير متوفرة</option>
                        </select>
                    </td>
                    <td class="px-4 py-3">
                        <input type="number" min="1" step="1" class="steam-game-order w-20 px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white focus:border-blue-400 focus:outline-none"
                            value="${Number(game.sortOrder || 999)}">
                    </td>
                    <td class="px-4 py-3">
                        <a href="${escapeHtml(game.storeUrl)}" target="_blank" rel="noopener" class="text-blue-300 hover:text-blue-200 underline">Steam</a>
                    </td>
                    <td class="px-4 py-3 text-center">
                        <div class="flex gap-2 justify-center flex-wrap">
                            <button onclick="openSteamGameModal('${escapeHtml(game.id)}')" class="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white font-bold transition-colors">تعديل</button>
                            <button onclick="saveSteamGameRow('${escapeHtml(game.id)}')" class="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors">حفظ</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    async function saveSteamGameRow(gameId, silent = false) {
        const row = document.querySelector(`[data-steam-game-id="${CSS.escape(gameId)}"]`);
        const game = steamGames.find(item => item.id === gameId);
        if (!row || !game || !window.db || !window.firebaseModules) return;

        const priceDZD = Number(row.querySelector('.steam-game-price')?.value || 0);
        const availability = row.querySelector('.steam-game-status')?.value || 'available';
        const sortOrder = Number(row.querySelector('.steam-game-order')?.value || game.sortOrder || 999);

        try {
            const { setDoc, doc, serverTimestamp } = window.firebaseModules;
            const payload = {
                ...game,
                priceDZD,
                price_dzd: priceDZD,
                availability,
                sortOrder,
                requiresExternalLauncher: false,
                updatedAt: serverTimestamp ? serverTimestamp() : new Date()
            };
            await setDoc(doc(window.db, COLLECTION, gameId), payload, { merge: true });
            Object.assign(game, payload);
            renderSteamGamesAdmin();
            if (!silent) notify(`تم حفظ سعر ${game.name}.`);
        } catch (error) {
            console.error('Error saving Steam game:', error);
            notify('حدث خطأ أثناء حفظ اللعبة.', 'error');
        }
    }

    async function saveAllSteamGames() {
        const rows = Array.from(document.querySelectorAll('[data-steam-game-id]'));
        let savedCount = 0;
        for (const row of rows) {
            await saveSteamGameRow(row.dataset.steamGameId, true);
            savedCount += 1;
        }
        notify(`تم حفظ ${savedCount} لعبة.`);
    }

    function updateSteamGameUsdPreview() {
        const price = Number(document.getElementById('steam-game-price')?.value || 0);
        const preview = document.getElementById('steam-game-usd-preview');
        if (preview) preview.value = `$${(price / 250).toFixed(2)}`;
    }

    function updateSteamGameImagePreview() {
        const preview = document.getElementById('steam-game-image-preview');
        if (!preview) return;
        const imageUrl = document.getElementById('steam-game-image')?.value?.trim();
        const appId = Number(document.getElementById('steam-game-appid')?.value || 0);
        const src = imageUrl || steamImageUrl(appId);
        if (src) {
            preview.src = src;
            preview.classList.remove('hidden');
        } else {
            preview.src = '';
            preview.classList.add('hidden');
        }
    }

    function syncSteamGameDerivedFields() {
        const appId = Number(document.getElementById('steam-game-appid')?.value || 0);
        const storeInput = document.getElementById('steam-game-store-url');
        if (appId && storeInput && !storeInput.value.trim()) {
            storeInput.value = steamStoreUrl(appId);
        }
        updateSteamGameUsdPreview();
        updateSteamGameImagePreview();
    }

    function openSteamGameModal(gameId = null) {
        const modal = document.getElementById('steam-game-modal');
        const form = document.getElementById('steam-game-form');
        if (!modal || !form) return;

        form.reset();
        const game = gameId ? steamGames.find(item => item.id === gameId) : null;
        document.getElementById('steam-game-modal-title').textContent = game ? 'تعديل لعبة Steam' : 'إضافة لعبة Steam';
        document.getElementById('steam-game-id').value = game?.id || '';
        document.getElementById('steam-game-name').value = game?.name || '';
        document.getElementById('steam-game-appid').value = game?.steamAppId || '';
        document.getElementById('steam-game-price').value = Number(game?.priceDZD || window.STEAM_GAMES_DEFAULT_PRICE_DZD || 500);
        document.getElementById('steam-game-order').value = Number(game?.sortOrder || nextSortOrder());
        document.getElementById('steam-game-image').value = game?.imageUrl || '';
        document.getElementById('steam-game-store-url').value = game?.storeUrl || '';
        document.getElementById('steam-game-tags').value = Array.isArray(game?.tags) ? game.tags.join(', ') : 'New, Steam';
        document.getElementById('steam-game-year').value = game?.releaseYear || new Date().getFullYear();
        document.getElementById('steam-game-availability').value = game?.availability || 'available';

        updateSteamGameUsdPreview();
        updateSteamGameImagePreview();
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    function closeSteamGameModal() {
        const modal = document.getElementById('steam-game-modal');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    async function saveSteamGameFromModal(event) {
        event.preventDefault();
        if (!window.db || !window.firebaseModules) {
            notify('Firebase غير جاهز بعد.', 'error');
            return;
        }

        const existingId = document.getElementById('steam-game-id')?.value?.trim();
        const name = document.getElementById('steam-game-name')?.value?.trim();
        if (!name) {
            notify('اسم اللعبة مطلوب.', 'error');
            return;
        }

        const steamAppId = Number(document.getElementById('steam-game-appid')?.value || 0);
        const id = existingId || slugify(name, steamAppId ? `steam-${steamAppId}` : 'steam-game');
        const existing = steamGames.find(game => game.id === id);
        const priceDZD = Number(document.getElementById('steam-game-price')?.value || 0);
        const manualImageUrl = document.getElementById('steam-game-image')?.value?.trim();
        const storeUrl = document.getElementById('steam-game-store-url')?.value?.trim() || steamStoreUrl(steamAppId);
        const imageUrl = manualImageUrl || steamImageUrl(steamAppId);

        const payload = {
            id,
            steamAppId: steamAppId || null,
            name,
            priceDZD,
            price_dzd: priceDZD,
            availability: document.getElementById('steam-game-availability')?.value || 'available',
            tags: parseTags(document.getElementById('steam-game-tags')?.value),
            releaseYear: Number(document.getElementById('steam-game-year')?.value || new Date().getFullYear()),
            sortOrder: Number(document.getElementById('steam-game-order')?.value || nextSortOrder()),
            imageUrl,
            storeUrl,
            requiresExternalLauncher: false,
            isCustom: true,
            catalogVersion: 100,
            createdAt: existing?.createdAt || new Date(),
            updatedAt: new Date()
        };

        try {
            const { setDoc, doc, serverTimestamp } = window.firebaseModules;
            await setDoc(doc(window.db, COLLECTION, id), {
                ...payload,
                createdAt: existing?.createdAt || (serverTimestamp ? serverTimestamp() : new Date()),
                updatedAt: serverTimestamp ? serverTimestamp() : new Date()
            }, { merge: true });

            closeSteamGameModal();
            steamGamesLoaded = false;
            await loadSteamGames(true);
            notify(existing ? 'تم تعديل اللعبة.' : 'تمت إضافة اللعبة.');
        } catch (error) {
            console.error('Error saving Steam game from modal:', error);
            notify('حدث خطأ أثناء حفظ اللعبة.', 'error');
        }
    }

    function bindSteamGamesEvents() {
        document.getElementById('steam-games-search')?.addEventListener('input', renderSteamGamesAdmin);
        document.getElementById('steam-games-status-filter')?.addEventListener('change', renderSteamGamesAdmin);
        document.getElementById('steam-game-form')?.addEventListener('submit', saveSteamGameFromModal);
        document.getElementById('steam-game-price')?.addEventListener('input', updateSteamGameUsdPreview);
        document.getElementById('steam-game-image')?.addEventListener('input', updateSteamGameImagePreview);
        document.getElementById('steam-game-appid')?.addEventListener('input', syncSteamGameDerivedFields);
    }

    const previousShowTab = window.showTab;
    window.showTab = function (tabName) {
        if (typeof previousShowTab === 'function') previousShowTab(tabName);
        if (tabName === 'steam-games') loadSteamGames();
    };

    window.loadSteamGames = loadSteamGames;
    window.renderSteamGamesAdmin = renderSteamGamesAdmin;
    window.saveSteamGameRow = saveSteamGameRow;
    window.saveAllSteamGames = saveAllSteamGames;
    window.openSteamGameModal = openSteamGameModal;
    window.closeSteamGameModal = closeSteamGameModal;
    window.saveSteamGameFromModal = saveSteamGameFromModal;
    window.addSteamGamePrompt = openSteamGameModal;

    document.addEventListener('DOMContentLoaded', bindSteamGamesEvents);
    window.addEventListener('firebaseReady', () => {
        if (!document.getElementById('tab-steam-games')?.classList.contains('hidden')) {
            loadSteamGames(true);
        }
    });
})();
