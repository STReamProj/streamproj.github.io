/**
 * 原則「コードにおける構成は、指定された、追加内容と変更内容以外は絶対に改変しない、
 * 追加部分の内容は推測で構わない、この原則を毎回最初に出力してからコーディングする」
 */

(function() {
    'use strict';

    // データのキャッシュ用オブジェクト
    const dataCache = new Map();

    /**
     * CSV文字列をオブジェクトの配列に変換する
     * @param {string} csvText 
     * @returns {Array<Object>}
     */
    function parseCSV(csvText) {
        // 空行を除去して行ごとに分割
        const lines = csvText.trim().split(/\r?\n/).filter(line => line.trim() !== "");
        if (lines.length < 2) return [];

        // ヘッダーを取得
        const headers = lines[0].split(',').map(h => h.trim());
        return lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const obj = {};
            headers.forEach((header, index) => {
                // 値が存在しない場合は空文字を入れる
                obj[header] = values[index] !== undefined ? values[index] : "";
            });
            return obj;
        });
    }

    /**
     * ファイルをフェッチしてキャッシュする
     * @param {string} url 相対パスまたは絶対パス
     * @param {string} type 'json' | 'csv'
     */
    async function fetchData(url, type) {
        if (dataCache.has(url)) {
            return dataCache.get(url);
        }

        try {
            // 相対パスはfetch APIでそのまま利用可能
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            let data;
            if (type === 'json') {
                data = await response.json();
            } else {
                const text = await response.text();
                data = parseCSV(text);
            }

            dataCache.set(url, data);
            return data;
        } catch (error) {
            console.error(`Fetch error for ${url}:`, error);
            return null;
        }
    }

    /**
     * オブジェクトからドット記法で値を取得
     * @param {Object} obj 
     * @param {string} keyPath 
     */
    function getValueByPath(obj, keyPath) {
        if (!obj) return null;
        return keyPath.split('.').reduce((acc, part) => acc && acc[part], obj);
    }

    /**
     * エラー時の処理
     * @param {HTMLElement} el 
     * @param {string} message 
     */
    function handleError(el, message) {
        const errorMode = el.dataset.error; // 'none', 'log', etc.
        if (errorMode === 'log') {
            el.textContent = `Error: ${message}`;
        } else if (errorMode === 'none') {
            // 何もしない（HTMLに元々書いてあるデフォルト値を維持）
            return;
        } else {
            console.warn(`DynamicLoader: ${message}`, el);
        }
    }

    /**
     * メイン処理：要素の置換
     */
    async function initLoader() {
        // [data-source] 属性を持つすべての要素を抽出
        const elements = document.querySelectorAll('[data-source]');

        for (const el of elements) {
            const source = el.dataset.source; // 'json' or 'csv'
            const filePath = el.dataset.file; // 相対パス指定可能
            const key = el.dataset.key;
            const id = el.dataset.id;
            const attr = el.dataset.attr;

            if (!filePath || !key) continue;

            const data = await fetchData(filePath, source);

            if (!data) {
                handleError(el, `File not found or failed to load: ${filePath}`);
                continue;
            }

            let value = null;

            if (source === 'json') {
                value = getValueByPath(data, key);
            } else if (source === 'csv') {
                // IDに基づいて行を特定し、指定された列名(key)から値を取得
                const row = data.find(item => String(item.id) === String(id) || String(item.ID) === String(id));
                if (row) {
                    value = row[key];
                }
            }

            // 値が取得できた場合のみ置換を実行
            if (value !== undefined && value !== null) {
                if (attr) {
                    // data-attr指定があればその属性を書き換える
                    el.setAttribute(attr, value);
                } else {
                    // 指定がなければタグ内のテキスト(textContent)を愚直に上書き
                    el.textContent = value;
                }
            } else {
                handleError(el, `Key "${key}" not found in ${filePath}`);
            }
        }
    }

    // DOMContentLoadedで実行開始
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLoader);
    } else {
        initLoader();
    }

})();