// Hard-coded, replace with your public key
const publicVapidKey = 'BMMkl5rqLppc89anQGAxewXdYAWZo7uOEqTVYuER-pr130ZwKncaDOUEb7X30f8h97gaLYKTS_r6LbN7TVSSAOg';

async function toggleNotify(element) {
    if ('serviceWorker' in navigator) {
        if ($(element).hasClass("btn-primary")) {
            $(element).removeClass("btn-primary");
            $(element).addClass("btn-secondary");

            element.childNodes[1].nodeValue = " Unsubscribe"

            // Register a service worker
            console.log('Registering service worker');
            const registration = await navigator.serviceWorker.register('/worker.js', {scope: '/'});
            console.log('Registered service worker');

            console.log('Registering push');
            let manager = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                // The `urlBase64ToUint8Array()` function is the same as in
                // https://www.npmjs.com/package/web-push#using-vapid-key-for-applicationserverkey
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            });
            console.log('Registered push');

            // Send Test push
            console.log('Sending push');

            // prepare body
            let bodyToSend = {
                subscription: JSON.stringify(manager),
                time: element.parentNode.parentNode.parentNode.querySelector(".start-time-meta-tags").innerText,
                title: element.parentNode.querySelector(".card-title").innerText,
                id: element.parentNode.parentNode.parentNode.querySelector(".id-meta-tags").innerText
            }

            await fetch('subscription/subscribe', {
                method: 'POST',
                body: JSON.stringify(bodyToSend),
                headers: {
                    'content-type': 'application/json'
                }
            });
            console.log('Sent push');
        } else {
            $(element).removeClass("btn-secondary");
            $(element).addClass("btn-primary");

            element.childNodes[1].nodeValue = " Subscribe"

            let bodyToSend = {
                time: element.parentNode.parentNode.parentNode.querySelector(".start-time-meta-tags").innerText,
                title: element.parentNode.querySelector(".card-title").innerText,
                id: element.parentNode.parentNode.parentNode.querySelector(".id-meta-tags").innerText
            }

            await fetch('subscription/unsubscribe', {
                method: 'POST',
                body: JSON.stringify(bodyToSend),
                headers: {
                    'content-type': 'application/json'
                }
            });
        }
    } else {
        alert("Your browser does not support push notifications. ")
    }
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}