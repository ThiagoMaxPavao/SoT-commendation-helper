// Navigating to a new tab
const waitForReputationContainerVisible = (callback) => {
  const check = () => {
    const container = document.querySelector(".profile-reputation-container");
    const isVisible = container && container.offsetParent !== null;

    if (isVisible) {
      callback();
    } else {
      setTimeout(check, 200); // retry every 200ms
    }
  };

  check();
};

function getCommendationFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("highlight");
}

document.addEventListener("DOMContentLoaded", () => {
  const targetCommendationName = getCommendationFromURL();

  if (targetCommendationName) {
    console.log("Auto-highlighting commendation from URL:", targetCommendationName);
    waitForReputationContainerVisible(() => {
      highlightCommendation(targetCommendationName);
    });

    // Remove highlight param from the URL without reloading the page
    const url = new URL(window.location.href);
    url.searchParams.delete("highlight");
    window.history.replaceState({}, document.title, url.pathname);
  }
});

// Navigate to a commendation in the already loaded tab
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "navigateCommendation") {
    const targetPath = message.path;
    const targetCommendationName = message.commendationName;

    const companyTitleMap = {
      AthenasFortune: "Athena's Fortune",
      BilgeRats: "Bilge Rats",
      CreatorCrew: "Creator Crew",
      Flameheart: "Servants of the Flame",
      GoldHoarders: "Gold Hoarders",
      HuntersCall: "Hunter's Call",
      MerchantAlliance: "Merchant Alliance",
      OrderOfSouls: "Order of Souls",
      PirateLord: "Guardians of Fortune",
      ReapersBones: "Reaper's Bones",
      SeaDogs: "Sea Dogs",
      TallTales: "Tall Tales"
    };

    const navigateBackUntilPathMatches = () => {
      if (`/profile/reputation/${targetPath}`.startsWith(location.pathname)) {
        console.log("Reached base path:", location.pathname);
        if (location.pathname === "/profile/reputation") {
          clickCompany();
        } else if (location.pathname === `/profile/reputation/${targetPath.split("/")[0]}`) {
          clickCampaignIfNeeded();
        } else if (location.pathname === `/profile/reputation/${targetPath}`) {
          highlightCommendation(targetCommendationName);
        }
        return;
      }

      const backButton = document.querySelector("button.button.button--shamrock");
      if (backButton) {
        backButton.click();
        console.log("Clicked back button");
        setTimeout(navigateBackUntilPathMatches, 500);
      } else {
        console.warn("Back button not found");
      }
    };

    const clickCompany = () => {
      const company = targetPath.split("/")[0];
      const targetCompanyTitle = companyTitleMap[company];
      if (!targetCompanyTitle) return;

      const companyButtons = document.querySelectorAll("button");
      for (const button of companyButtons) {
        const titleDiv = button.querySelector(".company-reputation-wrapper-v2__title");
        if (titleDiv && titleDiv.textContent.trim() === targetCompanyTitle) {
          button.click();
          console.log("Clicked company:", targetCompanyTitle);
          setTimeout(clickCampaignIfNeeded, 500);
          return;
        }
      }
    };

    const clickCampaignIfNeeded = () => {
      const parts = targetPath.split("/");
      if (parts.length < 2) {
        highlightCommendation(targetCommendationName);
        return;
      }

      chrome.storage.local.get("campaignTitleMap", (data) => {
        const campaignTitle = data.campaignTitleMap ? data.campaignTitleMap[targetPath] : null;
        if (!campaignTitle) {
          console.warn("Campaign title not found for:", targetPath);
          highlightCommendation(targetCommendationName);
          return;
        }

        const campaignButtons = document.querySelectorAll("button");
        for (const button of campaignButtons) {
          const titleH3 = button.querySelector("h3.campaign__title");
          if (titleH3 && sanitizeName(titleH3.textContent.trim()) === campaignTitle) {
            button.click();
            console.log("Clicked campaign:", campaignTitle);
            setTimeout(() => {
              highlightCommendation(targetCommendationName)
            }, 500);
            return;
          }
        }

        console.warn("Campaign button not found for:", campaignTitle);
        highlightCommendation(targetCommendationName);
      });
    };

    navigateBackUntilPathMatches();
  }
});

const highlightCommendation = (targetCommendationName) => {
  const findAndHighlight = () => {
    const containers = document.querySelectorAll(".emblem-item");
    for (const container of containers) {
      const button = container.querySelector("button[aria-label]");
      if (button && sanitizeName(button.getAttribute("aria-label")) === targetCommendationName) {
        console.log("Found commendation:", targetCommendationName);

        // Highlight
        container.scrollIntoView({ behavior: "smooth", block: "center" });
        container.style.transition = "box-shadow 0.3s ease, transform 0.3s ease";
        container.style.boxShadow = "0 0 15px 5px #58C1B2";
        container.style.transform = "scale(1.03)";
        setTimeout(() => {
          container.style.boxShadow = "0 0 0 0 transparent";
          container.style.transform = "scale(1)";
        }, 1500);
        return true;
      }
    }
    return false;
  };

  const tryPaginationUntilFound = () => {
    if (findAndHighlight()) return;

    const nextButton = document.querySelector("button.pagination__next-button");
    const isDisabled = nextButton?.disabled || nextButton?.getAttribute("aria-disabled") === "true";

    if (!nextButton || isDisabled) {
      console.warn("Commendation not found in any page:", targetCommendationName);
      return;
    }

    console.log("Commendation not found on this page, moving to next page...");
    nextButton.click();
    setTimeout(tryPaginationUntilFound, 800);
  };

  const goToFirstPageAndStart = () => {
    const firstButton = document.querySelector("button.pagination__first-button");
    const isDisabled = firstButton?.disabled || firstButton?.getAttribute("aria-disabled") === "true";

    if (!firstButton || isDisabled) {
      // Already on first page
      tryPaginationUntilFound();
    } else {
      console.log("Navigating to first page...");
      firstButton.click();
      setTimeout(tryPaginationUntilFound, 800); // wait for page update
    }
  };

  goToFirstPageAndStart();
};
