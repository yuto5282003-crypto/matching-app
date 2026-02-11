// script.js

/**
 * このスクリプトは、簡易的なすれ違いマッチングアプリのデモを実装します。
 * ブラウザの位置情報APIを利用してユーザーの現在地を取得し、
 * 近くにランダムに生成したユーザー（棒人間）を表示します。
 * ユーザーをクリックするとミニゲームが始まり、トークのきっかけを提供します。
 */

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

/**
 * アプリの初期化関数。
 */
function initApp() {
  // ユーザーの位置を取得する
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;
        startMatching(userLat, userLon);
      },
      error => {
        console.warn('位置情報を取得できませんでした。デモ用の位置を使用します。');
        // デフォルト（東京駅付近）の位置
        startMatching(35.681236, 139.767125);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  } else {
    console.warn('このブラウザでは位置情報APIが利用できません。');
    startMatching(35.681236, 139.767125);
  }
}

/**
 * 位置情報取得後に、近くのユーザーを生成して表示を行う。
 * @param {number} userLat ユーザーの緯度
 * @param {number} userLon ユーザーの経度
 */
function startMatching(userLat, userLon) {
  // 近くのユーザーを生成
  const nearbyUsers = generateNearbyUsers(userLat, userLon, 5);
  // マップに描画
  renderUsersOnMap(userLat, userLon, nearbyUsers);
  // リストに表示
  renderUserList(nearbyUsers);
}

/**
 * ランダムに近くのユーザーを生成する。
 * @param {number} lat 中心となる緯度
 * @param {number} lon 中心となる経度
 * @param {number} count 生成するユーザー数
 * @returns {Array<Object>} ユーザーオブジェクトの配列
 */
function generateNearbyUsers(lat, lon, count) {
  const users = [];
  for (let i = 0; i < count; i++) {
    const offsetLat = (Math.random() - 0.5) * 0.001; // 約0.1km以内の範囲
    const offsetLon = (Math.random() - 0.5) * 0.001;
    users.push({
      id: i + 1,
      name: `ユーザー${i + 1}`,
      lat: lat + offsetLat,
      lon: lon + offsetLon,
      gender: Math.random() < 0.5 ? 'male' : 'female'
    });
  }
  return users;
}

/**
 * 棒人間をマップに描画する。
 * @param {number} userLat 現在地の緯度
 * @param {number} userLon 現在地の経度
 * @param {Array<Object>} users 近くのユーザーリスト
 */
function renderUsersOnMap(userLat, userLon, users) {
  const container = document.getElementById('map-container');
  // 現在地の棒人間を表示
  const myFigure = createStickFigure('あなた');
  myFigure.style.left = '50%';
  myFigure.style.top = '50%';
  container.appendChild(myFigure);
  // 近くのユーザーを表示
  users.forEach(user => {
    const figure = createStickFigure(user.name);
    // 緯度経度の差をピクセルに換算（簡易的）
    const dx = (user.lon - userLon) * 100000; // 経度差 → x
    const dy = (user.lat - userLat) * -100000; // 緯度差 → y（緯度増加は北上のため−）
    const mapWidth = container.clientWidth;
    const mapHeight = container.clientHeight;
    // 中央（50%,50%）からの相対位置
    const xPercent = 50 + (dx / mapWidth) * 50;
    const yPercent = 50 + (dy / mapHeight) * 50;
    // 境界を越えないよう制限
    const clampedX = Math.max(5, Math.min(95, xPercent));
    const clampedY = Math.max(5, Math.min(95, yPercent));
    figure.style.left = `${clampedX}%`;
    figure.style.top = `${clampedY}%`;
    // data-user-idをセット
    figure.dataset.userId = user.id;
    // クリックイベント
    figure.addEventListener('click', () => {
      showInteraction(user);
    });
    container.appendChild(figure);
  });
}

/**
 * ユーザーリストをサイドバーに表示する。
 * @param {Array<Object>} users ユーザーオブジェクトの配列
 */
function renderUserList(users) {
  const listEl = document.getElementById('user-list');
  listEl.innerHTML = '';
  users.forEach(user => {
    const li = document.createElement('li');
    li.textContent = `${user.name}（${user.gender === 'male' ? '男性' : '女性'}）`;
    li.addEventListener('click', () => {
      showInteraction(user);
    });
    listEl.appendChild(li);
  });
}

/**
 * 棒人間のDOM要素を生成する。
 * @param {string} label ユーザー名など、タイトル用のラベル
 * @returns {HTMLElement} 棒人間を含むdiv要素
 */
function createStickFigure(label) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('stick');
  // 子要素を作成（頭・胴体・腕・足）
  const head = document.createElement('div');
  head.classList.add('head');
  const body = document.createElement('div');
  body.classList.add('body');
  const armL = document.createElement('div');
  armL.classList.add('arm-left');
  const armR = document.createElement('div');
  armR.classList.add('arm-right');
  const legL = document.createElement('div');
  legL.classList.add('leg-left');
  const legR = document.createElement('div');
  legR.classList.add('leg-right');
  wrapper.appendChild(head);
  wrapper.appendChild(body);
  wrapper.appendChild(armL);
  wrapper.appendChild(armR);
  wrapper.appendChild(legL);
  wrapper.appendChild(legR);
  // ツールチップ的にtitle属性を付与
  wrapper.title = label;
  return wrapper;
}

/**
 * インタラクション（ミニゲーム＋チャット）を表示する。
 * @param {Object} user 対象となるユーザー
 */
function showInteraction(user) {
  const area = document.getElementById('interaction-area');
  // インタラクションエリアを初期化
  area.innerHTML = '';
  // ユーザー名を表示
  const h3 = document.createElement('h3');
  h3.textContent = `${user.name}さんと交流中`;
  area.appendChild(h3);
  // ミニゲーム説明
  const p = document.createElement('p');
  p.textContent = 'サイコロを振って遊んでみましょう！勝者には質問権が与えられます。';
  area.appendChild(p);
  // サイコロゲームボタン
  const button = document.createElement('button');
  button.textContent = 'サイコロを振る';
  button.classList.add('game-button');
  area.appendChild(button);
  // 結果表示領域
  const resultDiv = document.createElement('div');
  resultDiv.id = 'result';
  area.appendChild(resultDiv);
  // チャット（質問）領域
  const chatDiv = document.createElement('div');
  chatDiv.id = 'chat';
  area.appendChild(chatDiv);
  // ボタンクリック時の処理
  button.addEventListener('click', () => {
    playDiceGame(user, resultDiv, chatDiv);
  });
}

/**
 * サイコロゲームを実行し、結果と質問を表示する。
 * @param {Object} user 対象となるユーザー
 * @param {HTMLElement} resultDiv 結果を表示する要素
 * @param {HTMLElement} chatDiv チャット領域要素
 */
function playDiceGame(user, resultDiv, chatDiv) {
  // 1〜6の乱数を生成
  const myRoll = Math.floor(Math.random() * 6) + 1;
  const userRoll = Math.floor(Math.random() * 6) + 1;
  // 結果表示
  resultDiv.innerHTML = `<p>あなたの出目: <strong>${myRoll}</strong> / ${user.name}の出目: <strong>${userRoll}</strong></p>`;
  // 勝者を判定
  let winner;
  if (myRoll > userRoll) {
    winner = 'あなたが勝ちました！';
  } else if (myRoll < userRoll) {
    winner = `${user.name}が勝ちました！`;
  } else {
    winner = '引き分けです。';
  }
  resultDiv.innerHTML += `<p><em>${winner}</em></p>`;
  // 勝者が質問できる簡易チャット表示
  chatDiv.innerHTML = '';
  const questionList = [
    '最近ハマっていることは何？',
    '今食べたいものは？',
    '地元のおすすめスポットを教えて！',
    '休みの日はどんな過ごし方をしている？',
    '子どもの頃の夢は何？'
  ];
  // ランダムに質問を選択
  const randomQuestion = questionList[Math.floor(Math.random() * questionList.length)];
  const questionP = document.createElement('p');
  questionP.textContent = `${winner.includes('あなた') ? 'あなた' : user.name}への質問: ${randomQuestion}`;
  chatDiv.appendChild(questionP);
  // 入力欄と送信ボタン
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'ここに回答を入力';
  input.style.width = '70%';
  const sendBtn = document.createElement('button');
  sendBtn.textContent = '送信';
  sendBtn.classList.add('game-button');
  chatDiv.appendChild(input);
  chatDiv.appendChild(sendBtn);
  // 送信イベント
  sendBtn.addEventListener('click', () => {
    const answer = input.value.trim();
    if (answer !== '') {
      const responseP = document.createElement('p');
      responseP.textContent = `回答: ${answer}`;
      chatDiv.appendChild(responseP);
      input.value = '';
    }
  });
}