const WAIT_REPUTATION_CONTAINER_CHECK_INTERVAL = 200;
const NAVIGATION_TIMEOUT = 10;

// Navigating to a new tab
const waitForReputationContainerVisible = (callback) => {
  const check = () => {
    const container = document.querySelector(".profile-reputation-container");
    const isVisible = container && container.offsetParent !== null;

    if (isVisible) {
      callback();
    } else {
      setTimeout(check, WAIT_REPUTATION_CONTAINER_CHECK_INTERVAL); // retry every 200ms
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
    logger.log("Auto-highlighting commendation from URL:", targetCommendationName);
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

    const navigateBackUntilPathMatches = () => {
      // Normalize the path by removing a possible language prefix
      const normalizedPath = location.pathname.replace(/^\/[a-zA-Z-]+(\/profile\/reputation.*)/, '$1');

      if (normalizedPath === "/profile/reputation") {
        clickCompany();
      } else if (normalizedPath === `/profile/reputation/${targetPath.split("/")[0]}`) {
        clickCampaignIfNeeded();
      } else if (normalizedPath === `/profile/reputation/${targetPath}`) {
        highlightCommendation(targetCommendationName);
      } else {
        const backButton = document.querySelector("button.button.button--shamrock");
        if (backButton) {
          backButton.click();
          logger.log("Clicked back button");
          setTimeout(navigateBackUntilPathMatches, NAVIGATION_TIMEOUT);
        } else {
          logger.warn("Back button not found");
        }
      }
    };
    
    const companyClassPrefix = "company-reputation-wrapper-v2--"
    function companyNameToClassSuffix(companyName) {
      return companyName
        .replace(/([A-Z])/g, '-$1')   // Insert dash before each uppercase letter
        .replace(/^-/, '')            // Remove leading dash if present
        .toLowerCase();               // Lowercase everything
    }

    const clickCompany = () => {
      const company = targetPath.split("/")[0];
      const classSuffix = companyNameToClassSuffix(company);
      const companyClass = companyClassPrefix + classSuffix;

      // Select the button with the specific class
      const button = document.querySelector(`button.${companyClass}`);
      if (button) {
        button.click();
        logger.log("Clicked company button with class:", companyClass);
        setTimeout(clickCampaignIfNeeded, NAVIGATION_TIMEOUT);
        return;
      } else {
        logger.warn("Company button not found for class:", companyClass);
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
          logger.warn("Campaign title not found for:", targetPath);
          highlightCommendation(targetCommendationName);
          return;
        }

        const campaignButtons = document.querySelectorAll("button");
        for (const button of campaignButtons) {
          const titleH3 = button.querySelector("h3.campaign__title");
          if (titleH3 && sanitizeName(titleH3.textContent.trim()) === campaignTitle) {
            button.click();
            logger.log("Clicked campaign:", campaignTitle);
            setTimeout(() => {
              highlightCommendation(targetCommendationName)
            }, NAVIGATION_TIMEOUT);
            return;
          }
        }

        logger.warn("Campaign button not found for:", campaignTitle);
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
        logger.log("Found commendation:", targetCommendationName);

        // Highlight
        container.scrollIntoView({ behavior: "smooth", block: "center" });
        container.style.transition = "box-shadow 0.3s ease, transform 0.3s ease, z-index 0s, background 0.3s ease";
        container.style.boxShadow = "0 0 15px 5px #58C1B2";
        container.style.transform = "scale(1.05)";
        container.style.zIndex = "1000";
        container.style.background = "rgba(17,18,25,1)"; // temporary background
        setTimeout(() => {
          container.style.boxShadow = "0 0 0 0 transparent";
          container.style.transform = "scale(1)";
          container.style.zIndex = "";
          container.style.background = "";
        }, 2000);
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
      logger.warn("Commendation not found in any page:", targetCommendationName);
      return;
    }

    logger.log("Commendation not found on this page, moving to next page...");
    nextButton.click();
    setTimeout(tryPaginationUntilFound, NAVIGATION_TIMEOUT);
  };

  const goToFirstPageAndStart = () => {
    const firstButton = document.querySelector("button.pagination__first-button");
    const isDisabled = firstButton?.disabled || firstButton?.getAttribute("aria-disabled") === "true";

    if (!firstButton || isDisabled) {
      // Already on first page
      tryPaginationUntilFound();
    } else {
      logger.log("Navigating to first page...");
      firstButton.click();
      setTimeout(tryPaginationUntilFound, NAVIGATION_TIMEOUT); // wait for page update
    }
  };

  goToFirstPageAndStart();
};
