seiyuusToShow = []

function filterSeiyuu(element) {
    // upon pressing the button, the element is passed in first, then the aria-pressed property is changed
    // so we need to instead check the property it has before the button was pressed
    if (element.getAttribute("aria-pressed") === 'false') {
        if (seiyuusToShow.includes(element.value) === false) {
            seiyuusToShow.push(element.value)
        }
    } else {
        const index = seiyuusToShow.indexOf(element.value)
        if (index !== -1) {
            seiyuusToShow.splice(index, 1)
        }
    }

    // update cards
    filterActivitiesOnSeiyuu()
}

function filterActivitiesOnSeiyuu() {
    let seiyuuList;
    let activityArea = document.getElementById("activityArea");
    let card;

    if (seiyuusToShow.length === 0) {
        // show all
        for (card of activityArea.childNodes) {
            card.hidden = false;
        }
    } else {
        // get mode
        const anyOption = document.getElementById("anyOption").parentNode.classList.contains("active");
        const allOption = document.getElementById('allOption').parentNode.classList.contains("active");

        // filter
        if (allOption === true && anyOption === false) {
            // all mode example:
            // activity 1: sally & ruri & moe
            // activity 2: sally
            // activity 3: ruri
            // if filter is [sally, ruri]
            // then filter is a sublist of only activity one, hence will be displayed
            for (card of activityArea.childNodes) {
                seiyuuList = card.querySelector('.seiyuu-filter-meta-tags').classList;
                if (!(seiyuusToShow.every(val => seiyuuList.contains(val)))) {
                    card.hidden = true;
                } else {
                    card.hidden = false;
                }
            }
        } else {
            // any mode example:
            // activity 1: sally & ruri & moe
            // activity 2: sally
            // activity 3: ruri
            // activity 4: ruri & moe
            // activity 5: moe
            // if filter is [sally, ruri]
            // then all except 5 is displayed
            for (card of activityArea.childNodes) {
                let isHiddenFlag = true;

                seiyuuList = card.querySelector('.seiyuu-filter-meta-tags').classList;
                for (let token of seiyuuList) {
                    if (seiyuusToShow.includes(token)) {
                        isHiddenFlag = false;
                        break;
                    }
                }
                card.hidden = isHiddenFlag === true;
            }
        }
    }
}

function toggleTimeDisplay() {
    const displayTimeCheckbox = document.getElementById("ifUserTimeSwitch")

    $(".activity-time").each((index, element) => {
        // get each element's card's time meta
        const startTimeUTCString = element.parentNode.parentNode.parentNode.querySelector(".start-time-meta-tags").innerText;
        const endTimeUTCString = element.parentNode.parentNode.parentNode.querySelector(".end-time-meta-tags").innerText;

        const isFullDay = element.parentNode.parentNode.parentNode.querySelector(".is-full-day-meta-tags").innerText === "true";

        if (displayTimeCheckbox.checked === true) {
            // convert the time
            let localStartTimeString;
            let localEndTimeString;

            const userTimezone = moment.tz.guess()

            // display in user's time
            if (isFullDay) {
                localStartTimeString = moment(startTimeUTCString).tz(userTimezone).format("YYYY/MM/DD");
                localEndTimeString = moment(endTimeUTCString).tz(userTimezone).format("YYYY/MM/DD zz");
            } else {
                localStartTimeString = moment(startTimeUTCString).tz(userTimezone).format("YYYY/MM/DD LT");
                localEndTimeString = moment(endTimeUTCString).tz(userTimezone).format("YYYY/MM/DD LT zz");
            }

            if (endTimeUTCString) {
                element.childNodes[1].nodeValue = " " + localStartTimeString + " — " + localEndTimeString;
            } else {
                element.childNodes[1].nodeValue = " " + localStartTimeString + " " + moment(startTimeUTCString).tz(userTimezone).format("zz");
            }
        } else {
            // display in JST time
            let jstStartTimeString;
            let jstEndTimeString;

            if (isFullDay) {
                jstStartTimeString = moment(startTimeUTCString).tz("Asia/Tokyo").format("YYYY/MM/DD");
                jstEndTimeString = moment(endTimeUTCString).tz("Asia/Tokyo").format("YYYY/MM/DD");
            } else {
                jstStartTimeString = moment(startTimeUTCString).tz("Asia/Tokyo").format("YYYY/MM/DD LT");
                jstEndTimeString = moment(endTimeUTCString).tz("Asia/Tokyo").format("YYYY/MM/DD LT");
            }

            if (endTimeUTCString) {
                element.childNodes[1].nodeValue = " " + jstStartTimeString + " — " + jstEndTimeString + " JST";
            } else {
                element.childNodes[1].nodeValue = " " + jstStartTimeString + " JST"
            }
        }
    });
}

$(document).ready(function () {
    $.ajax({
        type: 'GET',
        url: 'api/activityData',
        success: function (data) {
            const activities = data.sort((a, b) => new Date(b["startDate"]) - new Date(a["startDate"]))
            let activity;
            for (activity of activities) {
                const twitterId = activity["relatedTweetId"];
                if (twitterId !== "") {
                    twttr.widgets.createTweet(
                        twitterId,
                        document.getElementById("twitterEmbed" + activities.indexOf(activity))
                    )
                }
            }
        }
    })
});

$('[data-toggle="tooltip"]').tooltip()