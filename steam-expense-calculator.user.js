// ==UserScript==
// @name         Steam History expenses calculator
// @namespace    http://wadu436.be/
// @version      0.1
// @description  Shows how much money you spent on Steam!
// @author       Warre Dujardin
// @match        https://store.steampowered.com/account/history/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=steampowered.com
// @grant        none
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @require      https://raw.githubusercontent.com/openexchangerates/accounting.js/master/accounting.min.js
// ==/UserScript==

function parseCurrency(c) {
  let mult = 1;
  if (c.includes("Credit")) {
    mult = -1;
  }
  if (c.includes("€")) {
    return mult * accounting.parse(c, ",");
  } else {
    return null;
  }
}

function getTransactions(tableBody) {
  let spend_total = 0.0;
  let transactions = [];
  for (const child of $(tableBody).children(".wallet_table_row")) {
    let total = $(child).find(".wht_total")[0].innerText;
    let wallet_change = $(child).find(".wht_wallet_change")[0].innerText;
    let type = $(child).find(".wht_type").children().first()[0].innerText;

    total = parseCurrency(total);
    wallet_change = wallet_change ? parseCurrency(wallet_change) : null;

    if (type === "Refund") {
      total = -total;
    }

    let transaction = { total, wallet_change, type };
    transactions.push(transaction);
    //console.log(transaction);
  }
  return transactions;
}

function handleTransaction(transaction) {
  if (transaction.wallet_change) {
    if (transaction.wallet_change > 0) {
      // Loading up wallet
      return Math.min(transaction.total, 0);
    } else {
      // Spending from wallet
      if (transaction.total) {
        return transaction.total;
      } else {
        return -transaction.wallet_change;
      }
    }
  } else if (transaction.total) {
    //console.log(`total change: ${transaction.total}`);
    return transaction.total;
  }
}

function calculateTotal(transactions) {
  let spend_total = 0.0;
  for (const transaction of transactions) {
    spend_total += handleTransaction(transaction);
  }
  return spend_total;
}

function calculateRefunds(transactions) {
  let spend_total = 0.0;
  for (const transaction of transactions) {
    if (transaction.type == "Refund") {
      spend_total += handleTransaction(transaction);
    }
  }
  return spend_total;
}

function calculateGames(transactions) {
  let spend_total = 0.0;
  for (const transaction of transactions) {
    if (transaction.type == "Purchase") {
      spend_total += handleTransaction(transaction);
    }
  }
  return spend_total;
}

function calculateGifts(transactions) {
  let spend_total = 0.0;
  for (const transaction of transactions) {
    if (transaction.type.includes("Gift")) {
      spend_total += handleTransaction(transaction);
    }
  }
  return spend_total;
}

function calculateInGamePurchase(transactions) {
  let spend_total = 0.0;
  for (const transaction of transactions) {
    if (transaction.type.includes("In-Game Purchase")) {
      spend_total += handleTransaction(transaction);
    }
  }
  return spend_total;
}

function calculateMarket(transactions) {
  let spend_total = 0.0;
  for (const transaction of transactions) {
    if (transaction.type.includes("Market Transaction")) {
      spend_total += handleTransaction(transaction);
    }
  }
  return spend_total;
}

(function () {
  let table = $(".wallet_history_table")[0];
  let tableBody = $(".wallet_history_table tbody")[0];

  let addRow = (t, name) => {
    let r = document.createElement("tr");
    t.appendChild(r);

    let nameEl = document.createElement("td");
    nameEl.innerText = name;
    let valueEl = document.createElement("td");
    valueEl.innerText = "Hi!";
    $(valueEl).css("text-align", "right");

    r.appendChild(nameEl);
    r.appendChild(valueEl);

    return valueEl;
  };

  // Create node
  const newDiv = document.createElement("div");
  const newHeader = document.createElement("h4");
  newHeader.innerText = "Total Spent (visible transactions)";
  const newTable = document.createElement("table");

  newTable.classList.add("wallet_history_table");
  $(newDiv).css("margin", "1em 0");

  //$(newTable).css("border-spacing", "0.1em");
  const totalDiv = addRow(newTable, "Total");
  const gamesDiv = addRow(newTable, "Games");
  const refundDiv = addRow(newTable, "Refunds");
  const giftDiv = addRow(newTable, "Gifts");
  const igpDiv = addRow(newTable, "In-Game Purchases");
  const marketDiv = addRow(newTable, "Market Transactions");

  newDiv.append(newHeader);
  newDiv.append(newTable);

  table.before(newDiv);

  let callback = () => {
    let transactions = getTransactions(tableBody);
    totalDiv.innerText = `${accounting.formatMoney(
      calculateTotal(transactions),
      "€ ",
      2,
      ".",
      ","
    )}`;
    gamesDiv.innerText = `${accounting.formatMoney(
      calculateGames(transactions),
      "€ ",
      2,
      ".",
      ","
    )}`;
    refundDiv.innerText = `${accounting.formatMoney(
      calculateRefunds(transactions),
      "€ ",
      2,
      ".",
      ","
    )}`;
    giftDiv.innerText = `${accounting.formatMoney(
      calculateGifts(transactions),
      "€ ",
      2,
      ".",
      ","
    )}`;
    igpDiv.innerText = `${accounting.formatMoney(
      calculateInGamePurchase(transactions),
      "€ ",
      2,
      ".",
      ","
    )}`;
    marketDiv.innerText = `${accounting.formatMoney(
      calculateMarket(transactions),
      "€ ",
      2,
      ".",
      ","
    )}`;
  };
  let observer = new MutationObserver(callback);

  let config = { attributes: true, childList: true, subtree: true };
  observer.observe(tableBody, config);

  callback();
})();
