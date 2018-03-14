const template = username => 
`<span>
    <button type="button" id="reportButtonExtension" class="
        EdgeButton
        EdgeButton--danger
        EdgeButton--small 
        
        button-text
        follow-text">
        <span aria-hidden="true">Spam</span>
        <span class="u-hiddenVisually">Report <span class="username u-dir u-textTruncate" dir="ltr">@<b>${username}</b></span></span>
    </button>
</span>`

const handleReport = (username, userId, elementToRemove) => {
    const xhr = new XMLHttpRequest()
    const params = `authenticity_token=${authenticityToken}&report_type="spam"&block_user=true&user_id=${userId}`
    xhr.open('POST', 'https://twitter.com/i/user/report_spam', true)
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=UTF-8")
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest")
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 403)) {
            console.log(`Successfully reported and blocked ${username}`) 
            elementToRemove.remove()
        }
    }
    xhr.send(params)
}

const authenticityToken = $("#signout-form input.authenticity_token").val()

const addButton = () => {
    console.log('Will add buttons')
    
    $('.GridTimeline-items')
        .find('.user-actions')
        .each((_index, element) => {
            if ($(element).find('#reportButtonExtension').length === 0) {
                const screenName = $(element).data('screen-name')
                const userId = $(element).data('user-id')
                const button = $(template(screenName))
                const removeOnSucess = $(element).closest('.ProfileCard')
                
                button.click(() => handleReport(screenName, userId, removeOnSucess))
                button.insertAfter($(element).find('.user-actions-follow-button'))
            }
        })
}


window.onload = () => { 
    let targetNode = document.getElementsByClassName('GridTimeline')[0]
    const config = { subtree: true, childList: true }
    const observer = new MutationObserver(() => {
        console.log('DOM mutated')
        addButton()
    });
    
    if (targetNode) {
        addButton()
        observer.observe(targetNode, config);
    }

    chrome.runtime.onMessage.addListener(
        (request, sender, sendResponse) => {
            console.log('Chrome runtime message recived')
            if (request.addButton)
            {
                // Hacky but it's the only way I could figure out how to get it working
                // when you do the first change the your followers-page
                setTimeout(() => {
                    addButton()
                    sendResponse({success: true});
                }, 1000)
            }

            // If targetNode is not set, try again 
            if (!targetNode) {
                let targetNode = document.getElementsByClassName('GridTimeline')[0]
                // Use DOM observer since it can take too long before the DOM is
                // rendered so just triggering on message alone is not enough
                observer.observe(targetNode, config); 
            }
    })
}
