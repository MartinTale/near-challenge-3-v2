import "regenerator-runtime/runtime";

import { initContract, login, logout } from "./utils";

import getConfig from "./config";
const { networkId } = getConfig("development");

// global variable used throughout
let currentGreeting;

const submitButton = document.querySelector("form button");

const avatarContainer = document.getElementById("avatar-container");
let currentAvatar = Date.now();

document.getElementById("refresh-avatar").onclick = (e) => {
  e.preventDefault();
  setAvatar(Date.now());
};

document.querySelector("form").onsubmit = async (event) => {
  event.preventDefault();

  // get elements from the form using their id attribute
  const { fieldset, greeting } = event.target.elements;

  // disable the form while the value gets updated on-chain
  fieldset.disabled = true;

  try {
    // make an update call to the smart contract
    await window.contract.addMessage({
      // pass the value that the user entered in the greeting field
      text: document.getElementById("greeting").value,
    });
  } catch (e) {
    console.log(e);
    alert(
      "Something went wrong! " +
        "Maybe you need to sign out and back in? " +
        "Check your browser console for more info."
    );
    throw e;
  } finally {
    // re-enable the form, whether the call succeeded or failed
    fieldset.disabled = false;
  }

  // update the greeting in the UI
  await fetchGreeting();

  // show notification
  document.querySelector("[data-behavior=notification]").style.display =
    "block";

  // remove notification again after css animation completes
  // this allows it to be shown again next time the form is submitted
  setTimeout(() => {
    document.querySelector("[data-behavior=notification]").style.display =
      "none";
  }, 11000);
};

document.querySelector("#sign-in-button").onclick = login;
document.querySelector("#sign-out-button").onclick = logout;

// Display the signed-out-flow container
function signedOutFlow() {
  document.querySelector("#signed-out-flow").style.display = "block";
}

// Displaying the signed in flow container and fill in account-specific data
function signedInFlow() {
  document.querySelector("#signed-in-flow").style.display = "block";

  document.querySelectorAll("[data-behavior=account-id]").forEach((el) => {
    el.innerText = window.accountId;
  });

  // populate links in the notification box
  const accountLink = document.querySelector(
    "[data-behavior=notification] a:nth-of-type(1)"
  );
  accountLink.href = accountLink.href + window.accountId;
  accountLink.innerText = "@" + window.accountId;
  const contractLink = document.querySelector(
    "[data-behavior=notification] a:nth-of-type(2)"
  );
  contractLink.href = contractLink.href + window.contract.contractId;
  contractLink.innerText = "@" + window.contract.contractId;

  // update with selected networkId
  accountLink.href = accountLink.href.replace("testnet", networkId);
  contractLink.href = contractLink.href.replace("testnet", networkId);

  fetchGreeting();
}

function setAvatar(avatar) {
  currentAvatar = avatar;
  avatarContainer.src =
    "https://avatars.dicebear.com/api/bottts/" + currentAvatar + ".svg";
  document.getElementById("greeting").value = currentAvatar;
}

function renderAvatars(avatars) {
  const avatarEntries = Object.entries(avatars);
  const avatarContainer = document.querySelector(".user-list");
  let avatarHTML = "";
  for (let i = 0; i < avatarEntries.length; i += 1) {
    avatarHTML += `<li>
      <img src="https://avatars.dicebear.com/api/bottts/${avatarEntries[i][1]}.svg">
      <small>${avatarEntries[i][0]}</small>
    </li>`;
  }

  avatarContainer.innerHTML = avatarHTML;
}

// update global currentGreeting variable; update DOM with it
async function fetchGreeting() {
  currentGreeting = await contract.getMessages();

  const avatars = {};

  for (let i = 0; i < currentGreeting.length; i += 1) {
    avatars[currentGreeting[i].sender] = currentGreeting[i].text;
  }

  if (avatars[window.accountId]) {
    setAvatar(avatars[window.accountId]);
  }
  renderAvatars(avatars);
  // document.querySelectorAll('[data-behavior=greeting]').forEach(el => {
  //   // set divs, spans, etc
  //   el.innerText = currentGreeting

  //   // set input elements
  //   el.value = currentGreeting
  // })
}

// `nearInitPromise` gets called on page load
window.nearInitPromise = initContract()
  .then(() => {
    if (window.walletConnection.isSignedIn()) signedInFlow();
    else signedOutFlow();
  })
  .catch(console.error);
