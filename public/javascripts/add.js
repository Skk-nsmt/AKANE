var isAllChecked = false;
var numIndividualSelected = 0;
var extraLinkCount = 0;

function toggleFullDayEvent() {
    const isFullDayEventCheckbox = document.getElementById("isFullDayEvent");
    const startDateInput = document.getElementById("eventStartTime");
    const endDateInput = document.getElementById("eventEndTime");

    if (isFullDayEventCheckbox.checked === true) {
        startDateInput.type = "date";
        endDateInput.type = "date";
    } else {
        startDateInput.type = "datetime-local";
        endDateInput.type = "datetime-local";
    }
}

function toggleEndTimeUnknown() {
    const isEndTimeUnknownCheckbox = document.getElementById("isEndTimeUnknown");
    const eventEndTimeInput = document.getElementById("eventEndTime");

    if (isEndTimeUnknownCheckbox.checked === true) {
        eventEndTimeInput.disabled = true;
        eventEndTimeInput.value = ""
        eventEndTimeInput.required = false;
    } else {
        eventEndTimeInput.disabled = false;
        eventEndTimeInput.required = true;
    }
}

function toggleIndividualSelect(clicked_id) {
    const allCheckbox = document.getElementById("checkboxAll");
    const clickedCheckbox = document.getElementById(clicked_id);

    if (clickedCheckbox.checked === true) {
        numIndividualSelected++;
    } else {
        numIndividualSelected--
    }

    if (numIndividualSelected === 0) {
        allCheckbox.disabled = false
    } else {
        allCheckbox.checked = false
        allCheckbox.disabled = true
    }
}

function toggleAllSelect() {
    let idNames = ["amaki", "umino", "kawase", "kuraoka", "saijo", "shirosawa", "suzuhana", "takatsuji",
        "takeda", "hokaze", "miyase", "hanakawa"]

    const allCheckbox = document.getElementById("checkboxAll")
    if (allCheckbox.checked === true) {
        isAllChecked = true;
        numIndividualSelected = 0;
        var individualCheckbox

        let name;
        for (name of idNames) {
            individualCheckbox = document.getElementById("checkbox" + name);
            individualCheckbox.checked = false;
            individualCheckbox.disabled = true;
        }
    } else {
        isAllChecked = false;

        let name;
        for (name of idNames) {
            individualCheckbox = document.getElementById("checkbox" + name);
            individualCheckbox.disabled = false;
        }
    }
}

function addLinkField() {
    extraLinkCount++
    var numLinkField = document.getElementById("numRelatedLinks")
    numLinkField.value++;
    var inputGroup = document.createElement("div")

    inputGroup.setAttribute("class", "input-group mt-2")

    var newLinkInput = document.createElement("input")

    newLinkInput.setAttribute("class", "form-control")
    newLinkInput.setAttribute("type", "url")
    newLinkInput.setAttribute("id", "eventLink" + extraLinkCount)
    newLinkInput.setAttribute("name", "eventLink" + extraLinkCount)
    newLinkInput.setAttribute("placeholder", "https://...")
    newLinkInput.setAttribute("aria-describedby", "eventLinkHelp")

    inputGroup.appendChild(newLinkInput)

    var inputGroupAppendDiv = document.createElement("div")
    inputGroupAppendDiv.setAttribute("class", "input-group-append")

    var inputGroupAppendBtn = document.createElement("button")
    inputGroupAppendBtn.textContent = "Remove"
    inputGroupAppendBtn.setAttribute("class", "btn btn-primary")
    inputGroupAppendBtn.setAttribute("onclick", "removeLinkInput(this)")

    inputGroupAppendDiv.appendChild(inputGroupAppendBtn)
    inputGroup.appendChild(inputGroupAppendDiv)

    var eventLinks = document.getElementById("links")
    eventLinks.insertBefore(inputGroup, document.getElementById("eventLinkHelp"))
}

function removeLinkInput(element) {
    var inputGroup = element.parentNode.parentNode;
    inputGroup.parentNode.removeChild(inputGroup);

    extraLinkCount--
    var numLinkField = document.getElementById("numRelatedLinks")
    numLinkField.value--;
}

function participantsCheckValidity() {
    if (isAllChecked === true && numIndividualSelected === 0) {
        return true;
    }

    if (isAllChecked === false && numIndividualSelected > 0) {
        return true;
    }

    return false;
}

window.addEventListener('load', function () {
    // document.getElementById("activityForm").reset();

    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.getElementsByClassName('needs-validation');
    var validateGroup = document.getElementsByClassName('validate-me');
    // Loop over them and prevent submission
    var validation = Array.prototype.filter.call(forms, function (form) {
        form.addEventListener('submit', function (event) {
            if (form.checkValidity() === false || participantsCheckValidity() === false) {
                event.preventDefault();
                event.stopPropagation();

                for (var i = 0; i < validateGroup.length; i++) {
                    validateGroup[i].classList.add('was-validated');
                }

                const allCheckbox = document.getElementById("checkboxAll");
                let idNames = ["amaki", "umino", "kawase", "kuraoka", "saijo", "shirosawa", "suzuhana", "takatsuji",
                    "takeda", "hokaze", "miyase", "hanakawa"]

                if (isAllChecked === false && numIndividualSelected === 0) {
                    allCheckbox.classList.add('is-invalid');
                    var names
                    var individualCheckbox

                    for (names of idNames) {
                        individualCheckbox = document.getElementById("checkbox" + names);
                        individualCheckbox.classList.add('is-invalid');
                    }
                } else if ((isAllChecked === true && numIndividualSelected === 0) || (isAllChecked === false && numIndividualSelected > 0)) {
                    allCheckbox.classList.remove('is-invalid')
                    allCheckbox.classList.add('is-valid');

                    for (names of idNames) {
                        individualCheckbox = document.getElementById("checkbox" + names);
                        individualCheckbox.classList.remove('is-invalid')
                        individualCheckbox.classList.add('is-valid');
                    }
                }
            }
        }, false);
    });
}, false);

$(document).ready(function () {
    let idNames = ["amaki", "umino", "kawase", "kuraoka", "saijo", "shirosawa", "suzuhana", "takatsuji",
        "takeda", "hokaze", "miyase", "hanakawa"]
    for (name of idNames) {
        var individualCheckbox = document.getElementById("checkbox" + name);
        if (individualCheckbox.checked === true) {
            numIndividualSelected++
        }
    }
})